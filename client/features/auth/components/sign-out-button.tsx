"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { signOut } from "../lib/auth-client";
import { authRoutes } from "../lib/auth-routes";

export function SignOutButton({
    variant = "outline",
    showLabel = true,
    ...props
}: React.ComponentProps<typeof Button> & { showLabel?: boolean }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleSignOut() {
        setIsLoading(true);

        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push(authRoutes.login);
                    router.refresh();
                },
            },
        });

        setIsLoading(false);
    }

    return (
        <Button
            variant={variant}
            onClick={() => void handleSignOut()}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? <Spinner /> : <LogOut />}
            {showLabel ? "Sign out" : null}
        </Button>
    );
}
