import type { KycStatusResponse, VerificationStatus } from "@/lib/kyc/types";

export function mapVerificationStatus(status: KycStatusResponse["status"]): VerificationStatus {
  return status;
}

export function buildKycFormData(document: File, selfie: File): FormData {
  const formData = new FormData();
  formData.append("document", document);
  formData.append("selfie", selfie);
  return formData;
}
