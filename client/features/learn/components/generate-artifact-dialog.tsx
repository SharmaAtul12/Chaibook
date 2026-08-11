"use client";

import { useState } from "react";
import {
    BookTextIcon,
    BrainIcon,
    FileTextIcon,
    LayersIcon,
    ListChecksIcon,
    NetworkIcon,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
    ARTIFACT_TYPE_DESCRIPTIONS,
    ARTIFACT_TYPE_LABELS,
    ARTIFACT_TYPES,
} from "../lib/constants";
import { useCreateArtifact } from "../hooks/use-artifacts";
import type { ArtifactType } from "../lib/types";

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

type GenerateArtifactDialogProps = {
    workspaceId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function GenerateArtifactDialog({
    workspaceId,
    open,
    onOpenChange,
}: GenerateArtifactDialogProps) {
    const [type, setType] = useState<ArtifactType>("SUMMARY");
    const [title, setTitle] = useState("");
    const createArtifact = useCreateArtifact(workspaceId);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        await createArtifact.mutateAsync({
            type,
            title: title.trim() || undefined,
        });

        setTitle("");
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <form onSubmit={(event) => void handleSubmit(event)}>
                    <DialogHeader>
                        <DialogTitle>Generate learning tool</DialogTitle>
                        <DialogDescription>
                            Uses all ready sources in this workspace. Generation
                            runs in the background via Inngest.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="artifact-type">Type</Label>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {ARTIFACT_TYPES.map((artifactType) => {
                                    const Icon =
                                        ARTIFACT_TYPE_ICONS[artifactType];
                                    const active = type === artifactType;

                                    return (
                                        <button
                                            key={artifactType}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => setType(artifactType)}
                                            className={`flex gap-2.5 rounded-2xl border px-3 py-3 text-left transition-colors ${
                                                active
                                                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                                                    : "hover:border-primary/40 hover:bg-muted/50"
                                            }`}
                                        >
                                            <span
                                                className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
                                                    active
                                                        ? "bg-primary/15 text-primary"
                                                        : "bg-muted text-muted-foreground"
                                                }`}
                                            >
                                                <Icon className="size-4" />
                                            </span>
                                            <span className="min-w-0">
                                                <p className="text-sm font-medium">
                                                    {
                                                        ARTIFACT_TYPE_LABELS[
                                                            artifactType
                                                        ]
                                                    }
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {
                                                        ARTIFACT_TYPE_DESCRIPTIONS[
                                                            artifactType
                                                        ]
                                                    }
                                                </p>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="artifact-title">
                                Title (optional)
                            </Label>
                            <Input
                                id="artifact-title"
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                                placeholder="Custom title"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createArtifact.isPending}
                        >
                            {createArtifact.isPending ? <Spinner /> : null}
                            Generate
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
