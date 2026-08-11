"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/shared/lib/api";
import {
    useCreateWorkspace,
    useDeleteWorkspace,
    useUpdateWorkspace,
    useWorkspaces,
} from "../hooks/use-workspaces";
import { workspaceRoutes } from "../lib/routes";
import type { Workspace } from "../lib/types";
import { CreateWorkspaceCard } from "./create-workspace-card";
import { DeleteWorkspaceDialog } from "./delete-workspace-dialog";
import { WorkspaceCard } from "./workspace-card";
import { WorkspaceFormDialog } from "./workspace-form-dialog";

export function WorkspaceList() {
    const router = useRouter();
    const { data: workspaces, isLoading, error } = useWorkspaces();
    const createWorkspace = useCreateWorkspace();

    const [createOpen, setCreateOpen] = useState(false);
    const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
        null,
    );
    const [deletingWorkspace, setDeletingWorkspace] =
        useState<Workspace | null>(null);

    const updateWorkspace = useUpdateWorkspace(editingWorkspace?.id ?? "");
    const deleteWorkspace = useDeleteWorkspace();

    if (isLoading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="min-h-52 rounded-3xl" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <Empty className="rounded-3xl border bg-card">
                <EmptyHeader>
                    <EmptyTitle>Could not load notebooks</EmptyTitle>
                    <EmptyDescription>
                        {error instanceof ApiError
                            ? error.message
                            : "Please try again in a moment."}
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <CreateWorkspaceCard onClick={() => setCreateOpen(true)} />

                {workspaces?.map((workspace) => (
                    <WorkspaceCard
                        key={workspace.id}
                        workspace={workspace}
                        onEdit={setEditingWorkspace}
                        onDelete={setDeletingWorkspace}
                    />
                ))}
            </div>

            {workspaces && workspaces.length === 0 ? (
                <Empty className="mt-4 rounded-3xl border bg-card">
                    <EmptyHeader>
                        <EmptyTitle>No notebooks yet</EmptyTitle>
                        <EmptyDescription>
                            Create your first notebook to get started with
                            Chaibook.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button onClick={() => setCreateOpen(true)}>
                            <PlusIcon />
                            Create notebook
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : null}

            <WorkspaceFormDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                isPending={createWorkspace.isPending}
                onSubmit={async (values) => {
                    const workspace = await createWorkspace.mutateAsync(values);
                    router.push(workspaceRoutes.detail(workspace.id));
                }}
            />

            <WorkspaceFormDialog
                open={Boolean(editingWorkspace)}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingWorkspace(null);
                    }
                }}
                workspace={editingWorkspace}
                isPending={updateWorkspace.isPending}
                onSubmit={async (values) => {
                    await updateWorkspace.mutateAsync(values);
                    setEditingWorkspace(null);
                }}
            />

            <DeleteWorkspaceDialog
                workspace={deletingWorkspace}
                open={Boolean(deletingWorkspace)}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingWorkspace(null);
                    }
                }}
                isPending={deleteWorkspace.isPending}
                onConfirm={async () => {
                    if (!deletingWorkspace) {
                        return;
                    }

                    await deleteWorkspace.mutateAsync(deletingWorkspace.id);
                    setDeletingWorkspace(null);
                }}
            />
        </>
    );
}
