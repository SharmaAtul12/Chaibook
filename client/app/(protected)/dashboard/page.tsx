import { CheckCircle2, Sparkles } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { requireAuth, SignOutButton } from "@/features/auth";

// NOTE: Temporary placeholder to validate the auth flow.
// This will be replaced by the workspaces dashboard in the next module.
export default async function DashboardPage() {
    const session = await requireAuth();

    return (
        <div className="flex min-h-svh flex-col">
            <header className="flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Sparkles className="size-4" />
                    </div>
                    <span className="font-heading font-semibold">Chaibook</span>
                </div>
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <SignOutButton />
                </div>
            </header>

            <main className="flex flex-1 items-center justify-center p-6">
                <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-xs">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckCircle2 className="size-6" />
                    </div>
                    <h1 className="mt-4 font-heading text-xl font-semibold">
                        You&apos;re signed in
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Welcome back,{" "}
                        <span className="font-medium text-foreground">
                            {session.user.name}
                        </span>
                        . The workspaces dashboard is coming up next.
                    </p>
                </div>
            </main>
        </div>
    );
}
