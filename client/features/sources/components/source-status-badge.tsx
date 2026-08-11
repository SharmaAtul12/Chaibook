import { cn } from "@/lib/utils";
import { SOURCE_STATUS_LABELS } from "../lib/constants";
import type { SourceStatus } from "../lib/types";

const statusStyles: Record<SourceStatus, string> = {
    PENDING:
        "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    PROCESSING:
        "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
    READY:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    FAILED:
        "border-destructive/30 bg-destructive/10 text-destructive",
};

const dotStyles: Record<SourceStatus, string> = {
    PENDING: "bg-amber-500",
    PROCESSING: "bg-sky-500",
    READY: "bg-emerald-500",
    FAILED: "bg-destructive",
};

type SourceStatusBadgeProps = {
    status: SourceStatus;
    className?: string;
};

export function SourceStatusBadge({ status, className }: SourceStatusBadgeProps) {
    const isActive = status === "PENDING" || status === "PROCESSING";

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                statusStyles[status],
                className,
            )}
        >
            <span className="relative flex size-1.5">
                {isActive ? (
                    <span
                        className={cn(
                            "absolute inline-flex size-full animate-ping rounded-full opacity-75",
                            dotStyles[status],
                        )}
                    />
                ) : null}
                <span
                    className={cn(
                        "relative inline-flex size-1.5 rounded-full",
                        dotStyles[status],
                    )}
                />
            </span>
            {SOURCE_STATUS_LABELS[status]}
        </span>
    );
}
