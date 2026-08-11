"use client";

import { useState } from "react";
import { GlobeIcon, Loader2Icon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ChatComposerProps = {
    onSubmit: (text: string) => void;
    disabled?: boolean;
    isStreaming?: boolean;
    webSearchEnabled?: boolean;
    onWebSearchChange?: (enabled: boolean) => void;
};

export function ChatComposer({
    onSubmit,
    disabled = false,
    isStreaming = false,
    webSearchEnabled = false,
    onWebSearchChange,
}: ChatComposerProps) {
    const [input, setInput] = useState("");

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        const text = input.trim();
        if (!text || disabled || isStreaming) {
            return;
        }

        onSubmit(text);
        setInput("");
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="border-t bg-background/80 p-4 backdrop-blur supports-backdrop-filter:bg-background/60"
        >
            <div className="mx-auto flex max-w-3xl flex-col gap-2.5">
                {onWebSearchChange ? (
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant={webSearchEnabled ? "secondary" : "outline"}
                            className={cn(
                                "rounded-full",
                                webSearchEnabled &&
                                    "border-primary/30 text-primary",
                            )}
                            onClick={() =>
                                onWebSearchChange(!webSearchEnabled)
                            }
                            disabled={disabled || isStreaming}
                        >
                            <GlobeIcon />
                            Web search
                        </Button>
                        {webSearchEnabled ? (
                            <span className="text-xs text-muted-foreground">
                                Tavily will search the web when needed
                            </span>
                        ) : null}
                    </div>
                ) : null}

                <div className="flex items-end gap-2 rounded-3xl border bg-card p-2 pl-4 shadow-sm transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
                    <Textarea
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder="Ask about your sources…"
                        rows={1}
                        className="max-h-40 min-h-6 resize-none border-0 bg-transparent px-0 py-2 shadow-none focus-visible:ring-0 dark:bg-transparent"
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                handleSubmit(event);
                            }
                        }}
                        disabled={disabled || isStreaming}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="size-9 shrink-0 rounded-full"
                        disabled={disabled || isStreaming || !input.trim()}
                    >
                        {isStreaming ? (
                            <Loader2Icon className="animate-spin" />
                        ) : (
                            <SendIcon />
                        )}
                    </Button>
                </div>
                <p className="px-2 text-center text-[11px] text-muted-foreground">
                    Answers are grounded in your sources and include citations
                    when relevant context is found.
                </p>
            </div>
        </form>
    );
}
