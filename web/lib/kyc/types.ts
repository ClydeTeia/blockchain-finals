export type VerificationStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected"
  | "revoked";

export type KycStatusResponse = {
  walletAddress: string;
  status: VerificationStatus;
  kycProofHash?: string;
  requestedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
};

export type KycSubmitResponse = {
  requestId: string;
  kycProofHash: string;
  status: "pending";
};

export type KycRequest = {
  id: string;
  walletAddress: string;
  status: VerificationStatus;
  kycProofHash: string;
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
};

export type SignedUrlsResponse = {
  idImageUrl: string;
  selfieImageUrl: string;
  expiresAt: string;
};
