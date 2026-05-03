"use client";

import { useCallback, useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import type {
  KycStatusResponse,
  KycSubmitResponse,
  VerificationStatus,
} from "@/lib/kyc/types";
import { buildKycFormData, mapVerificationStatus } from "@/lib/kyc/adapters";
import { useSurveyContract } from "@/hooks/useSurveyContract";

export type VerificationState = {
  kycStatus: VerificationStatus;
  kycProofHash: string | null;
  onChainVerified: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  isRequestingOnChain: boolean;
  error: string | null;
  submitKyc: (idImage: File, selfieImage: File) => Promise<KycSubmitResponse | null>;
  requestOnChainVerification: (kycProofHash: string) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useVerification(
  walletAddress: string | null,
  provider: BrowserProvider | null
): VerificationState {
  const [kycStatus, setKycStatus] = useState<VerificationStatus>("not_submitted");
  const [kycProofHash, setKycProofHash] = useState<string | null>(null);
  const [onChainVerified, setOnChainVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingOnChain, setIsRequestingOnChain] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Destructure stable callbacks to avoid infinite-loop deps
  const { isVerified: contractIsVerified, requestVerification: contractRequestVerification } =
    useSurveyContract(provider);

  const refresh = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      const [statusResult, chainResult] = await Promise.allSettled([
        fetch("/api/kyc/status"),
        contractIsVerified(walletAddress),
      ]);

      if (
        statusResult.status === "fulfilled" &&
        statusResult.value.ok
      ) {
        const data = (await statusResult.value.json()) as KycStatusResponse;
        setKycStatus(mapVerificationStatus(data.status));
        setKycProofHash(data.proofHash ?? null);
      } else if (
        statusResult.status === "fulfilled" &&
        statusResult.value.status !== 404
      ) {
        // 404 means Phase 6 API not implemented yet — silently ignore
        const err = (await statusResult.value.json()) as { error?: string };
        setError(err.error ?? "Failed to load KYC status.");
      }

      if (chainResult.status === "fulfilled") {
        setOnChainVerified(chainResult.value);
      }
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, contractIsVerified]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submitKyc = useCallback(
    async (document: File, selfie: File): Promise<KycSubmitResponse | null> => {
      setIsSubmitting(true);
      setError(null);
      try {
        const formData = buildKycFormData(document, selfie);
        const res = await fetch("/api/kyc/submit", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "KYC submission failed.");
        }
        const data = (await res.json()) as KycSubmitResponse;
        setKycStatus("pending");
        setKycProofHash(data.proofHash);
        return data;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "KYC submission failed.";
        setError(msg);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const requestOnChainVerification = useCallback(
    async (hash: string): Promise<void> => {
      setIsRequestingOnChain(true);
      setError(null);
      try {
        const tx = await contractRequestVerification(hash);
        await tx.wait();
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "On-chain verification request failed.";
        setError(msg);
        throw e;
      } finally {
        setIsRequestingOnChain(false);
      }
    },
    [contractRequestVerification]
  );

  return {
    kycStatus,
    kycProofHash,
    onChainVerified,
    isLoading,
    isSubmitting,
    isRequestingOnChain,
    error,
    submitKyc,
    requestOnChainVerification,
    refresh,
  };
}
