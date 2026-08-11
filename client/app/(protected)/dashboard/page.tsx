import { requireAuth } from "@/features/auth";
import { DashboardHome } from "@/features/workspaces";

export default async function DashboardPage() {
    const session = await requireAuth();

    return <DashboardHome userName={session.user.name} />;
}
