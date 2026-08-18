# Chaibook

Chaibook is a NotebookLM-style RAG (Retrieval-Augmented Generation) application. You create **workspaces**, add **sources** (PDFs, websites, YouTube videos, or pasted text/markdown), and then **chat** with an AI that answers using only your indexed material — with inline citations back to the exact source and page. Beyond chat, Chaibook generates **learning artifacts** (summaries, key takeaways, flashcards, quizzes, mind maps, and long-form reports) from your sources, remembers useful facts about you across conversations via **Mem0**, and can optionally reach the live web via **Tavily** web search.

The system is a monorepo with two apps: a **Next.js 16** client (port `3000`) and an **Express 5 / TypeScript** API server (port `8081`). Heavy work (content extraction, chunking, embedding, indexing, artifact generation, and conversation summarization) runs asynchronously through **Inngest** background jobs so the request path stays fast.

## Features

- **Workspaces** — isolated notebooks, each with its own sources, conversations, artifacts, and a default chat model.
- **Sources** — ingest **PDF** (upload), **Website** (Firecrawl scrape), **YouTube** (transcript), and **Text / Markdown** (pasted). Each source is extracted, chunked, embedded, and indexed for retrieval.
- **Chat with citations + web search** — streaming RAG chat that answers from your workspace sources with inline `[1]`, `[2]` citations, plus an optional Tavily `web_search` tool that cites `[W1]`, `[W2]`.
- **Memory (Mem0)** — the assistant learns and recalls durable facts about the user across conversations; memories are also editable manually.
- **Learn artifacts** — generate **Summary**, **Takeaways**, **Flashcards**, **Quiz**, **Mind Map**, and **Report** from selected (or all) ready sources.
- **Rolling conversation summaries** — long chats are periodically summarized to keep context tight and cheap.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Monorepo Folder Structure](#monorepo-folder-structure)
- [Core Workflows](#core-workflows)
- [RAG Pipeline Deep-Dive](#rag-pipeline-deep-dive)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [Environment Variables](#environment-variables)
- [Local Setup & Commands](#local-setup--commands)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Tech Stack

| Layer | Technology | Role in Chaibook |
| --- | --- | --- |
| Client framework | **Next.js 16** (App Router) + **React 19** | UI, routing, server-side session checks, `/api/*` proxy rewrites to the API server. |
| Client data | **TanStack Query** | Server-state caching/mutations for workspaces, sources, artifacts, memories. |
| Client chat | **Vercel AI SDK** (`ai`, `@ai-sdk/react`) + **Streamdown** | `useChat` streaming UI and markdown/code rendering of assistant replies. |
| Client state | **Zustand** | Local UI state (e.g. chat stores) outside server state. |
| UI components | **shadcn** on **base-ui** primitives + **Tailwind CSS v4** | Component library; base-ui uses `render`/`nativeButton` conventions (see AGENTS.md). |
| Diagrams / charts | **@xyflow/react**, **recharts**, **mermaid** | Mind maps, charts, and rendered diagrams in artifacts. |
| API server | **Express 5** + **TypeScript** (ESM, run via `tsx`) | REST API, auth handoff, chat streaming, Inngest serve endpoint. |
| Auth | **better-auth** (Prisma adapter, Google social login) | Sessions/cookies; auth routes proxied through the Next client. |
| Database | **PostgreSQL** (Neon) via **Prisma 7** + `@prisma/adapter-pg` | Users, workspaces, sources, chunks, conversations, messages, artifacts. |
| Vector store | **Pinecone** (serverless, cosine) | Per-workspace namespaces of chunk embeddings for retrieval. |
| AI / LLM | **OpenAI** (`gpt-4o-mini` / `gpt-4o`, `text-embedding-3-small`) | Chat completions, artifact generation, and 1536-dim embeddings. |
| Memory | **Mem0** (`mem0ai`) | Long-term, user-scoped memory with semantic search. |
| Web search | **Tavily** (`@tavily/core`) | Optional live web results injected into chat. |
| Ingestion | **Firecrawl** (website), **youtube-transcript** (YT), **unpdf** (PDF text), **Cloudinary** (PDF storage) | Turn external content into extractable text. |
| Background jobs | **Inngest** | `source/created`, `conversation/summarize`, `artifact/generate` workers. |
| Uploads | **Multer** (memory storage) | Receives PDF multipart uploads before Cloudinary. |

## Architecture Overview

The client never talks to Pinecone/OpenAI/etc. directly. It calls same-origin `/api/*` routes, which Next.js rewrites to the Express server. The server owns all secrets and orchestrates the AI/data services. Long-running work is offloaded to Inngest workers that call back into the server's `/api/inngest` endpoint.

```mermaid
flowchart LR
    Browser["Browser (React 19 UI)"]

    subgraph Client["Next.js 16 · :3000"]
        Proxy["proxy.ts route guard\n+ next.config.ts rewrites"]
    end

    subgraph Server["Express 5 API · :8081"]
        Auth["better-auth\n/api/auth/*"]
        REST["REST controllers\n/api/workspaces, /api/memory"]
        Chat["RAG chat stream\n/api/workspaces/:id/chat"]
        InngestServe["/api/inngest (serve)"]
    end

    subgraph Jobs["Inngest workers"]
        W1["process-source"]
        W2["generate-artifact"]
        W3["summarize-conversation"]
    end

    PG[("PostgreSQL\nPrisma")]
    Pine[("Pinecone\nvectors")]
    OpenAI["OpenAI\nchat + embeddings"]
    Mem0["Mem0\nmemory"]
    Tavily["Tavily\nweb search"]
    Firecrawl["Firecrawl"]
    YT["YouTube transcript"]
    Cloud["Cloudinary\nPDF storage"]

    Browser --> Client
    Client -->|"/api/* rewrite"| Server

    Auth --> PG
    REST --> PG
    Chat --> PG
    Chat --> Pine
    Chat --> OpenAI
    Chat --> Mem0
    Chat --> Tavily

    REST -->|enqueue events| InngestServe
    Chat -->|enqueue events| InngestServe
    InngestServe --> Jobs

    W1 --> Firecrawl
    W1 --> YT
    W1 --> Cloud
    W1 --> OpenAI
    W1 --> Pine
    W1 --> PG
    W2 --> OpenAI
    W2 --> PG
    W3 --> OpenAI
    W3 --> Mem0
    W3 --> PG
```

**Ports & communication**

- **Client** runs on `http://localhost:3000`.
- **Server** runs on `http://localhost:8081`.
- The client's `next.config.ts` rewrites `/api/auth/*`, `/api/workspaces` (+ `/:path*`), and `/api/memory` (+ `/:path*`) to `${API_URL}` (defaults to `http://localhost:8081`). Because auth is proxied through the client origin, **better-auth's base URL is the client URL** (`BETTER_AUTH_URL=http://localhost:3000`), and cookies are first-party to the client.
- CORS on the server allows `CLIENT_URL` with `credentials: true`.

## Monorepo Folder Structure

```text
NoteBookLM/
├── .Notes/                 # Pre-drawn flow diagrams (embedded below)
├── commands.txt            # Inngest dev command
├── client/                 # Next.js 16 frontend (:3000)
└── server/                 # Express 5 API (:8081)
```

### Client (`client/`) — feature-module convention

The client is organized by **feature**, not by file type. Each feature is a self-contained module with `components/`, `hooks/`, `lib/` (api, types, routes, constants), and sometimes `stores/`, all re-exported through a single `index.ts` **barrel**. App Router pages stay thin and compose feature exports.

```text
client/
├── app/                          # Next.js App Router
│   ├── (auth)/login/             # Public login route group
│   ├── (protected)/              # Auth-guarded route group
│   │   ├── dashboard/            # Workspace list / home
│   │   ├── settings/memory/      # Mem0 memory management UI
│   │   └── workspace/[id]/       # Workspace: chat, sources, learn, settings
│   ├── layout.tsx                # Root layout (providers, theme)
│   └── page.tsx                  # Landing page
├── components/
│   ├── providers/                # query-provider (TanStack), theme-provider
│   └── ui/                       # shadcn/base-ui primitives (button, dialog, ...)
├── features/                     # Feature modules (barrel per feature)
│   ├── auth/                     # better-auth client, session hook, route guards
│   ├── workspaces/               # workspace CRUD (components/hooks/lib)
│   ├── sources/                  # source ingest UI, hooks, api, types
│   ├── chat/                     # streaming chat UI, citations, zustand stores
│   ├── learn/                    # learning artifacts UI + hooks
│   └── memory/                   # Mem0 memory UI + hooks
├── shared/
│   ├── components/               # streamdown-content (markdown/code renderer)
│   ├── hooks/                    # use-debounced-value, ...
│   └── lib/api.ts                # apiFetch wrapper (credentials: 'include', ApiError)
├── hooks/use-mobile.ts
├── lib/utils.ts                  # cn() etc.
├── proxy.ts                      # Route guard: fetches session, redirects
└── next.config.ts                # /api/* rewrites → API server
```

Feature-module conventions:

- **Barrel exports** — consumers import from `@/features/<feature>` (e.g. `import { useSources } from "@/features/sources"`), never deep paths.
- **`lib/api.ts`** per feature wraps `shared/lib/api.ts`'s `apiFetch`, which sends `credentials: "include"` and throws a typed `ApiError`.
- **`hooks/`** wrap TanStack Query (`useQuery`/`useMutation`) with a `*Keys` query-key factory (e.g. `sourceKeys`).
- **Chat streaming** uses the AI SDK's `useChat` against `POST /api/workspaces/:id/chat`; the server streams a UI message stream and returns the conversation id via the `X-Conversation-Id` response header.
- **shadcn on base-ui** — components use base-ui primitives; follow the `render` prop and `nativeButton` conventions (see `client/AGENTS.md`).

### Server (`server/`) — layered convention

The server follows a strict **routes → controllers → services → repository** layering. Routes wire URLs to controllers; controllers validate input (Zod) and read `req.session`; services hold business logic and orchestration; repositories are the only layer that touches Prisma. `lib/` holds integrations (OpenAI, Pinecone, Mem0, Tavily, Firecrawl, Cloudinary, auth, chunking, RAG).

```text
server/
├── prisma/
│   ├── schema.prisma             # Postgres models (generates to src/generated/prisma)
│   └── migrations/               # SQL migration history
├── src/
│   ├── index.ts                  # App entry: CORS, auth handler, express.json,
│   │                             #   /api/inngest, /health, registerRoutes, errorHandler
│   ├── routes/                   # Express routers (nested under /api/workspaces)
│   │   ├── index.ts              # registerRoutes(): mounts + nests routers
│   │   ├── workspace.routes.ts   # requireAuth applied here (covers nested routers)
│   │   ├── source.routes.ts      # mergeParams: inherits :workspaceId
│   │   ├── chat.routes.ts        # conversationRoutes + chatRoutes
│   │   ├── artifact.routes.ts
│   │   └── memory.routes.ts
│   ├── controllers/              # Validate (Zod) + call services + shape responses
│   ├── services/                 # Business logic & orchestration
│   │   ├── workspace.services.ts
│   │   ├── source.services.ts        # ingest (PDF/website/YouTube/text)
│   │   ├── source.processing.services.ts  # extract → chunk → embed → index
│   │   ├── chat.services.ts          # RAG chat streaming pipeline
│   │   ├── conversation-memory.services.ts # rolling summaries → Mem0
│   │   ├── artifact.services.ts      # artifact CRUD + orchestration
│   │   └── artifact-generation.services.ts # LLM generation per artifact type
│   ├── repository/               # Prisma data access (only layer touching DB)
│   ├── lib/
│   │   ├── ai-config.ts          # Models, dims, chunk sizes, RAG top-k/threshold
│   │   ├── openai.ts             # embedTexts()
│   │   ├── pinecone.ts           # index mgmt, upsert/query/delete by namespace
│   │   ├── rag/retrieve.ts       # retrieveWorkspaceContext + buildChatSystemPrompt
│   │   ├── chunking.ts           # recursive character splitter + page chunking
│   │   ├── mem0.ts               # Mem0 client + list/search/add/update/delete
│   │   ├── tavily.ts             # web search + prompt formatting
│   │   ├── firecrawl.ts          # website scrape → markdown
│   │   ├── youtube.ts            # transcript fetch
│   │   ├── pdf.ts                # unpdf extraction (buffer or Cloudinary URL)
│   │   ├── cloudinary.ts         # PDF upload + signed download URL
│   │   ├── auth.ts               # better-auth config
│   │   ├── db.ts                 # Prisma client (pg adapter)
│   │   ├── *-events.ts           # Inngest enqueue helpers
│   │   └── session.ts            # Session type
│   ├── inngest/
│   │   ├── client.ts             # Inngest client ("chaibooklm") + event types
│   │   └── index.ts              # process-source, summarize-conversation, generate-artifact
│   ├── middlewares/              # require-auth, upload (multer), error-handler
│   ├── validators/               # Zod schemas per resource
│   ├── utils/                    # async-handler, chat-messages, sanitize, zod-error
│   └── types/app-error.ts        # ValidationError, NotFoundError, ...
├── prisma.config.ts
└── package.json
```

## Core Workflows

Each workflow below has a short explanation, a Mermaid diagram, and the matching hand-drawn flow image from `.Notes/`.

### Workspace lifecycle

A workspace is the top-level container owned by a user. `POST /api/workspaces` validates the body (`createWorkspaceSchema`), the service attaches `userId` from the session, and the repository persists it. Reads/updates/deletes are always scoped to the authenticated user (`getWorkspaceByIdForUser` throws `NotFoundError` if the workspace isn't theirs). Deleting a workspace cascades to its sources, conversations, and artifacts (Prisma `onDelete: Cascade`), and its Pinecone namespace can be wiped via `deleteWorkspaceVectors`.

```mermaid
sequenceDiagram
    participant UI as Client
    participant R as workspace.routes
    participant MW as requireAuth
    participant C as workspace.controller
    participant S as workspace.services
    participant DB as Prisma/Postgres

    UI->>R: POST /api/workspaces
    R->>MW: requireAuth
    MW->>MW: better-auth getSession(headers)
    MW-->>C: req.session.user
    C->>C: createWorkspaceSchema.parse(body)
    C->>S: createWorkspaceForUser(userId, input)
    S->>DB: insert workspace
    DB-->>S: workspace
    S-->>C: workspace
    C-->>UI: 201 Created (JSON)
```

![Workspace lifecycle flow](./.Notes/Workspace-Flow.png)

### Source routes / overview

All source endpoints are nested under a workspace (`/api/workspaces/:workspaceId/sources`, `mergeParams: true`) and inherit the workspace auth guard. Ingest endpoints create a `Source` row with status `PENDING`, then enqueue the `source/created` Inngest event; the heavy processing happens in the background worker.

```mermaid
flowchart TD
    A["POST /sources/upload (PDF)"] --> Z["createAndProcessSource"]
    B["POST /sources/import/website"] --> Z
    C["POST /sources/import/youtube"] --> Z
    D["GET /sources · GET /sources/:id"] --> R["read from Postgres"]
    E["DELETE /sources/:id · POST /sources/bulk-delete"] --> DEL["delete row (+ vectors/chunks)"]
    Z --> Row["Source row · status PENDING"]
    Row --> Ev["inngest.send(source/created)"]
    Ev --> Worker["process-source worker"]
```

![Source routes overview](./.Notes/Source-Routes.png)

### PDF ingestion

`POST /sources/upload` uses Multer memory storage (10 MB limit, `application/pdf` only). The buffer is uploaded to Cloudinary (unsigned preset, `chaibook/pdfs` folder). Text extraction is attempted immediately with `unpdf`; if that fails at upload time, the worker retries extraction by downloading the file from Cloudinary (falling back to a signed URL on `401`). A `PENDING` source is created and the `source/created` event is enqueued.

```mermaid
sequenceDiagram
    participant UI as Client
    participant M as Multer
    participant Ctl as source.controller
    participant Svc as source.services
    participant Cloud as Cloudinary
    participant PDF as unpdf
    participant DB as Postgres
    participant IN as Inngest

    UI->>M: multipart file="file"
    M->>Ctl: req.file.buffer
    Ctl->>Svc: uploadPdfSource(...)
    Svc->>Cloud: upload buffer (raw/upload)
    Cloud-->>Svc: secureUrl, publicId
    Svc->>PDF: extractPdfFromBuffer (best-effort)
    Svc->>DB: create Source (PENDING, metadata.fileUrl)
    Svc->>IN: send source/created
    Svc-->>UI: 201 source
```

![PDF ingestion flow](./.Notes/PDF%20FLOW.png)

### Website import

`POST /sources/import/website` scrapes the URL with **Firecrawl** (`formats: ["markdown"]`), stores the returned markdown as the source `content`, records the resolved `sourceUrl`, and enqueues processing.

```mermaid
sequenceDiagram
    participant UI as Client
    participant Svc as source.services
    participant FC as Firecrawl
    participant DB as Postgres
    participant IN as Inngest

    UI->>Svc: importWebsiteSource(url)
    Svc->>FC: scrape(url, markdown)
    FC-->>Svc: markdown, title, sourceUrl
    Svc->>DB: create Source WEBSITE (PENDING)
    Svc->>IN: send source/created
    Svc-->>UI: 201 source
```

![Website import flow](./.Notes/Website-Import.png)

### YouTube import

`POST /sources/import/youtube` parses the 11-char video id from common YouTube URL shapes (watch, `youtu.be`, embed, shorts), fetches the transcript with `youtube-transcript`, joins segments into `content`, and enqueues processing. Videos without captions produce a `ValidationError`.

```mermaid
sequenceDiagram
    participant UI as Client
    participant Svc as source.services
    participant YT as youtube-transcript
    participant DB as Postgres
    participant IN as Inngest

    UI->>Svc: importYoutubeSource(url)
    Svc->>YT: fetchTranscript(videoId)
    YT-->>Svc: transcript segments
    Svc->>DB: create Source YOUTUBE (PENDING)
    Svc->>IN: send source/created
    Svc-->>UI: 201 source
```

![YouTube import flow](./.Notes/YT-FLOW.png)

### Chunking

Extracted text is split by a **recursive character splitter** (`lib/chunking.ts`). It tries separators in order — `\n\n`, `\n`, `. `, ` `, then raw character slicing — and packs splits into chunks of ~**1000 characters** with **100-character overlap** (`CHUNK_SIZE` / `CHUNK_OVERLAP`). PDFs use `chunkPages()` so chunks never span two pages and each chunk carries a 1-based `page` in its metadata; the global `index` is renumbered across pages. Chunks are stored in the `source_chunk` table with an approximate `tokenCount` (`ceil(chars / 4)`).

```mermaid
flowchart LR
    T["Source text / pages"] --> SEP{"try separators\n\\n\\n → \\n → '. ' → ' ' → char"}
    SEP --> MERGE["mergeSplits into ~1000 chars\n(100 overlap)"]
    MERGE --> CH["TextChunk[] {index, content, metadata.page}"]
    CH --> DB[("source_chunk rows")]
```

![Chunking flow](./.Notes/Chunking.png)

### Indexing

The `process-source` worker runs the full pipeline as discrete Inngest steps: `mark-processing` → `extract-content` → `chunk-content` → `embed-and-index`. Embedding runs in batches of 50 via OpenAI `text-embedding-3-small` (1536 dims), and vectors are upserted into the workspace's Pinecone namespace. On success the source is marked `READY` with `chunkCount` and `indexedAt`; any failure marks it `FAILED` (with `processingError`) and re-throws so Inngest retries (up to 3×).

```mermaid
flowchart TD
    Ev["event: source/created"] --> P["mark-processing (status PROCESSING)"]
    P --> X["extract-content (unpdf / stored content)"]
    X --> C["chunk-content (chunkText/chunkPages)"]
    C --> E["embed-and-index"]
    E --> Emb["OpenAI embeddings (batch 50)"]
    Emb --> Up["Pinecone upsert (namespace = workspaceId)"]
    Up --> Ready["status READY + chunkCount + indexedAt"]
    E -->|error| Fail["status FAILED (+processingError) → retry"]
```

![Indexing flow](./.Notes/Indexing-Flow.png)

### Pinecone vector store

Pinecone is a serverless **cosine** index (`PINECONE_INDEX`, default `chaibooklm`, 1536 dims), auto-created and polled for readiness on first use. Each **workspace is its own namespace**, so retrieval is naturally scoped. Every vector stores rich metadata (`workspaceId`, `sourceId`, `chunkId`, `chunkIndex`, `sourceTitle`, `sourceType`, `text` truncated to 35k chars, optional `page`) so retrieval and citations don't need a second Postgres query. Upserts batch 100 records; deletes are by `sourceId` filter (source delete) or whole-namespace (workspace delete).

```mermaid
flowchart LR
    subgraph Index["Pinecone index (cosine, 1536d)"]
        NS1["namespace: workspace A"]
        NS2["namespace: workspace B"]
    end
    Up["upsertSourceVectors\n(batch 100)"] --> NS1
    Q["queryWorkspaceVectors\n(topK, includeMetadata)"] --> NS1
    DelS["deleteSourceVectors\n(filter sourceId)"] --> NS1
    DelW["deleteWorkspaceVectors\n(deleteAll)"] --> NS2
```

![Pinecone vector store](./.Notes/Pinecone.png)

### Database schema / flow

PostgreSQL (via Prisma) is the system of record. Auth tables (`user`, `session`, `account`, `verification`) come from better-auth; the domain tables (`workspace`, `source`, `source_chunk`, `conversation`, `message`, `learning_artifact`) hang off `User` and cascade on delete. The repository layer is the only code that talks to Prisma.

```mermaid
flowchart LR
    U["user"] --> W["workspace"]
    W --> S["source"]
    S --> SC["source_chunk"]
    W --> CO["conversation"]
    CO --> ME["message"]
    W --> LA["learning_artifact"]
    U --> SE["session"]
    U --> AC["account"]
```

![Database schema flow](./.Notes/DB-Flow.png)

### Workspace chat streaming

`POST /api/workspaces/:workspaceId/chat` is the heart of the app. It validates the body, resolves (or creates) the conversation, saves the user message, then runs **RAG retrieval and Mem0 memory search in parallel**. It builds a system prompt from the retrieved chunks + user memories + rolling summary (+ web-search hints), streams the model response with the AI SDK, and on finish persists the assistant message with citations, touches the conversation, auto-titles it, and (every 8 messages) enqueues a summary job while asynchronously feeding the turn to Mem0. The new/known conversation id is returned in the `X-Conversation-Id` header, and the body is a streamed UI message stream.

```mermaid
sequenceDiagram
    participant UI as Client (useChat)
    participant C as chat.controller
    participant S as chat.services
    participant DB as Postgres
    participant RAG as Pinecone+OpenAI
    participant Mem as Mem0
    participant LLM as OpenAI (streamText)
    participant TV as Tavily (optional)

    UI->>C: POST /chat {messages, model?, webSearch?}
    C->>S: streamWorkspaceChat(res, ...)
    S->>DB: save USER message (+ resolve/create conversation)
    par Parallel context
        S->>RAG: retrieveWorkspaceContext(query)
        S->>Mem: searchUserMemories(userId, query)
    end
    S->>S: buildChatSystemPrompt(chunks, memories, summary, web)
    S->>LLM: streamText(system, messages, tools?)
    opt webSearch enabled
        LLM->>TV: web_search(query)
        TV-->>LLM: results [W1..]
    end
    LLM-->>UI: stream tokens (X-Conversation-Id header)
    S->>DB: save ASSISTANT message + citations
    S->>DB: touch + auto-title conversation
    S-->>S: every 8 msgs → enqueue conversation/summarize
    S-->>Mem: addMemoriesFromMessages (fire-and-forget)
```

![Workspace chat streaming flow](./.Notes/streamWorkSpaceChat-Flow.png)

### Learn artifacts generation

`POST /api/workspaces/:workspaceId/artifacts` validates the artifact `type` (and optional `sourceIds`), verifies at least one `READY` source exists, creates a `PENDING` `learning_artifact` row, and enqueues `artifact/generate`. The worker gathers source text (capped at 120k chars), calls the LLM with a type-specific prompt/schema (structured JSON for takeaways/flashcards/quiz/mindmap/report, markdown for summary), and marks the artifact `READY` with the generated `content` — or `FAILED` on error.

```mermaid
sequenceDiagram
    participant UI as Client
    participant S as artifact.services
    participant DB as Postgres
    participant IN as Inngest
    participant W as generate-artifact worker
    participant LLM as OpenAI

    UI->>S: POST /artifacts {type, sourceIds?}
    S->>DB: gatherSourceContext (READY sources)
    S->>DB: create artifact (PENDING)
    S->>IN: send artifact/generate
    S-->>UI: 201 artifact (PENDING)
    IN->>W: artifact/generate
    W->>DB: status PROCESSING
    W->>LLM: generate type-specific content
    LLM-->>W: JSON / markdown
    W->>DB: status READY + content
```

![Learn artifacts generation flow](./.Notes/Artifacts-Flow.png)

## RAG Pipeline Deep-Dive

The RAG configuration lives in `server/src/lib/ai-config.ts`:

| Setting | Value | Meaning |
| --- | --- | --- |
| `CHAT_MODEL` / `CHAT_MODELS` | `gpt-4o-mini` (default), `gpt-4o` | Allowed chat models. |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | Embedding model for indexing + queries. |
| `EMBEDDING_DIMENSIONS` | `1536` | Must match the Pinecone index dimension. |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | `1000` / `100` | Chunk sizing (characters). |
| `RAG_TOP_K` | `6` | Chunks fetched from Pinecone per query. |
| `RAG_MIN_SCORE` | `0.35` | Minimum cosine score to keep a chunk. |
| `CONVERSATION_SUMMARY_INTERVAL` | `8` | Summarize every N persisted messages. |
| `RECENT_MESSAGE_WINDOW` | `12` | Recent messages kept in context once a summary exists. |

**Chunking → embeddings → upsert (ingest time).** Text is split with the recursive character splitter (~1000 chars, 100 overlap; page-aware for PDFs). Chunks are persisted to `source_chunk`, embedded in **batches of 50** via `embedTexts()`, and upserted (in **batches of 100**) into the workspace's Pinecone namespace with metadata that carries the chunk `text`, `sourceTitle`, `sourceType`, `chunkIndex`, and `page`.

**Retrieval + threshold (query time).** `retrieveWorkspaceContext(workspaceId, query)` embeds the user's latest message, queries the workspace namespace for `topK = 6` matches with metadata, and **drops any match scoring below `0.35`**. Surviving matches become `RetrievedChunk`s and, in parallel, the assistant's citation records (`sourceId`, `sourceTitle`, `chunkId`, `page`, `excerpt` (first 280 chars), `score`).

**Prompt construction (`buildChatSystemPrompt`).** The system prompt is assembled from ordered sections:

1. Base persona ("You are ChaibookLM...").
2. **Web search hints** — only if `webSearch` is enabled and `TAVILY_API_KEY` is set; instructs the model to cite web results as `[W1]`, `[W2]`.
3. **User memories** — Mem0 results rendered as a bullet list ("Known facts about this user").
4. **Rolling summary** — the conversation's stored `summary`, if any.
5. **Retrieved context** — numbered blocks `[1] Title (TYPE), page N` + chunk text, with instructions to cite inline `[1]`, `[2]` and to say so when context is insufficient. If no chunks pass the threshold, the model is told there's no indexed/relevant content and to avoid inventing citations.

**Merging Mem0 + Tavily.** Mem0 memories are fetched **in parallel with** Pinecone retrieval (`Promise.all`) and injected into the system prompt as durable user facts. Tavily is exposed to the model as a `web_search` **tool** (not pre-fetched): when the model calls it, results are formatted as `[W1]`, `[W2]` blocks and, on finish, appended to the stored citations as `WEB` sources. Tool-augmented turns are bounded with `stopWhen: isStepCount(3)`. After each turn, the user/assistant pair is sent to Mem0 (`infer: true`, fire-and-forget) so future chats recall it.

```mermaid
flowchart TD
    Q["User query"] --> EMB["embedTexts (text-embedding-3-small)"]
    EMB --> PINE["Pinecone query topK=6 (namespace=workspace)"]
    PINE --> FILT{"score ≥ 0.35 ?"}
    FILT -->|no| DROP["drop match"]
    FILT -->|yes| CHUNKS["RetrievedChunk[] + citations"]
    Q -.parallel.-> MEM["Mem0 searchUserMemories (topK 8)"]
    CHUNKS --> PROMPT["buildChatSystemPrompt"]
    MEM --> PROMPT
    SUM["conversation.summary"] --> PROMPT
    PROMPT --> ST["streamText (gpt-4o-mini/4o)"]
    ST -->|webSearch on| TV["web_search tool → Tavily"]
    TV --> ST
    ST --> OUT["streamed reply + [1].. / [W1].. citations"]
```

## API Reference

Base URL is same-origin `/api/*` on the client (rewritten to the Express server) or directly `http://localhost:8081/api/*`. All responses are JSON unless noted; errors use `{ "error": string, "details"?: unknown }` with appropriate status codes (`400` validation, `401` unauthorized, `404` not found). Auth uses better-auth session cookies (`credentials: "include"`).

**Auth requirement:** every route under `/api/workspaces` and `/api/memory` requires a valid session (guarded by `requireAuth`; nested source/conversation/chat/artifact routers inherit it). The `/api/auth/*` and `/api/inngest` routes are handled by better-auth and Inngest respectively.

### Auth & system

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| ALL | `/api/auth/*` | n/a | better-auth handler (sign-in/out, sessions, Google OAuth, `get-session`). |
| ALL | `/api/inngest` | Inngest keys | Inngest serve endpoint for the three background functions. |
| GET | `/health` | none | Liveness check (`"Server is healthy!"`). |

### Workspaces

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/workspaces` | ✅ | List the current user's workspaces. |
| POST | `/api/workspaces` | ✅ | Create a workspace. Body: `{ title, description?, icon?, defaultModel? }` → `201`. |
| GET | `/api/workspaces/:workspaceId` | ✅ | Get one workspace (owned by user). |
| PATCH | `/api/workspaces/:workspaceId` | ✅ | Update (partial; at least one field). |
| DELETE | `/api/workspaces/:workspaceId` | ✅ | Delete workspace (cascades) → `204`. |

### Sources (nested under a workspace)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/workspaces/:workspaceId/sources` | ✅ | List sources. Query: `q?`, `type?`, `status?`. |
| POST | `/api/workspaces/:workspaceId/sources` | ✅ | Create TEXT/MARKDOWN source. Body (discriminated on `type`): `{ type, title, content }`. |
| POST | `/api/workspaces/:workspaceId/sources/upload` | ✅ | Upload a PDF (`multipart/form-data`, field `file`, ≤10 MB, optional `title`) → `201`. |
| POST | `/api/workspaces/:workspaceId/sources/import/website` | ✅ | Import a website. Body: `{ url, title? }` → `201`. |
| POST | `/api/workspaces/:workspaceId/sources/import/youtube` | ✅ | Import a YouTube transcript. Body: `{ url, title? }` → `201`. |
| POST | `/api/workspaces/:workspaceId/sources/bulk-delete` | ✅ | Body: `{ sourceIds: string[] }` → `204`. |
| GET | `/api/workspaces/:workspaceId/sources/:sourceId` | ✅ | Get one source. |
| DELETE | `/api/workspaces/:workspaceId/sources/:sourceId` | ✅ | Delete a source → `204`. |

### Conversations & chat (nested under a workspace)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/workspaces/:workspaceId/conversations` | ✅ | List conversations (recent first). |
| POST | `/api/workspaces/:workspaceId/conversations` | ✅ | Create an empty conversation. Body: `{ title? }` → `201`. |
| GET | `/api/workspaces/:workspaceId/conversations/:conversationId/messages` | ✅ | List messages (role, content, citations, timestamps). |
| DELETE | `/api/workspaces/:workspaceId/conversations/:conversationId` | ✅ | Delete a conversation (cascades messages) → `204`. |
| POST | `/api/workspaces/:workspaceId/chat` | ✅ | **Streaming** RAG chat. Body: `{ messages, conversationId?, model?, webSearch? }`. Returns a streamed UI message stream; sets the **`X-Conversation-Id`** response header. |

### Memory (Mem0)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/memory` | ✅ | List the user's memories (up to 100). |
| POST | `/api/memory` | ✅ | Create a memory. Body: `{ memory }` → `201`. |
| PATCH | `/api/memory/:memoryId` | ✅ | Update memory text. Body: `{ memory }`. |
| DELETE | `/api/memory/:memoryId` | ✅ | Delete a memory → `204`. |

### Artifacts (nested under a workspace)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/workspaces/:workspaceId/artifacts` | ✅ | List artifacts (recent first). |
| POST | `/api/workspaces/:workspaceId/artifacts` | ✅ | Create + enqueue generation. Body: `{ type, title?, sourceIds? }` where `type ∈ SUMMARY \| TAKEAWAYS \| FLASHCARDS \| QUIZ \| MINDMAP \| REPORT` → `201` (status `PENDING`). |
| GET | `/api/workspaces/:workspaceId/artifacts/:artifactId` | ✅ | Get one artifact (with `content` once `READY`). |
| DELETE | `/api/workspaces/:workspaceId/artifacts/:artifactId` | ✅ | Delete an artifact → `204`. |

> **Streaming note:** the chat response is not plain JSON — it's an AI SDK UI message stream written directly to the HTTP response (consumed by `useChat` on the client). The conversation id is delivered via the `X-Conversation-Id` header so the client can attach subsequent messages to the same conversation.

## Data Model

PostgreSQL via Prisma 7 (client generated to `server/src/generated/prisma`). Auth tables are managed by better-auth; domain tables cascade from `User`.

```mermaid
erDiagram
    User ||--o{ Session : has
    User ||--o{ Account : has
    User ||--o{ Workspace : owns
    Workspace ||--o{ Source : contains
    Workspace ||--o{ Conversation : contains
    Workspace ||--o{ LearningArtifact : contains
    Source ||--o{ SourceChunk : split_into
    Conversation ||--o{ Message : has

    User {
      string id PK
      string name
      string email UK
      boolean emailVerified
      string image
    }
    Session {
      string id PK
      string token UK
      datetime expiresAt
      string userId FK
    }
    Account {
      string id PK
      string providerId
      string accountId
      string userId FK
    }
    Workspace {
      string id PK
      string userId FK
      string title
      string description
      string icon
      string defaultModel
    }
    Source {
      string id PK
      string workspaceId FK
      enum type "PDF|WEBSITE|YOUTUBE|TEXT|MARKDOWN"
      string title
      string content
      string url
      enum status "PENDING|PROCESSING|READY|FAILED"
      json metadata
    }
    SourceChunk {
      string id PK
      string sourceId FK
      int index
      string content
      int tokenCount
      json metadata
    }
    Conversation {
      string id PK
      string workspaceId FK
      string title
      string summary
      int summaryMessageCount
      datetime summarizedAt
    }
    Message {
      string id PK
      string conversationId FK
      enum role "USER|ASSISTANT"
      string content
      json citations
    }
    LearningArtifact {
      string id PK
      string workspaceId FK
      enum type "SUMMARY|TAKEAWAYS|FLASHCARDS|QUIZ|MINDMAP|REPORT"
      string title
      json content
      string_array sourceIds
      enum status "PENDING|PROCESSING|READY|FAILED"
      json metadata
    }
```

Notes:

- **`SourceChunk`** has a unique `(sourceId, index)` constraint; the same chunks are mirrored as vectors in Pinecone (identified by `chunkId`).
- **`Message.citations`** stores the JSON array of source/web citations rendered by the client.
- **`LearningArtifact.sourceIds`** is a `String[]` recording which sources fed the generation; `content` holds type-specific JSON (or `{ markdown }`).
- A leftover **`Test`** model exists from initial scaffolding and is unused by the app.

## Environment Variables

Never commit real secrets. Use the placeholders below in `.env` files (`client/.env` and `server/.env`).

### Client (`client/.env`)

| Variable | Purpose | Example placeholder |
| --- | --- | --- |
| `API_URL` | Base URL of the Express API; used by `next.config.ts` rewrites to proxy `/api/*`. | `http://localhost:8081` |
| `NEXT_PUBLIC_APP_URL` | Public base URL of the client; used for server-side session fetches. | `http://localhost:3000` |

### Server (`server/.env`)

| Variable | Purpose | Example placeholder |
| --- | --- | --- |
| `PORT` | Port the Express server listens on. | `8081` |
| `CLIENT_URL` | Allowed CORS origin (the client). | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string (Prisma). | `postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require` |
| `BETTER_AUTH_SECRET` | Secret used by better-auth to sign sessions. | `<random-32+-char-secret>` |
| `BETTER_AUTH_URL` | Base URL better-auth runs under (the client origin, since auth is proxied). | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client id. | `<google-client-id>` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret. | `<google-client-secret>` |
| `FIRECRAWL_API_KEY` | Firecrawl API key (website scraping). | `fc-xxxxxxxx` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (PDF storage). | `<cloud-name>` |
| `CLOUDINARY_UPLOAD_PRESET` | Unsigned upload preset for PDFs. | `<unsigned-preset>` |
| `CLOUDINARY_API_KEY` | Cloudinary API key (signed download fallback). | `<cloudinary-api-key>` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (signed download fallback). | `<cloudinary-api-secret>` |
| `OPENAI_API_KEY` | OpenAI key (chat + embeddings). | `sk-xxxxxxxx` |
| `PINECONE_API_KEY` | Pinecone API key. | `pcsk_xxxxxxxx` |
| `PINECONE_INDEX` | Pinecone index name (auto-created if missing). | `chaibooklm` |
| `INNGEST_DEV` | Set to `1` for local Inngest dev mode. | `1` |
| `TAVILY_API_KEY` | Tavily key; enables the chat `web_search` tool. | `tvly-xxxxxxxx` |
| `MEM0_API_KEY` | Mem0 key; enables long-term memory. | `m0-xxxxxxxx` |

> Mem0 and Tavily are **optional**: if their keys are absent, memory calls and web search short-circuit safely (chat still works). Cloudinary `API_KEY`/`API_SECRET` are only needed for the signed-download fallback when the public PDF URL returns `401`.

## Local Setup & Commands

### Prerequisites

- **Node.js 20+** and npm.
- A **PostgreSQL** database (e.g. Neon) reachable via `DATABASE_URL`.
- Accounts/keys for **OpenAI** and **Pinecone** (required), and optionally **Mem0**, **Tavily**, **Firecrawl**, **Cloudinary**, **Google OAuth**.
- **npx** (bundled with npm) to run the Inngest dev CLI.

### 1. Install dependencies

```bash
# from the repo root
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

Create `server/.env` and `client/.env` using the tables above.

### 3. Database (server)

Prisma migrations and client generation:

```bash
cd server
npx prisma generate      # generate the Prisma client into src/generated/prisma
npx prisma migrate dev   # apply migrations to your database (local/dev)
```

### 4. Run everything (three processes, in order)

Start the **server** first, then **Inngest**, then the **client**.

```bash
# Terminal 1 — API server (tsx watch, port 8081)
cd server
npm run dev
```

```bash
# Terminal 2 — Inngest dev server (points at the server's serve endpoint)
npx --ignore-scripts=false inngest-cli@latest dev -u http://localhost:8081/api/inngest
```

```bash
# Terminal 3 — Next.js client (port 3000)
cd client
npm run dev
```

Then open `http://localhost:3000`.

### Available npm scripts

**Server (`server/package.json`)**

| Script | Command | What it does |
| --- | --- | --- |
| `npm run dev` | `tsx watch src/index.ts` | Run the API in watch mode (no build step). |
| `npm run build` | `tsc` | Type-check and compile TypeScript to `dist/`. |
| `npm start` | `node dist/index.js` | Run the compiled server (after `build`). |

**Client (`client/package.json`)**

| Script | Command | What it does |
| --- | --- | --- |
| `npm run dev` | `next dev` | Run the Next.js dev server on port 3000. |
| `npm run build` | `next build` | Production build. |
| `npm start` | `next start` | Serve the production build. |
| `npm run lint` | `eslint` | Lint the client. |

**Inngest (from repo root — see `commands.txt`)**

```bash
npx --ignore-scripts=false inngest-cli@latest dev -u http://localhost:8081/api/inngest
```

This launches the local Inngest dev server and registers the app by polling the server's `/api/inngest` endpoint, so `source/created`, `conversation/summarize`, and `artifact/generate` events are delivered to the workers. Without it running, sources stay `PENDING`, artifacts stay `PENDING`, and summaries never generate.

**Startup order matters:** server → Inngest → client. The server must be up so Inngest can reach `/api/inngest`; the client proxies `/api/*` to the server, so the server should be running before you use the UI.

## Deployment

Chaibook runs as a **split deployment**: the Next.js client is hosted on **Vercel**, and the Express + Inngest API server is hosted on **Render**. Managed services (Neon Postgres, Pinecone, Inngest Cloud, OpenAI, Mem0, Tavily, Firecrawl, Cloudinary) back both.

### Live environment

| Component | Platform | URL |
| --- | --- | --- |
| Client (Next.js) | Vercel | `https://chaibook-one.vercel.app` |
| API server (Express + Inngest) | Render (Web Service) | `https://notebooklm-rb3f.onrender.com` |
| Inngest serve endpoint | Render (same service) | `https://notebooklm-rb3f.onrender.com/api/inngest` |
| Health check | Render (same service) | `https://notebooklm-rb3f.onrender.com/health` |
| Background jobs | Inngest Cloud | registered against the serve endpoint |

### Why split (client on Vercel, server on Render)

- **Client → Vercel.** The App Router client is a natural fit for Vercel's serverless/edge model.
- **Server → Render.** The API is a long-running Express process that also hosts the Inngest `serve` endpoint and runs multi-step background work (extract → chunk → embed → index, artifact generation, summarization). Render runs it as a persistent process, which suits an always-on Express app.
- The client's `next.config.ts` **rewrites** proxy same-origin `/api/auth/*`, `/api/workspaces*`, and `/api/memory*` to the Render server, so the browser only ever talks to the Vercel origin and cookies stay first-party.
- **Advanced alternative (not used here):** port the Express handlers to Next.js Route Handlers and use `inngest/next` to run everything on Vercel. This is a larger refactor; the current codebase keeps the two apps separate.

### 1. Provision managed services

- **Neon Postgres** → `DATABASE_URL` (pooled connection string, `sslmode=require`).
- **Pinecone** index (`PINECONE_INDEX`, 1536-dim, cosine) → `PINECONE_API_KEY` (the app auto-creates the index if missing).
- **Inngest Cloud** app → production **signing key** + **event key**.
- **OpenAI**, **Mem0**, **Tavily**, **Firecrawl**, **Cloudinary** keys.

### 2. Deploy the API server to Render

Create a **Web Service** pointing at the repo with:

- **Root Directory:** `server`
- **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- **Start Command:** `npm start` (runs `node dist/index.js`)
- **Health Check Path:** `/health`

**Server env vars (Render):**

| Var | Value |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string |
| `BETTER_AUTH_SECRET` | strong random secret |
| `BETTER_AUTH_URL` | the **client** URL — `https://chaibook-one.vercel.app` |
| `CLIENT_URL` | the client URL — `https://chaibook-one.vercel.app` (CORS origin) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX` | AI / vector store |
| `MEM0_API_KEY`, `TAVILY_API_KEY`, `FIRECRAWL_API_KEY` | memory / search / scrape |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | PDF storage |
| `INNGEST_SIGNING_KEY` / `INNGEST_EVENT_KEY` | from Inngest Cloud |

**Do not set** `PORT` (Render injects its own; the app reads `process.env.PORT`) and **do not set** `INNGEST_DEV` in production (it forces the local dev-server mode). Both `BETTER_AUTH_URL` and `CLIENT_URL` must be the **client** origin with **no trailing slash** (CORS matches the `Origin` header exactly, and better-auth derives `trustedOrigins` from `BETTER_AUTH_URL`).

Prisma runs during the build: `prisma migrate deploy` applies committed migrations and `prisma generate` regenerates the client into `src/generated/prisma`. The project uses the `@prisma/adapter-pg` driver adapter, so there is **no native query-engine binary** to bundle — `tsc` compiles the generated client to `dist/` and `node dist/index.js` runs it.

### 3. Register the app in Inngest Cloud

Point the Inngest Cloud app at `https://notebooklm-rb3f.onrender.com/api/inngest` and set `INNGEST_SIGNING_KEY` / `INNGEST_EVENT_KEY` on Render. Without this, sources stay `PENDING` and artifacts never reach `READY`.

### 4. Deploy the client to Vercel

Import the repo as a Vercel project with:

- **Root Directory:** `client` (monorepo — this is required)
- **Framework:** Next.js (auto-detected)

**Client env vars (Vercel, Production + Preview):**

| Var | Value |
| --- | --- |
| `API_URL` | the server URL — `https://notebooklm-rb3f.onrender.com` (used by `next.config.ts` rewrites and server-side fetches) |
| `NEXT_PUBLIC_APP_URL` | the client URL — `https://chaibook-one.vercel.app` (used for server-side session fetch) |

Both must include the `https://` **scheme** and have **no trailing slash**. `NEXT_PUBLIC_APP_URL` is inlined at **build time**, so after changing it you must trigger a fresh deploy (a redeploy without a rebuild won't pick up the new value).

### 5. Configure Google OAuth

In the Google Cloud Console OAuth client, add the production entries (keep the localhost ones for local dev):

- **Authorized JavaScript origin:** `https://chaibook-one.vercel.app`
- **Authorized redirect URI:** `https://chaibook-one.vercel.app/api/auth/callback/google`

The callback lives on the **client** origin because auth is proxied through it (and `BETTER_AUTH_URL` is the client URL). The redirect URI must match exactly — `https`, full path, no trailing slash.

### 6. Keep the free tier warm (uptime monitoring)

Render's free tier sleeps a Web Service after ~15 minutes of inactivity (cold start ~30–60s). An external uptime monitor pings `https://notebooklm-rb3f.onrender.com/health` **every 3 minutes** to keep the instance awake, which also keeps the Inngest serve endpoint reachable so background jobs run without cold-start delays.

- The `/health` route (`GET /health` → `"Server is healthy!"`) already exists in `server/src/index.ts`.
- A single always-on service uses ~730 of the free tier's 750 monthly instance-hours, so it fits — avoid adding a second always-on free service.
- An alert on the monitor (email/Slack) surfaces deploy failures or crashes.

### Production hardening applied to the code

Changes made to the repo to support this deployment:

- **`server/.npmrc`** with `legacy-peer-deps=true` — Render's clean `npm install` failed with `ERESOLVE` because `mem0ai` pins an exact peer `pg@8.11.3` while the project uses `pg@8.22.0`. `pg` is backward-compatible, so this allows the install (matching what worked locally).
- **URL normalization** in `client/next.config.ts`, `client/features/workspaces/lib/workspace-server.ts`, and `client/features/auth/lib/auth-server.ts` — `API_URL` / `NEXT_PUBLIC_APP_URL` are stripped of trailing slashes and given an `https://` scheme if missing, preventing double-slash proxy 404s (`//api/auth/...`) and `Failed to parse URL` render crashes from misconfigured env values.
- **Favicon** — replaced the default `client/app/favicon.ico` with `client/app/icon.svg` (the Chaibook Sparkles mark on the emerald brand color), which Next.js serves as the site icon.

### Deployment checklist

- [x] Neon Postgres provisioned; `prisma migrate deploy` run against it during Render build.
- [x] Pinecone index exists (1536-dim, cosine) or key allows auto-create.
- [x] Server deployed to Render; `/health` returns `200`; `PORT` and `INNGEST_DEV` **not** set.
- [x] Inngest Cloud app registered against `/api/inngest`; signing + event keys set on Render.
- [x] Client deployed to Vercel with `API_URL` and `NEXT_PUBLIC_APP_URL` (scheme, no trailing slash).
- [x] `CLIENT_URL` + `BETTER_AUTH_URL` on Render = the Vercel origin (no trailing slash); CORS verified allowing the origin with credentials.
- [x] Google OAuth origin + `/api/auth/callback/google` redirect URI added for the Vercel domain.
- [x] Uptime monitor pinging `/health` every 3 minutes.
- [ ] Any keys copied from development are **rotated** for production.

## Troubleshooting

- **`/api/*` returns 404 / HTML instead of JSON (proxy/CORS).** Ensure the server is running on `8081` and `API_URL` in `client/.env` matches. The client proxies `/api/auth`, `/api/workspaces`, and `/api/memory` — other paths aren't rewritten. On the server, confirm `CLIENT_URL` matches the client origin so CORS allows credentials.
- **Auth works but requests are 401 / session not found (cookies).** Auth is proxied through the client origin, so `BETTER_AUTH_URL` should be the **client** URL and the client must call the API with `credentials: "include"` (the shared `apiFetch` does this). In production, cookies must be Secure over HTTPS and the origin must be in better-auth `trustedOrigins`.
- **Sources stuck in `PENDING` / artifacts never `READY` (Inngest not running).** Start the Inngest dev server (`npx --ignore-scripts=false inngest-cli@latest dev -u http://localhost:8081/api/inngest`). Without it, `source/created` and `artifact/generate` events are never processed. Check the Inngest dashboard for failed runs (`process-source` retries up to 3×; failures set the source to `FAILED` with `metadata.processingError`).
- **Empty Mem0 or Pinecone results.** Empty Pinecone results usually mean the source isn't `READY` yet (still indexing) or the query scored below `RAG_MIN_SCORE = 0.35` — the assistant will answer from general knowledge and avoid citations. Empty/missing Mem0 results are expected when `MEM0_API_KEY` is unset (memory calls short-circuit to `[]`). Verify `PINECONE_INDEX` matches on both the app and Pinecone, and that the embedding dimension is 1536.
- **PDF upload fails or text is empty.** Uploads must be `application/pdf` and ≤10 MB (Multer). If Cloudinary returns `403`, verify `CLOUDINARY_UPLOAD_PRESET` is an **unsigned** preset. If extraction hits a `401` on download, set `CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` so the signed-URL fallback can run.
- **YouTube import errors.** The URL must contain a valid 11-char video id, and the video must have captions/transcript available; otherwise a `ValidationError` is returned.
- **Web search does nothing.** The `web_search` tool is only offered when the request sets `webSearch: true` **and** `TAVILY_API_KEY` is configured on the server.

---

### Assumptions made

- The product name is **Chaibook** (code and prompts also use "ChaibookLM" / the Inngest app id `chaibooklm`); the repository folder is `NoteBookLM`.
- Node.js 20+ is assumed from the client's `@types/node: ^20`; the server pins `@types/node: ^26`, so any recent LTS (20/22) is fine.
- `POST /api/workspaces/:workspaceId/sources` (TEXT/MARKDOWN) is wired end-to-end via `createSourceSchema`, but the service function `createTextOrMarkdownSource` currently has its create/enqueue body commented out — documented as a text/markdown create endpoint per its route and validator.
- The recommended production topology (Next.js on Vercel, Express + Inngest on a persistent host) is a best-practice recommendation; the repo does not include deployment manifests, so exact host choice is left to the operator.
