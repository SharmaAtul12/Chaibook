"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontalIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SOURCE_TYPE_LABELS } from "../lib/constants";
import { sourceRoutes } from "../lib/routes";
import type { Source, SourceType } from "../lib/types";
import { SourceStatusBadge } from "./source-status-badge";
import { SourceTypeIcon } from "./source-type-icon";

const typeAccent: Record<SourceType, string> = {
    PDF: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    WEBSITE: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    YOUTUBE: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
    TEXT: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
    MARKDOWN:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

type SourceCardProps = {
    source: Source;
    onDelete?: (source: Source) => void;
    onReprocess?: (source: Source) => void;
    className?: string;
};

export function SourceCard({
    source,
    onDelete,
    onReprocess,
    className,
}: SourceCardProps) {
    const href = sourceRoutes.detail(source.workspaceId, source.id);

    return (
        <article
            className={cn(
                "group/card relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-4 shadow-xs ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:ring-primary/10",
                className,
            )}
        >
            <Link
                href={href}
                className="absolute inset-0 z-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`Open ${source.title}`}
            />

            <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <span
                        className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                            typeAccent[source.type],
                        )}
                    >
                        <SourceTypeIcon type={source.type} className="size-5" />
                    </span>
                    <div className="min-w-0 space-y-1">
                        <h3 className="truncate font-heading text-sm font-medium leading-snug group-hover/card:text-primary">
                            {source.title}
                        </h3>
                        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{SOURCE_TYPE_LABELS[source.type]}</span>
                            <span>·</span>
                            <span>
                                {formatDistanceToNow(
                                    new Date(source.createdAt),
                                    { addSuffix: true },
                                )}
                            </span>
                        </p>
                    </div>
                </div>

                {onDelete || onReprocess ? (
                    <div
                        className="relative z-10"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                    >
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="shrink-0"
                                    />
                                }
                            >
                                <MoreHorizontalIcon />
                                <span className="sr-only">Open menu</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {onReprocess ? (
                                    <DropdownMenuItem
                                        onClick={() => onReprocess(source)}
                                    >
                                        <RefreshCwIcon />
                                        Reprocess
                                    </DropdownMenuItem>
                                ) : null}
                                {onDelete ? (
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => onDelete(source)}
                                    >
                                        <Trash2Icon />
                                        Delete
                                    </DropdownMenuItem>
                                ) : null}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ) : null}
            </div>

            {source.content ? (
                <p className="relative line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {source.content.slice(0, 180)}
                </p>
            ) : null}

            <div className="relative mt-auto flex items-center justify-between gap-3">
                <SourceStatusBadge status={source.status} />
            </div>
        </article>
    );
}
