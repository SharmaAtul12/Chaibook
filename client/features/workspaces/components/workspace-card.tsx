"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ClockIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getWorkspaceGradient } from "../lib/workspace-gradients";
import { workspaceRoutes } from "../lib/routes";
import type { Workspace } from "../lib/types";

type WorkspaceCardProps = {
    workspace: Workspace;
    onEdit: (workspace: Workspace) => void;
    onDelete: (workspace: Workspace) => void;
    className?: string;
};

export function WorkspaceCard({
    workspace,
    onEdit,
    onDelete,
    className,
}: WorkspaceCardProps) {
    const href = workspaceRoutes.detail(workspace.id);
    const gradient = getWorkspaceGradient(workspace.id);

    return (
        <article
            className={cn(
                "group/card relative min-h-52 overflow-hidden rounded-3xl shadow-sm ring-1 ring-foreground/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10",
                className,
            )}
        >
            <Link
                href={href}
                className={cn(
                    "absolute inset-0 z-0 rounded-3xl bg-linear-to-br transition-transform duration-500 group-hover/card:scale-105 focus-visible:outline-none",
                    gradient,
                )}
                aria-label={`Open ${workspace.title}`}
            />

            {/* Decorative orbs + readability overlay */}
            <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-white/20 blur-2xl transition-opacity duration-300 group-hover/card:opacity-80"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-white/15"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[16px_16px] mask-[linear-gradient(to_top,transparent,black_60%)]"
            />

            <div className="pointer-events-none relative flex h-full min-h-52 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                    <span className="flex size-12 items-center justify-center rounded-2xl border border-white/25 bg-white/20 text-2xl shadow-sm backdrop-blur-md">
                        {workspace.icon ?? "📚"}
                    </span>

                    <div
                        className="pointer-events-auto relative z-10"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                    >
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="size-8 border border-white/10 bg-black/20 text-white backdrop-blur-md hover:bg-black/35 hover:text-white"
                                    />
                                }
                            >
                                <MoreHorizontalIcon />
                                <span className="sr-only">Open menu</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => onEdit(workspace)}
                                >
                                    <PencilIcon />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => onDelete(workspace)}
                                >
                                    <Trash2Icon />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="mt-auto space-y-1.5 pt-8 text-white">
                    <h3 className="line-clamp-2 font-heading text-lg font-semibold leading-snug drop-shadow-sm">
                        {workspace.title}
                    </h3>
                    {workspace.description ? (
                        <p className="line-clamp-2 text-sm text-white/85 drop-shadow-sm">
                            {workspace.description}
                        </p>
                    ) : null}
                    <p className="flex items-center gap-1.5 pt-0.5 text-xs text-white/75">
                        <ClockIcon className="size-3" />
                        Updated{" "}
                        {formatDistanceToNow(new Date(workspace.updatedAt), {
                            addSuffix: true,
                        })}
                    </p>
                </div>
            </div>
        </article>
    );
}
