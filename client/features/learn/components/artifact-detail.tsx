"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/shared/lib/api";
import { ARTIFACT_TYPE_LABELS } from "../lib/constants";
import { learnRoutes } from "../lib/routes";
import { useArtifact } from "../hooks/use-artifacts";
import { ArtifactContentViewer } from "./artifact-content-viewer";
import {
    ArtifactStatusBadge,
    ArtifactTypeBadge,
} from "./artifact-status-badge";

type ArtifactDetailProps = {
    workspaceId: string;
    artifactId: string;
};

export function ArtifactDetail({
    workspaceId,
    artifactId,
}: ArtifactDetailProps) {
    const {
        data: artifact,
        isLoading,
        error,
    } = useArtifact(workspaceId, artifactId);

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
        );
    }

    if (error instanceof ApiError && error.status === 404) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="font-medium">Learning tool not found</p>
                <Button
                    nativeButton={false}
                    variant="outline"
                    render={<Link href={learnRoutes.hub(workspaceId)} />}
                >
                    Back to Learn
                </Button>
            </div>
        );
    }

    if (error || !artifact) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="font-medium">Could not load learning tool</p>
            </div>
        );
    }

    const processingError =
        typeof artifact.metadata?.processingError === "string"
            ? artifact.metadata.processingError
            : null;
    const isMindMap = artifact.type === "MINDMAP";
    const isProcessing =
        artifact.status === "PENDING" || artifact.status === "PROCESSING";

    return (
        <div
            className={`mx-auto flex w-full flex-1 flex-col ${
                isMindMap
                    ? "min-h-0 max-w-6xl gap-4 p-4 md:p-5"
                    : "max-w-4xl gap-6 p-6"
            }`}
        >
            <div className="flex items-start gap-3">
                <Button
                    nativeButton={false}
                    variant="ghost"
                    size="icon-sm"
                    render={<Link href={learnRoutes.hub(workspaceId)} />}
                >
                    <ArrowLeftIcon />
                    <span className="sr-only">Back to Learn</span>
                </Button>
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <ArtifactTypeBadge type={artifact.type} />
                        <h2 className="font-heading text-xl font-semibold">
                            {artifact.title}
                        </h2>
                        <ArtifactStatusBadge status={artifact.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {ARTIFACT_TYPE_LABELS[artifact.type]} · Generated{" "}
                        {formatDistanceToNow(new Date(artifact.createdAt), {
                            addSuffix: true,
                        })}
                    </p>
                </div>
            </div>

            {isProcessing ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                    <Loader2Icon className="size-6 animate-spin text-primary" />
                    <p>
                        Generating{" "}
                        {ARTIFACT_TYPE_LABELS[artifact.type].toLowerCase()}…
                        This updates automatically.
                    </p>
                </div>
            ) : artifact.status === "FAILED" ? (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
                    <p className="font-medium text-destructive">
                        Generation failed
                    </p>
                    {processingError ? (
                        <p className="mt-2 text-muted-foreground">
                            {processingError}
                        </p>
                    ) : null}
                </div>
            ) : isMindMap ? (
                <div className="min-h-0 flex-1">
                    <ArtifactContentViewer
                        artifact={artifact}
                        workspaceId={workspaceId}
                    />
                </div>
            ) : (
                <div className="rounded-3xl border bg-card p-4 shadow-sm md:p-6">
                    <ArtifactContentViewer
                        artifact={artifact}
                        workspaceId={workspaceId}
                    />
                </div>
            )}
        </div>
    );
}
