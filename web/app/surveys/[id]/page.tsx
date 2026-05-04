"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { NetworkGuard } from "@/components/NetworkGuard";
import { AnswerSurveyForm } from "@/components/AnswerSurveyForm";
import { ResponseQualityResult } from "@/components/ResponseQualityResult";
import { CompletionProofSubmitter } from "@/components/CompletionProofSubmitter";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import { useAnswerSubmission } from "@/hooks/useAnswerSubmission";
import type { ProofData, SubmissionPhase } from "@/hooks/useAnswerSubmission";
import type { TxStatus } from "@/components/TransactionStatus";

type SurveyDetails = {
  id: number;
  creator: string;
  title: string;
  description: string;
  question: string;
  rewardPerResponse: string;
  maxResponses: string;
  responseCount: string;
  escrowRemaining: string;
  active: boolean;
  unusedRewardsWithdrawn: boolean;
  options: string[];
  questions: Array<{
    id: string;
    prompt: string;
    type: "multiple_choice" | "text";
    required: boolean;
    options?: string[];
  }>;
};

type PendingAnswer = {
  id: string;
  surveyId: string;
  answerHash: string;
  completionNonce: string;
  completionDeadline: string | null;
  completionSignature: string | null;
  status: string;
};

export default function SurveyAnswerPage() {
  const params = useParams();
  const surveyId = params?.id as string;

  const { account, provider } = useWallet();
  const { isAuthenticated, isLoading: authLoading } = useWalletAuth();
  const { hasSubmitted, isReady, submitResponseWithProof } = useSurveyContract(provider);

  const [survey, setSurvey] = useState<SurveyDetails | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState<PendingAnswer | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingSurvey, setIsLoadingSurvey] = useState(false);

  // State for pending answer on-chain submission
  const [pendingPhase, setPendingPhase] = useState<SubmissionPhase>("pending_onchain");
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [pendingTxStatus, setPendingTxStatus] = useState<TxStatus>("idle");
  const [pendingError, setPendingError] = useState<string | null>(null);

  const {
    phase,
    startedAt,
    validationResult,
    proof,
    txHash,
    txStatus,
    isProofExpired,
    error: submissionError,
    startAttempt,
    submitAnswer,
    submitOnChain,
    refreshProof,
    retryBackendConfirmation,
    reset,
  } = useAnswerSubmission(provider);

  // Load survey + check duplicate on mount (once contract is ready and user is known)
  useEffect(() => {
    if (!isReady || !account || !surveyId) return;
    setIsLoadingSurvey(true);
    setLoadError(null);

    Promise.all([
      fetch(`/api/surveys/${surveyId}`).then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load survey details.");
        }
        const data = (await response.json()) as { survey: SurveyDetails };
        return data.survey;
      }),
      hasSubmitted(BigInt(surveyId), account),
      // Also check for pending off-chain answers
      fetch("/api/answers/my").then(async (response) => {
        if (!response.ok) return [];
        const data = (await response.json()) as { answers?: PendingAnswer[] };
        return data.answers ?? [];
      })
    ])
      .then(([s, submitted, myAnswers]) => {
        setSurvey(s as SurveyDetails);
        setAlreadySubmitted(submitted);

        // Check if there's a pending_onchain answer for this survey
        const pending = (myAnswers as PendingAnswer[]).find(
          (a) => a.surveyId === surveyId && a.status === "pending_onchain"
        );
        if (pending && !submitted) {
          setPendingAnswer(pending);
        }
      })
      .catch((e: unknown) => {
        setLoadError(e instanceof Error ? e.message : "Failed to load survey.");
      })
      .finally(() => setIsLoadingSurvey(false));
  }, [isReady, account, surveyId, hasSubmitted]);

  // Auto-start attempt once survey loads and user hasn't already answered
  // AND there's no pending off-chain answer
  useEffect(() => {
    if (survey && !alreadySubmitted && !pendingAnswer && phase === "idle" && account) {
      startAttempt(surveyId).catch(() => {});
    }
  }, [survey, alreadySubmitted, pendingAnswer, phase, account, surveyId, startAttempt]);

  // Build proof data from pending answer for the CompletionProofSubmitter
  const pendingProof: ProofData | null = useMemo(() => {
    if (!pendingAnswer || !pendingAnswer.completionSignature) return null;
    return {
      respondent: account ?? "",
      surveyId: pendingAnswer.surveyId,
      answerHash: pendingAnswer.answerHash,
      rewardAmountWei: survey?.rewardPerResponse ?? "0",
      nonce: pendingAnswer.completionNonce,
      deadline: pendingAnswer.completionDeadline
        ? Math.floor(new Date(pendingAnswer.completionDeadline).getTime() / 1000).toString()
        : "0",
      signature: pendingAnswer.completionSignature,
    };
  }, [pendingAnswer, account, survey?.rewardPerResponse]);

  const pendingProofExpired = pendingProof
    ? parseInt(pendingProof.deadline, 10) < Math.floor(Date.now() / 1000)
    : false;

  // Handle on-chain submission for pending answers using the contract directly
  const handlePendingSubmitOnChain = useCallback(async () => {
    if (!pendingProof?.signature || !pendingAnswer) return;
    setPendingPhase("submitting_onchain");
    setPendingTxStatus("pending");
    setPendingTxHash(null);
    setPendingError(null);

    try {
      const tx = await submitResponseWithProof(
        BigInt(pendingProof.surveyId),
        pendingProof.answerHash,
        BigInt(pendingProof.rewardAmountWei),
        BigInt(pendingProof.nonce),
        BigInt(pendingProof.deadline),
        pendingProof.signature
      );
      setPendingTxHash(tx.hash);
      await tx.wait();

      // Confirm with backend
      const confirmRes = await fetch(`/api/answers/${pendingAnswer.id}/mark-onchain-confirmed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: tx.hash }),
      });

      setPendingTxStatus("confirmed");
      if (!confirmRes.ok) {
        setPendingPhase("sync_pending");
        setPendingError("Transaction confirmed, backend sync pending. Retry confirmation.");
        return;
      }
      setPendingPhase("completed");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed or cancelled.";
      setPendingTxStatus("failed");
      setPendingPhase("pending_onchain");
      setPendingError(msg);
    }
  }, [pendingProof, pendingAnswer, submitResponseWithProof]);

  const handlePendingRefreshProof = useCallback(async () => {
    if (!pendingAnswer) return;
    try {
      const res = await fetch(`/api/answers/${pendingAnswer.id}/refresh-proof`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setPendingError(err.error ?? "Failed to refresh proof.");
        return;
      }
      // Reload the page to get the fresh proof
      window.location.reload();
    } catch (e: unknown) {
      setPendingError(e instanceof Error ? e.message : "Failed to refresh proof.");
    }
  }, [pendingAnswer]);

  const handlePendingRetrySync = useCallback(async () => {
    if (!pendingAnswer || !pendingTxHash) return;
    setPendingError(null);
    const res = await fetch(`/api/answers/${pendingAnswer.id}/mark-onchain-confirmed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash: pendingTxHash }),
    });
    if (res.ok) {
      setPendingPhase("completed");
    } else {
      setPendingError("Transaction confirmed, backend sync pending. Retry confirmation.");
    }
  }, [pendingAnswer, pendingTxHash]);

  if (authLoading) return <p>Loading...</p>;

  if (!account) {
    return (
      <NetworkGuard>
        <p>Connect your wallet to answer surveys.</p>
      </NetworkGuard>
    );
  }

  if (!isAuthenticated) {
    return (
      <NetworkGuard>
        <p>Sign in with your wallet to answer surveys.</p>
      </NetworkGuard>
    );
  }

  return (
    <NetworkGuard>
      {isLoadingSurvey && <p>Loading survey...</p>}
      {loadError && <p style={{ color: "red" }}>{loadError}</p>}

      {alreadySubmitted && (
        <div className="max-w-2xl mx-auto">
          <div className="card text-center py-8">
            <div className="text-3xl mb-3">✅</div>
            <h2 className="text-xl font-semibold mb-2">Already Submitted</h2>
            <p className="text-muted">You have already submitted a response to this survey and it was confirmed on-chain.</p>
            <Link href="/rewards" className="btn btn-primary mt-4 inline-block">
              View Rewards →
            </Link>
          </div>
        </div>
      )}

      {/* Show pending on-chain submission UI for existing off-chain answer */}
      {pendingAnswer && !alreadySubmitted && survey && (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-semibold mb-1">{survey.title}</h1>
          {survey.description && <p className="text-muted mb-4">{survey.description}</p>}
          <p className="text-sm text-muted mb-6">
            Reward per response: {(Number(survey.rewardPerResponse) / 1e18).toFixed(6)} ETH
          </p>

          <div className="p-4 mb-6 bg-amber-50 border border-amber-200 rounded">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">
              ⚠️ On-Chain Submission Required
            </h3>
            <p className="text-xs text-amber-700">
              Your answer passed validation but the on-chain proof has not been submitted yet.
              Complete the on-chain transaction below to earn your reward.
            </p>
          </div>

          {pendingProof ? (
            <CompletionProofSubmitter
              phase={pendingPhase}
              proof={pendingProof}
              txStatus={pendingTxStatus}
              txHash={pendingTxHash}
              isProofExpired={pendingProofExpired}
              error={pendingError}
              onSubmitOnChain={handlePendingSubmitOnChain}
              onRefreshProof={handlePendingRefreshProof}
              onRetryBackendSync={handlePendingRetrySync}
            />
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-700 font-medium">
                The completion proof is missing. Please refresh to get a new proof.
              </p>
              <button
                className="btn btn-secondary mt-3"
                onClick={handlePendingRefreshProof}
              >
                Refresh Proof
              </button>
            </div>
          )}
        </div>
      )}

      {survey && !alreadySubmitted && !pendingAnswer && (
        <>
          <h1>{survey.title}</h1>
          {survey.description && <p>{survey.description}</p>}
          <p>
            <small>
              Reward per response:{" "}
              {(Number(survey.rewardPerResponse) / 1e18).toFixed(6)} ETH
            </small>
          </p>

          {(phase === "answering" || phase === "submitting") && startedAt && (
            <AnswerSurveyForm
              survey={survey}
              startedAt={startedAt}
              isSubmitting={phase === "submitting"}
              error={submissionError}
              onSubmit={(answer, rewardAmountWei, completionTimeSeconds) =>
                submitAnswer(surveyId, answer, rewardAmountWei, completionTimeSeconds)
              }
            />
          )}

          {phase === "starting" && <p>Starting attempt...</p>}

          {phase === "validation_failed" && validationResult && (
            <>
              <ResponseQualityResult result={validationResult} />
              <button onClick={reset} style={{ marginTop: "1rem" }}>
                Return to surveys
              </button>
            </>
          )}

          {(phase === "pending_onchain" ||
            phase === "submitting_onchain" ||
            phase === "sync_pending" ||
            phase === "completed") && (
            <>
              {validationResult && (
                <ResponseQualityResult result={validationResult} />
              )}
              <CompletionProofSubmitter
                phase={phase}
                proof={proof}
                txStatus={txStatus}
                txHash={txHash}
                isProofExpired={isProofExpired}
                error={submissionError}
                onSubmitOnChain={submitOnChain}
                onRefreshProof={refreshProof}
                onRetryBackendSync={retryBackendConfirmation}
              />
            </>
          )}
        </>
      )}
    </NetworkGuard>
  );
}
