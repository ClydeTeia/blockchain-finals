"use client";

import { NetworkGuard } from "@/components/NetworkGuard";
import { KycReviewPanel } from "@/components/KycReviewPanel";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAdmin } from "@/hooks/useAdmin";

export default function AdminPage() {
  const { account } = useWallet();
  const { isAuthenticated, isLoading: authLoading } = useWalletAuth();
  const {
    kycRequests,
    isLoading,
    isActing,
    error,
    fetchKycRequests,
    getSignedUrls,
    approveKyc,
    rejectKyc,
  } = useAdmin();

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
      <p>
        <small>
          Authorization is enforced server-side. Unauthorized requests will be
          rejected with 403.
        </small>
      </p>

      <section>
        <KycReviewPanel
          requests={kycRequests}
          isLoading={isLoading}
          isActing={isActing}
          error={error}
          onGetSignedUrls={getSignedUrls}
          onApprove={approveKyc}
          onReject={rejectKyc}
          onRefresh={fetchKycRequests}
        />
      </section>
    </NetworkGuard>
  );
}
