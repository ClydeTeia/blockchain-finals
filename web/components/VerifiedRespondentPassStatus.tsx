"use client";

import type { VerificationStatus } from "@/lib/kyc/types";

const STATUS_LABELS: Record<VerificationStatus, string> = {
  not_submitted: "Not verified",
  pending: "Pending review",
  approved: "Verified Respondent Pass",
  rejected: "Verification rejected",
  revoked: "Verification revoked",
};

const STATUS_DESCRIPTIONS: Record<VerificationStatus, string> = {
  not_submitted: "Submit a KYC request to receive a Verified Respondent Pass and answer reward surveys.",
  pending: "Your documents are under review. You will be able to answer surveys once approved.",
  approved: "You can now answer funded surveys and earn Sepolia ETH rewards.",
  rejected: "Your verification was rejected.",
  revoked: "Your verification has been revoked.",
};

type VerifiedRespondentPassStatusProps = {
  status: VerificationStatus;
  onChainVerified?: boolean;
  isLoading?: boolean;
  rejectionReason?: string | null;
};

export function VerifiedRespondentPassStatus({
  status,
  onChainVerified,
  isLoading,
  rejectionReason,
}: VerifiedRespondentPassStatusProps) {
  if (isLoading) {
    return <p>Loading verification status...</p>;
  }

  const description = STATUS_DESCRIPTIONS[status];

  return (
    <div>
      <h3>{STATUS_LABELS[status]}</h3>
      <p>{description}</p>
      {status === "rejected" && rejectionReason && (
        <p>Reason: {rejectionReason}</p>
      )}
      {onChainVerified !== undefined && status !== "approved" && onChainVerified && (
        <p>Note: On-chain status shows Approved.</p>
      )}
    </div>
  );
}
