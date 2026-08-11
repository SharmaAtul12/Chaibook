"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { signIn } from "../lib/auth-client";
import { authRoutes } from "../lib/auth-routes";

function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={cn("size-4", className)}
        >
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    );
}

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const callbackUrl = searchParams.get("callbackUrl") ?? authRoutes.dashboard;

    async function handleGoogleSignIn() {
        setIsLoading(true);
        setError(null);

        const { data, error } = await signIn.social({
            provider: "google",
            callbackURL: callbackUrl,
        });

        if (error) {
            setError(error.message ?? "Something went wrong. Please try again.");
            setIsLoading(false);
            return;
        }

        if (data?.url && data.redirect) {
            window.location.href = data.url;
            return;
        }

        setIsLoading(false);
    }

    return (
        <div className={cn("flex flex-col gap-8", className)} {...props}>
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                    <div className="absolute inset-0 -z-10 animate-pulse rounded-2xl bg-primary/20 blur-xl" />
                    <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-linear-to-br from-primary/15 to-primary/5 text-primary shadow-sm">
                        <Sparkles className="size-7" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">
                        Welcome back
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Sign in to continue to your workspace
                    </p>
                </div>
            </div>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void handleGoogleSignIn();
                }}
            >
                <FieldGroup className="gap-5">
                    <Field>
                        <Button
                            type="submit"
                            variant="outline"
                            size="lg"
                            className="h-12 w-full rounded-xl text-base font-medium shadow-sm transition-all hover:shadow-md"
                            disabled={isLoading}
                        >
                            {isLoading ? <Spinner /> : <GoogleIcon />}
                            {isLoading ? "Signing in..." : "Continue with Google"}
                        </Button>
                    </Field>

                    {error ? (
                        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">
                            {error}
                        </p>
                    ) : null}

                    <FieldDescription className="flex items-center justify-center gap-1.5 text-center text-xs">
                        <ShieldCheck className="size-3.5 text-primary/70" />
                        Secure sign-in with end-to-end encryption
                    </FieldDescription>
                </FieldGroup>
            </form>

            <p className="text-center text-xs leading-relaxed text-muted-foreground">
                By continuing, you agree to our{" "}
                <a
                    href="#"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                    Terms of Service
                </a>{" "}
                and{" "}
                <a
                    href="#"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                    Privacy Policy
                </a>
                .
            </p>
        </div>
    );
}
