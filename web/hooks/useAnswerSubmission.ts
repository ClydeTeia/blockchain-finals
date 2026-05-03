"use client";

import { useCallback, useState } from "react";
import { BrowserProvider } from "ethers";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import type { TxStatus } from "@/components/TransactionStatus";

export type SubmissionPhase =
  | "idle"
  | "starting"
  | "answering"
  | "submitting"
  | "validation_failed"
  | "pending_onchain"
  | "submitting_onchain"
  | "completed";

export type ProofData = {
  respondent: string;
  surveyId: string;
  answerHash: string;
  rewardAmountWei: string;
  nonce: string;
  deadline: string;
  signature: string | null;
};

export type ValidationResult = {
  passed: boolean;
  score: number;
  reason: string | null;
  details: Record<string, unknown>;
};

type SubmitApiResponse = {
  answerId: string;
  surveyId: string;
  status: string;
  validation: ValidationResult;
  answerHash: string;
  salt: string;
  proof: ProofData | null;
};

export type StartAttemptResult = {
  attemptId: string;
  surveyId: string;
  walletAddress: string;
  startedAt: string;
};

export type AnswerSubmissionState = {
  phase: SubmissionPhase;
  attemptId: string | null;
  startedAt: Date | null;
  answerId: string | null;
  validationResult: ValidationResult | null;
  proof: ProofData | null;
  txHash: string | null;
  txStatus: TxStatus;
  isProofExpired: boolean;
  error: string | null;
  startAttempt: (surveyId: string) => Promise<StartAttemptResult | null>;
  submitAnswer: (
    surveyId: string,
    answer: Record<string, string>,
    rewardAmountWei: string,
    completionTimeSeconds: number
  ) => Promise<void>;
  submitOnChain: () => Promise<void>;
  refreshProof: () => Promise<void>;
  reset: () => void;
};

export function useAnswerSubmission(
  provider: BrowserProvider | null
): AnswerSubmissionState {
  const [phase, setPhase] = useState<SubmissionPhase>("idle");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [answerId, setAnswerId] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [proof, setProof] = useState<ProofData | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const { submitResponseWithProof: contractSubmit } = useSurveyContract(provider);

  const isProofExpired =
    proof !== null &&
    parseInt(proof.deadline, 10) < Math.floor(Date.now() / 1000);

  const startAttempt = useCallback(
    async (surveyId: string): Promise<StartAttemptResult | null> => {
      setPhase("starting");
      setError(null);
      try {
        const res = await fetch(`/api/surveys/${surveyId}/start-attempt`, {
          method: "POST",
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Failed to start attempt.");
        }
        const data = (await res.json()) as StartAttemptResult;
        setAttemptId(data.attemptId);
        setStartedAt(new Date(data.startedAt));
        setPhase("answering");
        return data;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to start attempt.";
        setError(msg);
        setPhase("idle");
        return null;
      }
    },
    []
  );

  const submitAnswer = useCallback(
    async (
      surveyId: string,
      answer: Record<string, string>,
      rewardAmountWei: string,
      completionTimeSeconds: number
    ): Promise<void> => {
      if (!attemptId) {
        setError("No active attempt. Start the survey first.");
        return;
      }
      setPhase("submitting");
      setError(null);
      try {
        const res = await fetch("/api/answers/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            surveyId,
            attemptId,
            rewardAmountWei,
            answer,
            completionTimeSeconds,
          }),
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Answer submission failed.");
        }
        const data = (await res.json()) as SubmitApiResponse;
        setAnswerId(data.answerId);
        setValidationResult(data.validation);
        if (data.validation.passed && data.proof) {
          setProof(data.proof);
          setPhase("pending_onchain");
        } else {
          setPhase("validation_failed");
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Answer submission failed.";
        setError(msg);
        setPhase("answering");
      }
    },
    [attemptId]
  );

  const submitOnChain = useCallback(async (): Promise<void> => {
    if (!proof?.signature) {
      setError("Proof is missing or incomplete.");
      return;
    }
    setPhase("submitting_onchain");
    setTxStatus("pending");
    setTxHash(null);
    setError(null);
    try {
      const tx = await contractSubmit(
        BigInt(proof.surveyId),
        proof.answerHash,
        BigInt(proof.rewardAmountWei),
        BigInt(proof.nonce),
        BigInt(proof.deadline),
        proof.signature
      );
      setTxHash(tx.hash);
      await tx.wait();
      setTxStatus("confirmed");
      setPhase("completed");
      // Best-effort: notify backend of on-chain confirmation
      if (answerId) {
        fetch(`/api/answers/${answerId}/mark-onchain-confirmed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash: tx.hash }),
        }).catch(() => {});
      }
    } catch (e: unknown) {
      // User cancelled MetaMask or tx reverted — stay pending_onchain so user can retry
      const msg = e instanceof Error ? e.message : "Transaction failed or cancelled.";
      setTxStatus("failed");
      setPhase("pending_onchain");
      setError(msg);
    }
  }, [proof, answerId, contractSubmit]);

  const refreshProof = useCallback(async (): Promise<void> => {
    if (!answerId) return;
    setError(null);
    try {
      const res = await fetch(`/api/answers/${answerId}/refresh-proof`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to refresh proof.");
      }
      const data = (await res.json()) as {
        answerId: string;
        proof: { nonce: string; deadline: string; signature: string };
      };
      setProof((prev) =>
        prev
          ? {
              ...prev,
              nonce: data.proof.nonce,
              deadline: data.proof.deadline,
              signature: data.proof.signature,
            }
          : null
      );
      // Reset tx state so user can retry
      setTxStatus("idle");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to refresh proof.";
      setError(msg);
    }
  }, [answerId]);

  const reset = useCallback(() => {
    setPhase("idle");
    setAttemptId(null);
    setStartedAt(null);
    setAnswerId(null);
    setValidationResult(null);
    setProof(null);
    setTxHash(null);
    setTxStatus("idle");
    setError(null);
  }, []);

  return {
    phase,
    attemptId,
    startedAt,
    answerId,
    validationResult,
    proof,
    txHash,
    txStatus,
    isProofExpired,
    error,
    startAttempt,
    submitAnswer,
    submitOnChain,
    refreshProof,
    reset,
  };
}
