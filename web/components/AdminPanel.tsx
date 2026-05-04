"use client";

import { KycReviewPanel } from "@/components/KycReviewPanel";
import { ResponseAuditPanel } from "@/components/ResponseAuditPanel";
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
    <div style={{ display: "grid", gap: "2rem" }}>
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
      <section>
        <ResponseAuditPanel />
      </section>
    </div>
  );
}

