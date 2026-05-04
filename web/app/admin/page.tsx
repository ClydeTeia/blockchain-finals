"use client";

import { NetworkGuard } from "@/components/NetworkGuard";
import { AdminPanel } from "@/components/AdminPanel";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";

export default function AdminPage() {
  const { account } = useWallet();
  const { isAuthenticated, isLoading: authLoading } = useWalletAuth();

  if (authLoading) return <p>Loading...</p>;

  if (!account || !isAuthenticated) {
    return (
      <NetworkGuard>
        <p>Connect and sign in with your admin wallet to access this page.</p>
      </NetworkGuard>
    );
  }

  return (
    <NetworkGuard>
      <h1>Admin Dashboard</h1>

      <AdminPanel />
    </NetworkGuard>
  );
}
