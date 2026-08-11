"use client";

import Link from "next/link";
import { SettingsIcon } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "@/components/ui/button";
import { workspaceRoutes } from "../lib/routes";
import type { Workspace } from "../lib/types";

type WorkspaceHeaderActionsProps = {
    workspace: Workspace;
};

// NOTE: The chat model selector is added here in the chat module.
export function WorkspaceHeaderActions({
    workspace,
}: WorkspaceHeaderActionsProps) {
    return (
        <div className="flex items-center gap-2">
            <ModeToggle />
            <Button
                nativeButton={false}
                variant="ghost"
                size="icon-sm"
                render={<Link href={workspaceRoutes.settings(workspace.id)} />}
            >
                <SettingsIcon />
                <span className="sr-only">Workspace settings</span>
            </Button>
        </div>
    );
}
