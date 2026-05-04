"use client";

import { KycReviewPanel } from "@/components/KycReviewPanel";
import { useAdmin } from "@/hooks/useAdmin";

export function AdminPanel() {
  const {
    kycRequests,
    isLoading,
    isActing,
    error,
    fetchKycRequests,
    getSignedUrls,
    approveKyc,
    rejectKyc
  } = useAdmin();

  return (
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
  );
}
