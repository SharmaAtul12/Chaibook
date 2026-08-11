"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    ArrowLeftIcon,
    ExternalLinkIcon,
    FileTextIcon,
    Loader2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/shared/lib/api";
import { useSource } from "../hooks/use-sources";
import { SOURCE_TYPE_LABELS } from "../lib/constants";
import { sourceRoutes } from "../lib/routes";
import { MarkdownPreview } from "./markdown-preview";
import { SourceStatusBadge } from "./source-status-badge";
import { SourceTypeIcon } from "./source-type-icon";

type SourceDetailProps = {
    workspaceId: string;
    sourceId: string;
};

export function SourceDetail({ workspaceId, sourceId }: SourceDetailProps) {
    const { data: source, isLoading, error } = useSource(workspaceId, sourceId);

    if (isLoading) {
        return (
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6 md:p-8">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        );
    }

    if (error instanceof ApiError && error.status === 404) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="font-medium">Source not found</p>
                <Button
                    nativeButton={false}
                    variant="outline"
                    render={<Link href={sourceRoutes.list(workspaceId)} />}
                >
                    Back to library
                </Button>
            </div>
        );
    }

    if (error || !source) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="font-medium">Could not load source</p>
            </div>
        );
    }

    const metadata = source.metadata ?? {};
    const fileUrl =
        typeof metadata.fileUrl === "string" ? metadata.fileUrl : null;
    const fileName =
        typeof metadata.fileName === "string" ? metadata.fileName : null;
    const chunkCount =
        typeof metadata.chunkCount === "number" ? metadata.chunkCount : null;
    const processingError =
        typeof metadata.processingError === "string"
            ? metadata.processingError
            : null;
    const isProcessing =
        source.status === "PENDING" || source.status === "PROCESSING";

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6 md:p-8">
            <div>
                <Button
                    nativeButton={false}
                    variant="ghost"
                    size="sm"
                    className="-ml-2 text-muted-foreground"
                    render={<Link href={sourceRoutes.list(workspaceId)} />}
                >
                    <ArrowLeftIcon />
                    Back to library
                </Button>
            </div>

            <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <SourceTypeIcon type={source.type} className="size-6" />
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
                            {source.title}
                        </h1>
                        <SourceStatusBadge status={source.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {SOURCE_TYPE_LABELS[source.type]} · Added{" "}
                        {formatDistanceToNow(new Date(source.createdAt), {
                            addSuffix: true,
                        })}
                        {chunkCount != null
                            ? ` · ${chunkCount} chunks indexed`
                            : null}
                    </p>
                </div>
            </div>

            {source.url ? (
                <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 text-sm text-primary shadow-xs transition-colors hover:bg-muted"
                >
                    <ExternalLinkIcon className="size-4 shrink-0" />
                    <span className="truncate underline-offset-4 hover:underline">
                        {source.url}
                    </span>
                </a>
            ) : null}

            {source.type === "PDF" && fileUrl ? (
                <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <FileTextIcon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">PDF uploaded</p>
                        {fileName ? (
                            <p className="truncate text-xs text-muted-foreground">
                                {fileName}
                            </p>
                        ) : null}
                    </div>
                    <Button
                        nativeButton={false}
                        variant="outline"
                        size="sm"
                        render={
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                            />
                        }
                    >
                        Open PDF
                    </Button>
                </div>
            ) : null}

            {isProcessing ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
                    <Loader2Icon className="size-6 animate-spin text-primary" />
                    <div>
                        <p className="text-sm font-medium">
                            Processing source
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Extracting text, chunking, and indexing for
                            search…
                        </p>
                    </div>
                </div>
            ) : source.status === "FAILED" ? (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
                    <p className="font-medium text-destructive">
                        Processing failed
                    </p>
                    {processingError ? (
                        <p className="mt-2 text-muted-foreground">
                            {processingError}
                        </p>
                    ) : null}
                </div>
            ) : source.content ? (
                <MarkdownPreview content={source.content} />
            ) : (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No extracted content available for this source.
                </div>
            )}
        </div>
    );
}
