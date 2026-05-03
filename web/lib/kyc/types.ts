export type VerificationStatus =
  | "not_submitted"
  | "pending"
  | "approved"
  | "rejected"
  | "revoked";

export type KycStatusResponse = {
  walletAddress: string;
  status: VerificationStatus;
  proofHash?: string;
  submittedAt?: string;
  reviewedAt?: string;
  decisionReason?: string;
};

export type KycSubmitResponse = {
  requestId: string;
  proofHash: string;
  status: "pending";
};

export type KycRequest = {
  id: string;
  walletAddress: string;
  status: VerificationStatus;
  proofHash: string;
  submittedAt: string;
  reviewedAt?: string;
  decisionReason?: string | null;
};

export type SignedUrlsResponse = {
  documentSignedUrl: string;
  selfieSignedUrl: string;
  expiresInSeconds: number;
};
