import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { hasRoleOnContract } from "@/lib/blockchain/roles";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  if ("response" in session) {
    redirect("/?error=login_required");
  }

  const params = await searchParams;
  if (params.error === "admin_required") {
    // This will be handled client-side by the redirect to home with error
    redirect("/?error=admin_required");
  }

  const isAdmin = await hasRoleOnContract(session.walletAddress, "ADMIN_ROLE");
  if (!isAdmin) {
    redirect("/?error=admin_required");
  }

  // For now, we'll pass minimal data and let the client component fetch
  return <AdminDashboard walletAddress={session.walletAddress} initialAnswers={[]} />;
}
