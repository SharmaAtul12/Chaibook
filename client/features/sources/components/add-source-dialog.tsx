"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    FileTextIcon,
    GlobeIcon,
    NotebookPenIcon,
    TypeIcon,
    UploadCloudIcon,
    VideoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    useCreateSource,
    useImportWebsiteSource,
    useImportYoutubeSource,
    useUploadPdfSource,
} from "../hooks/use-sources";
import { sourceRoutes } from "../lib/routes";

type AddSourceDialogProps = {
    workspaceId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const TABS = [
    { value: "text", label: "Text", icon: TypeIcon },
    { value: "markdown", label: "Markdown", icon: NotebookPenIcon },
    { value: "pdf", label: "PDF", icon: FileTextIcon },
    { value: "website", label: "Website", icon: GlobeIcon },
    { value: "youtube", label: "YouTube", icon: VideoIcon },
] as const;

export function AddSourceDialog({
    workspaceId,
    open,
    onOpenChange,
}: AddSourceDialogProps) {
    const router = useRouter();
    const createSource = useCreateSource(workspaceId);
    const uploadPdf = useUploadPdfSource(workspaceId);
    const importWebsite = useImportWebsiteSource(workspaceId);
    const importYoutube = useImportYoutubeSource(workspaceId);

    const [error, setError] = useState<string | null>(null);

    const [textTitle, setTextTitle] = useState("");
    const [textContent, setTextContent] = useState("");

    const [markdownTitle, setMarkdownTitle] = useState("");
    const [markdownContent, setMarkdownContent] = useState("");

    const [pdfTitle, setPdfTitle] = useState("");
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    const [websiteUrl, setWebsiteUrl] = useState("");
    const [websiteTitle, setWebsiteTitle] = useState("");

    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [youtubeTitle, setYoutubeTitle] = useState("");

    const isPending =
        createSource.isPending ||
        uploadPdf.isPending ||
        importWebsite.isPending ||
        importYoutube.isPending;

    function resetForm() {
        setError(null);
        setTextTitle("");
        setTextContent("");
        setMarkdownTitle("");
        setMarkdownContent("");
        setPdfTitle("");
        setPdfFile(null);
        setWebsiteUrl("");
        setWebsiteTitle("");
        setYoutubeUrl("");
        setYoutubeTitle("");
    }

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            resetForm();
        }
        onOpenChange(nextOpen);
    }

    async function handleSuccess(sourceId: string) {
        handleOpenChange(false);
        router.push(sourceRoutes.detail(workspaceId, sourceId));
        router.refresh();
    }

    async function submitText() {
        setError(null);
        try {
            const source = await createSource.mutateAsync({
                type: "TEXT",
                title: textTitle,
                content: textContent,
            });
            await handleSuccess(source.id);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Failed to add text source",
            );
        }
    }

    async function submitMarkdown() {
        setError(null);
        try {
            const source = await createSource.mutateAsync({
                type: "MARKDOWN",
                title: markdownTitle,
                content: markdownContent,
            });
            await handleSuccess(source.id);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Failed to add markdown source",
            );
        }
    }

    async function submitPdf() {
        setError(null);

        if (!pdfFile) {
            setError("Choose a PDF file to upload.");
            return;
        }

        try {
            const source = await uploadPdf.mutateAsync({
                file: pdfFile,
                title: pdfTitle || undefined,
            });
            await handleSuccess(source.id);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Failed to upload PDF",
            );
        }
    }

    async function submitWebsite() {
        setError(null);
        try {
            const source = await importWebsite.mutateAsync({
                url: websiteUrl,
                title: websiteTitle || undefined,
            });
            await handleSuccess(source.id);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Failed to import website",
            );
        }
    }

    async function submitYoutube() {
        setError(null);
        try {
            const source = await importYoutube.mutateAsync({
                url: youtubeUrl,
                title: youtubeTitle || undefined,
            });
            await handleSuccess(source.id);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Failed to import YouTube transcript",
            );
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="font-heading text-lg">
                        Add a source
                    </DialogTitle>
                    <DialogDescription>
                        Add knowledge to this notebook from text, files, or the
                        web.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="text">
                    <TabsList className="grid w-full grid-cols-5">
                        {TABS.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="flex-col gap-1 py-2 text-xs sm:flex-row sm:gap-1.5 sm:text-sm"
                            >
                                <tab.icon className="size-4" />
                                <span className="hidden sm:inline">
                                    {tab.label}
                                </span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="text" className="grid gap-4 pt-4">
                        <LabeledInput
                            id="text-title"
                            label="Title"
                            value={textTitle}
                            onChange={setTextTitle}
                            placeholder="Meeting notes"
                            disabled={isPending}
                        />
                        <LabeledTextarea
                            id="text-content"
                            label="Content"
                            value={textContent}
                            onChange={setTextContent}
                            placeholder="Paste your text here..."
                            disabled={isPending}
                        />
                        <DialogFooter>
                            <SubmitButton
                                pending={createSource.isPending}
                                onClick={() => void submitText()}
                            >
                                Add text source
                            </SubmitButton>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="markdown" className="grid gap-4 pt-4">
                        <LabeledInput
                            id="markdown-title"
                            label="Title"
                            value={markdownTitle}
                            onChange={setMarkdownTitle}
                            placeholder="Research notes"
                            disabled={isPending}
                        />
                        <LabeledTextarea
                            id="markdown-content"
                            label="Markdown"
                            value={markdownContent}
                            onChange={setMarkdownContent}
                            placeholder={"# Heading\n\nWrite markdown here..."}
                            disabled={isPending}
                            rows={8}
                        />
                        <DialogFooter>
                            <SubmitButton
                                pending={createSource.isPending}
                                onClick={() => void submitMarkdown()}
                            >
                                Add markdown source
                            </SubmitButton>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="pdf" className="grid gap-4 pt-4">
                        <LabeledInput
                            id="pdf-title"
                            label="Title (optional)"
                            value={pdfTitle}
                            onChange={setPdfTitle}
                            placeholder="Research paper"
                            disabled={isPending}
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="pdf-file">PDF file</Label>
                            <label
                                htmlFor="pdf-file"
                                className={cn(
                                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/50",
                                    isPending && "pointer-events-none opacity-60",
                                )}
                            >
                                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <UploadCloudIcon className="size-5" />
                                </span>
                                {pdfFile ? (
                                    <span className="text-sm font-medium">
                                        {pdfFile.name}
                                    </span>
                                ) : (
                                    <>
                                        <span className="text-sm font-medium">
                                            Click to choose a PDF
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Up to ~20MB
                                        </span>
                                    </>
                                )}
                            </label>
                            <Input
                                id="pdf-file"
                                type="file"
                                accept="application/pdf"
                                className="sr-only"
                                disabled={isPending}
                                onChange={(event) => {
                                    const file =
                                        event.target.files?.[0] ?? null;
                                    setPdfFile(file);
                                }}
                            />
                        </div>
                        <DialogFooter>
                            <SubmitButton
                                pending={uploadPdf.isPending}
                                onClick={() => void submitPdf()}
                            >
                                Upload PDF
                            </SubmitButton>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="website" className="grid gap-4 pt-4">
                        <LabeledInput
                            id="website-url"
                            label="Website URL"
                            value={websiteUrl}
                            onChange={setWebsiteUrl}
                            placeholder="https://example.com/article"
                            disabled={isPending}
                        />
                        <LabeledInput
                            id="website-title"
                            label="Title (optional)"
                            value={websiteTitle}
                            onChange={setWebsiteTitle}
                            placeholder="Article title"
                            disabled={isPending}
                        />
                        <DialogFooter>
                            <SubmitButton
                                pending={importWebsite.isPending}
                                onClick={() => void submitWebsite()}
                            >
                                Import website
                            </SubmitButton>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="youtube" className="grid gap-4 pt-4">
                        <LabeledInput
                            id="youtube-url"
                            label="YouTube URL"
                            value={youtubeUrl}
                            onChange={setYoutubeUrl}
                            placeholder="https://www.youtube.com/watch?v=..."
                            disabled={isPending}
                        />
                        <LabeledInput
                            id="youtube-title"
                            label="Title (optional)"
                            value={youtubeTitle}
                            onChange={setYoutubeTitle}
                            placeholder="Video title"
                            disabled={isPending}
                        />
                        <DialogFooter>
                            <SubmitButton
                                pending={importYoutube.isPending}
                                onClick={() => void submitYoutube()}
                            >
                                Import transcript
                            </SubmitButton>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>

                {error ? (
                    <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                        {error}
                    </p>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

function LabeledInput({
    id,
    label,
    value,
    onChange,
    placeholder,
    disabled,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                disabled={disabled}
            />
        </div>
    );
}

function LabeledTextarea({
    id,
    label,
    value,
    onChange,
    placeholder,
    disabled,
    rows = 6,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    rows?: number;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Textarea
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
            />
        </div>
    );
}

function SubmitButton({
    children,
    pending,
    onClick,
}: {
    children: React.ReactNode;
    pending: boolean;
    onClick: () => void;
}) {
    return (
        <Button type="button" disabled={pending} onClick={onClick}>
            {pending ? <Spinner /> : null}
            {children}
        </Button>
    );
}
