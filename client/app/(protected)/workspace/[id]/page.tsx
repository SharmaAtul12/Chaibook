import { notFound } from "next/navigation";
import { MessageSquareIcon } from "lucide-react";
import { requireAuth } from "@/features/auth";
import { getWorkspaceOrNull } from "@/features/workspaces/lib/workspace-server";
import { WorkspaceShell } from "@/features/workspaces";

type WorkspacePageProps = {
    params: Promise<{ id: string }>;
};

// NOTE: The chat experience replaces this placeholder in the chat module.
export default async function WorkspacePage({ params }: WorkspacePageProps) {
    await requireAuth();
    const { id } = await params;
    const workspace = await getWorkspaceOrNull(id);

    if (!workspace) {
        notFound();
    }

    return (
        <WorkspaceShell workspace={workspace}>
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <MessageSquareIcon className="size-6" />
                </span>
                <div className="max-w-sm space-y-1.5">
                    <h2 className="font-heading text-lg font-semibold">
                        Chat with your notebook
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Add sources from the sidebar, then start a grounded
                        conversation. Chat is coming in the next module.
                    </p>
                </div>
            </div>
        </WorkspaceShell>
    );
}
