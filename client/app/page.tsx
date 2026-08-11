import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, MessagesSquare, Network, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { authRoutes, getSession } from "@/features/auth";

const features = [
    {
        icon: BookOpen,
        title: "Unified sources",
        description:
            "Add PDFs, websites, and YouTube videos to a single, searchable workspace.",
    },
    {
        icon: MessagesSquare,
        title: "Grounded chat",
        description:
            "Ask questions and get answers with inline citations back to your sources.",
    },
    {
        icon: Network,
        title: "Persistent memory",
        description:
            "Your assistant remembers context across sessions so it gets smarter over time.",
    },
];

export default async function HomePage() {
    const session = await getSession();

    if (session) {
        redirect(authRoutes.dashboard);
    }

    return (
        <div className="relative flex min-h-svh flex-col overflow-hidden">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 opacity-50 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_at_top,black,transparent_70%)]"
            />
            <div className="absolute -top-40 left-1/2 -z-10 size-144 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

            <header className="flex items-center justify-between px-6 py-5 md:px-10">
                <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                        <Sparkles className="size-5" />
                    </div>
                    <span className="font-heading text-lg font-semibold tracking-tight">
                        Chaibook
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <Button
                        nativeButton={false}
                        variant="ghost"
                        render={<Link href={authRoutes.login} />}
                    >
                        Sign in
                    </Button>
                </div>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                    <span className="flex size-1.5 rounded-full bg-primary" />
                    Your AI-powered research notebook
                </div>

                <h1 className="mt-6 max-w-3xl font-heading text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
                    Chat with everything{" "}
                    <span className="text-primary">you read.</span>
                </h1>

                <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
                    Bring your sources together, ask questions, and get cited
                    answers. Chaibook turns your documents into a conversation.
                </p>

                <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
                    <Button
                        nativeButton={false}
                        size="lg"
                        className="h-12 rounded-xl px-6 text-base"
                        render={<Link href={authRoutes.login} />}
                    >
                        Get started
                        <ArrowRight />
                    </Button>
                </div>

                <div className="mt-20 grid w-full max-w-4xl gap-4 md:grid-cols-3">
                    {features.map(({ icon: Icon, title, description }) => (
                        <div
                            key={title}
                            className="rounded-2xl border bg-card/50 p-6 text-left backdrop-blur transition-colors hover:bg-card"
                        >
                            <div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                                <Icon className="size-5" />
                            </div>
                            <h3 className="mt-4 font-heading text-base font-medium">
                                {title}
                            </h3>
                            <p className="mt-1.5 text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    ))}
                </div>
            </main>

            <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} Chaibook. All rights reserved.
            </footer>
        </div>
    );
}
