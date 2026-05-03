"use client";

import { useCallback, useEffect, useState } from "react";
import type { KycRequest, SignedUrlsResponse } from "@/lib/kyc/types";

export type AdminState = {
  kycRequests: KycRequest[];
  isLoading: boolean;
  isActing: boolean;
  error: string | null;
  fetchKycRequests: () => Promise<void>;
  getSignedUrls: (requestId: string) => Promise<SignedUrlsResponse | null>;
  approveKyc: (requestId: string) => Promise<boolean>;
  rejectKyc: (requestId: string, reason: string) => Promise<boolean>;
};

export function useAdmin(): AdminState {
  const [kycRequests, setKycRequests] = useState<KycRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKycRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/kyc-requests");
      if (!res.ok) {
        if (res.status === 404) {
          // Phase 6 API not yet implemented
          setKycRequests([]);
          return;
        }
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to load KYC requests.");
      }
      const data = (await res.json()) as { requests: KycRequest[] };
      setKycRequests(data.requests ?? []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load KYC requests.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKycRequests();
  }, [fetchKycRequests]);

  const getSignedUrls = useCallback(
    async (requestId: string): Promise<SignedUrlsResponse | null> => {
      try {
        const res = await fetch(`/api/admin/kyc/${requestId}/signed-urls`, {
          method: "POST",
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Failed to get signed URLs.");
        }
        return (await res.json()) as SignedUrlsResponse;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to get signed URLs.";
        setError(msg);
        return null;
      }
    },
    []
  );

  const approveKyc = useCallback(
    async (requestId: string): Promise<boolean> => {
      setIsActing(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/kyc/${requestId}/approve`, {
          method: "POST",
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Approval failed.");
        }
        await fetchKycRequests();
        return true;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Approval failed.";
        setError(msg);
        return false;
      } finally {
        setIsActing(false);
      }
    },
    [fetchKycRequests]
  );

  const rejectKyc = useCallback(
    async (requestId: string, reason: string): Promise<boolean> => {
      setIsActing(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/kyc/${requestId}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Rejection failed.");
        }
        await fetchKycRequests();
        return true;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Rejection failed.";
        setError(msg);
        return false;
      } finally {
        setIsActing(false);
      }
    },
    [fetchKycRequests]
  );

  return {
    kycRequests,
    isLoading,
    isActing,
    error,
    fetchKycRequests,
    getSignedUrls,
    approveKyc,
    rejectKyc,
  };
}
