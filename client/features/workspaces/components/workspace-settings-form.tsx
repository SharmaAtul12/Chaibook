"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SettingsIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
    CHAT_MODEL_LABELS,
    CHAT_MODELS,
    type ChatModelId,
} from "@/features/chat/stores/chat-preferences";
import {
    useDeleteWorkspace,
    useUpdateWorkspace,
} from "../hooks/use-workspaces";
import type { Workspace } from "../lib/types";
import { workspaceRoutes } from "../lib/routes";
import { DeleteWorkspaceDialog } from "./delete-workspace-dialog";

type WorkspaceSettingsFormProps = {
    workspace: Workspace;
};

export function WorkspaceSettingsForm({
    workspace,
}: WorkspaceSettingsFormProps) {
    const router = useRouter();
    const updateWorkspace = useUpdateWorkspace(workspace.id);
    const deleteWorkspace = useDeleteWorkspace();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [title, setTitle] = useState(workspace.title);
    const [description, setDescription] = useState(workspace.description ?? "");
    const [icon, setIcon] = useState(workspace.icon ?? "");
    const [defaultModel, setDefaultModel] = useState<ChatModelId>(
        CHAT_MODELS.includes(workspace.defaultModel as ChatModelId)
            ? (workspace.defaultModel as ChatModelId)
            : "gpt-4o-mini",
    );

    async function handleSave(event: React.FormEvent) {
        event.preventDefault();

        await updateWorkspace.mutateAsync({
            title: title.trim(),
            description: description.trim() || undefined,
            icon: icon.trim() || undefined,
            defaultModel,
        });
    }

    async function handleDelete() {
        await deleteWorkspace.mutateAsync(workspace.id);
        router.push(workspaceRoutes.list);
    }

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
            <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <SettingsIcon className="size-5" />
                </span>
                <div>
                    <h2 className="font-heading text-xl font-semibold">
                        Workspace settings
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Manage this workspace&apos;s details and defaults.
                    </p>
                </div>
            </div>

            <form
                onSubmit={(event) => void handleSave(event)}
                className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm"
            >
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(event) =>
                            setDescription(event.target.value)
                        }
                        rows={3}
                        placeholder="What is this notebook about?"
                    />
                </div>

                <div className="grid gap-6 sm:grid-cols-[7rem_1fr]">
                    <div className="space-y-2">
                        <Label htmlFor="icon">Icon</Label>
                        <Input
                            id="icon"
                            value={icon}
                            onChange={(event) => setIcon(event.target.value)}
                            placeholder="📚"
                            maxLength={8}
                            className="text-center text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="defaultModel">
                            Default chat model
                        </Label>
                        <Select
                            value={defaultModel}
                            onValueChange={(value) =>
                                setDefaultModel(value as ChatModelId)
                            }
                        >
                            <SelectTrigger id="defaultModel">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CHAT_MODELS.map((model) => (
                                    <SelectItem key={model} value={model}>
                                        {CHAT_MODEL_LABELS[model]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            New conversations start with this model.
                        </p>
                    </div>
                </div>

                <Button type="submit" disabled={updateWorkspace.isPending}>
                    {updateWorkspace.isPending ? <Spinner /> : null}
                    Save changes
                </Button>
            </form>

            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
                <div className="flex items-center gap-2 text-destructive">
                    <TriangleAlertIcon className="size-4" />
                    <h3 className="font-medium">Danger zone</h3>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    Deleting this workspace removes all sources, conversations,
                    and indexed vectors permanently.
                </p>
                <Button
                    type="button"
                    variant="destructive"
                    className="mt-4"
                    onClick={() => setDeleteOpen(true)}
                >
                    Delete workspace
                </Button>
            </div>

            <DeleteWorkspaceDialog
                workspace={workspace}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={handleDelete}
                isPending={deleteWorkspace.isPending}
            />
        </div>
    );
}
