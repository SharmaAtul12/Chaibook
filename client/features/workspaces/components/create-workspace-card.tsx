"use client";

import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CreateWorkspaceCardProps = {
    onClick: () => void;
    className?: string;
};

export function CreateWorkspaceCard({
    onClick,
    className,
}: CreateWorkspaceCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "group relative flex min-h-52 flex-col items-center justify-center gap-3.5 overflow-hidden rounded-3xl border border-dashed border-border bg-card/40 p-6 text-center transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className,
            )}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(var(--color-primary)_1px,transparent_1px)] bg-size-[18px_18px] mask-[radial-gradient(ellipse_at_center,black,transparent_70%)]"
            />
            <span className="flex size-14 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary">
                <PlusIcon className="size-6" />
            </span>
            <div className="space-y-1">
                <p className="font-heading font-semibold">New notebook</p>
                <p className="text-xs text-muted-foreground">
                    Add sources and start chatting
                </p>
            </div>
        </button>
    );
}
