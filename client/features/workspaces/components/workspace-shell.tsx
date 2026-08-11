"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    ArrowLeftIcon,
    BookOpenIcon,
    GraduationCapIcon,
    MessageSquareIcon,
    PlusIcon,
    SettingsIcon,
    SparklesIcon,
} from "lucide-react";
import { learnRoutes } from "@/features/learn";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import {
    AddSourceDialog,
    SourceSidebarList,
    sourceRoutes,
} from "@/features/sources";
import { Button } from "@/components/ui/button";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { workspaceRoutes } from "../lib/routes";
import type { Workspace } from "../lib/types";
import { WorkspaceHeaderActions } from "./workspace-header-actions";

type WorkspaceShellProps = {
    workspace: Workspace;
    children: React.ReactNode;
};

export function WorkspaceShell({ workspace, children }: WorkspaceShellProps) {
    const pathname = usePathname();
    const [addSourceOpen, setAddSourceOpen] = useState(false);

    const sourcesPath = sourceRoutes.list(workspace.id);
    const learnPath = learnRoutes.hub(workspace.id);
    const isSourcesActive = pathname.startsWith(sourcesPath);
    const isLearnActive = pathname.startsWith(learnPath);
    const isSettingsActive = pathname.includes("/settings");
    const isChatActive =
        !isSourcesActive && !isLearnActive && !isSettingsActive;

    const navItems = [
        {
            label: "Chat",
            icon: MessageSquareIcon,
            href: workspaceRoutes.detail(workspace.id),
            active: isChatActive,
        },
        {
            label: "Learn",
            icon: GraduationCapIcon,
            href: learnPath,
            active: isLearnActive,
        },
        {
            label: "Sources",
            icon: BookOpenIcon,
            href: sourcesPath,
            active: isSourcesActive,
        },
        {
            label: "Settings",
            icon: SettingsIcon,
            href: workspaceRoutes.settings(workspace.id),
            active: isSettingsActive,
        },
    ];

    return (
        <SidebarProvider className="h-svh overflow-hidden">
            <Sidebar>
                <SidebarHeader className="border-b border-sidebar-border">
                    <div className="flex items-center gap-2.5 px-2 py-1.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-lg">
                            {workspace.icon ?? "📚"}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-heading text-sm font-semibold">
                                {workspace.title}
                            </p>
                            {workspace.description ? (
                                <p className="truncate text-xs text-muted-foreground">
                                    {workspace.description}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {navItems.map((item) => (
                                    <SidebarMenuItem key={item.label}>
                                        <SidebarMenuButton
                                            isActive={item.active}
                                            render={<Link href={item.href} />}
                                        >
                                            <item.icon />
                                            <span>{item.label}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <SourceSidebarList
                        workspaceId={workspace.id}
                        onAddSource={() => setAddSourceOpen(true)}
                    />
                </SidebarContent>

                <SidebarFooter className="border-t border-sidebar-border">
                    <Button
                        nativeButton={false}
                        variant="ghost"
                        className="w-full justify-start"
                        render={<Link href={workspaceRoutes.list} />}
                    >
                        <ArrowLeftIcon />
                        All notebooks
                    </Button>
                </SidebarFooter>

                <SidebarRail />
            </Sidebar>

            <SidebarInset>
                <header className="flex h-14 items-center gap-3 border-b bg-background/70 px-4 backdrop-blur-xl">
                    <SidebarTrigger />
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <SparklesIcon className="size-4 shrink-0 text-primary" />
                        <h1 className="truncate font-heading text-sm font-semibold">
                            {workspace.title}
                        </h1>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setAddSourceOpen(true)}
                    >
                        <PlusIcon />
                        <span className="hidden sm:inline">Add source</span>
                    </Button>
                    <WorkspaceHeaderActions workspace={workspace} />
                    <SignOutButton showLabel={false} size="icon-sm" />
                </header>

                <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                    {children}
                </main>
            </SidebarInset>

            <AddSourceDialog
                workspaceId={workspace.id}
                open={addSourceOpen}
                onOpenChange={setAddSourceOpen}
            />
        </SidebarProvider>
    );
}
