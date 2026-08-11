import { BookOpen, MessagesSquare, Network, Sparkles } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";

const highlights = [
    {
        icon: BookOpen,
        title: "Bring your sources",
        description: "PDFs, websites, and videos — all in one workspace.",
    },
    {
        icon: MessagesSquare,
        title: "Chat with citations",
        description: "Ask questions and get grounded, cited answers.",
    },
    {
        icon: Network,
        title: "Memory that learns",
        description: "Your assistant remembers what matters to you.",
    },
];

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-svh w-full">
            {/* Brand panel */}
            <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-linear-to-br from-primary/10 via-background to-background p-12 lg:flex">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 opacity-60 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[22px_22px] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]"
                />
                <div className="absolute -left-24 -top-24 -z-10 size-96 rounded-full bg-primary/15 blur-3xl" />

                <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                        <Sparkles className="size-5" />
                    </div>
                    <span className="font-heading text-lg font-semibold tracking-tight">
                        Chaibook
                    </span>
                </div>

                <div className="max-w-md space-y-8">
                    <div className="space-y-3">
                        <h2 className="font-heading text-3xl font-semibold leading-tight tracking-tight">
                            Turn your sources into conversations.
                        </h2>
                        <p className="text-muted-foreground">
                            Chaibook is your research companion — upload, organize,
                            and chat with everything you read.
                        </p>
                    </div>

                    <ul className="space-y-4">
                        {highlights.map(({ icon: Icon, title, description }) => (
                            <li key={title} className="flex items-start gap-3.5">
                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                                    <Icon className="size-4.5" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">{title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {description}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Chaibook. All rights reserved.
                </p>
            </div>

            {/* Form panel */}
            <div className="relative flex w-full flex-col items-center justify-center bg-muted/30 p-6 lg:w-1/2">
                <div className="absolute right-6 top-6">
                    <ModeToggle />
                </div>
                <div className="flex items-center gap-2 lg:hidden absolute left-6 top-6">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Sparkles className="size-4" />
                    </div>
                    <span className="font-heading font-semibold">Chaibook</span>
                </div>
                <div className="w-full max-w-sm">{children}</div>
            </div>
        </div>
    );
}
