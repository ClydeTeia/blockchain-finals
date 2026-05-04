"use client";

import { formatEther } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useSurveyContract } from "@/hooks/useSurveyContract";

export type RewardAnswer = {
  id: string;
  surveyId: number;
  status: string;
  validationScore?: number;
  validationReason?: string;
};

type UseRewardsResult = {
  claimableEth: string;
  totalEarnedEth: string;
  answers: RewardAnswer[];
  isLoading: boolean;
  isClaiming: boolean;
  error: string | null;
  claim: () => Promise<void>;
  refetch: () => Promise<void>;
};

export function useRewards(): UseRewardsResult {
  const { isAuthenticated, walletAddress, isLoading: authLoading } = useWalletAuth();
  const { provider } = useWallet();
  const { isReady, claimableRewards, totalEarned, claimRewards } = useSurveyContract(provider);

  const [claimableEth, setClaimableEth] = useState("0");
  const [totalEarnedEth, setTotalEarnedEth] = useState("0");
  const [answers, setAnswers] = useState<RewardAnswer[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isAuthenticated || !walletAddress || !isReady) {
      return;
    }

    setError(null);
    try {
      const [claimableWei, totalWei, answersResponse] = await Promise.all([
        claimableRewards(walletAddress),
        totalEarned(walletAddress),
        fetch("/api/answers/my")
      ]);

      if (!answersResponse.ok) {
        throw new Error("Failed to fetch answers.");
      }

      const payload = (await answersResponse.json()) as { answers?: RewardAnswer[] };
      setClaimableEth(formatEther(claimableWei));
      setTotalEarnedEth(formatEther(totalWei));
      setAnswers(payload.answers ?? []);
    } catch {
      setError("Failed to load reward data.");
    }
  }, [claimableRewards, isAuthenticated, isReady, totalEarned, walletAddress]);

  useEffect(() => {
    if (!authLoading) {
      void refetch();
    }
  }, [authLoading, refetch]);

  const claim = useCallback(async () => {
    if (!isAuthenticated || !isReady) {
      return;
    }

    setIsClaiming(true);
    setError(null);
    try {
      const tx = await claimRewards();
      await tx.wait();
      await refetch();
    } catch {
      setError("Failed to claim rewards. Please try again.");
    } finally {
      setIsClaiming(false);
    }
  }, [claimRewards, isAuthenticated, isReady, refetch]);

  return {
    claimableEth,
    totalEarnedEth,
    answers,
    isLoading: authLoading,
    isClaiming,
    error,
    claim,
    refetch
  };
}

