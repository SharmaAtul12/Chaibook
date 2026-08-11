"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
    BookTextIcon,
    BrainIcon,
    FileTextIcon,
    GraduationCapIcon,
    LayersIcon,
    ListChecksIcon,
    NetworkIcon,
    PlusIcon,
    Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ARTIFACT_TYPE_LABELS } from "../lib/constants";
import { learnRoutes } from "../lib/routes";
import { useArtifacts, useDeleteArtifact } from "../hooks/use-artifacts";
import type { ArtifactType } from "../lib/types";
import {
    ArtifactStatusBadge,
    ArtifactTypeBadge,
} from "./artifact-status-badge";
import { GenerateArtifactDialog } from "./generate-artifact-dialog";

type LearnHubProps = {
    workspaceId: string;
};

const ARTIFACT_TYPE_ICONS: Record<
    ArtifactType,
    React.ComponentType<{ className?: string }>
> = {
    SUMMARY: FileTextIcon,
    TAKEAWAYS: ListChecksIcon,
    FLASHCARDS: LayersIcon,
    QUIZ: BrainIcon,
    MINDMAP: NetworkIcon,
    REPORT: BookTextIcon,
};

export function LearnHub({ workspaceId }: LearnHubProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const {
        data: artifacts = [],
        isLoading,
        error,
    } = useArtifacts(workspaceId);
    const deleteArtifact = useDeleteArtifact(workspaceId);

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="flex size-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                            <GraduationCapIcon className="size-5" />
                        </span>
                        <h2 className="font-heading text-xl font-semibold">
                            Learning tools
                        </h2>
                    </div>
                    <p className="max-w-xl text-sm text-muted-foreground">
                        Generate summaries, flashcards, quizzes, mind maps, and
                        reports from your indexed sources.
                    </p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <PlusIcon />
                    Generate
                </Button>
            </div>

            {isLoading ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <Skeleton className="h-32 rounded-3xl" />
                    <Skeleton className="h-32 rounded-3xl" />
                    <Skeleton className="h-32 rounded-3xl" />
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Could not load learning tools.
                </div>
            ) : artifacts.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed p-10 text-center">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <GraduationCapIcon className="size-6" />
                    </span>
                    <p className="mt-4 font-medium">No learning tools yet</p>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        Generate your first summary, quiz, or flashcard deck
                        from workspace sources.
                    </p>
                    <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                        <PlusIcon />
                        Generate
                    </Button>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {artifacts.map((artifact) => {
                        const Icon = ARTIFACT_TYPE_ICONS[artifact.type];

                        return (
                            <div
                                key={artifact.id}
                                className="group relative rounded-3xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30"
                            >
                                <Link
                                    href={learnRoutes.detail(
                                        workspaceId,
                                        artifact.id,
                                    )}
                                    className="block space-y-3"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <Icon className="size-4.5" />
                                        </span>
                                        <ArtifactStatusBadge
                                            status={artifact.status}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {artifact.title}
                                        </p>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                            <ArtifactTypeBadge
                                                type={artifact.type}
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(
                                                    new Date(
                                                        artifact.createdAt,
                                                    ),
                                                    { addSuffix: true },
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                                    onClick={() =>
                                        void deleteArtifact.mutateAsync(
                                            artifact.id,
                                        )
                                    }
                                    disabled={deleteArtifact.isPending}
                                >
                                    <Trash2Icon />
                                    <span className="sr-only">
                                        Delete {ARTIFACT_TYPE_LABELS[artifact.type]}
                                    </span>
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}

            <GenerateArtifactDialog
                workspaceId={workspaceId}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />
        </div>
    );
}
