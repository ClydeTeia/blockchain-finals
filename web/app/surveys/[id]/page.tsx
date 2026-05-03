"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NetworkGuard } from "@/components/NetworkGuard";
import { AnswerSurveyForm } from "@/components/AnswerSurveyForm";
import { ResponseQualityResult } from "@/components/ResponseQualityResult";
import { CompletionProofSubmitter } from "@/components/CompletionProofSubmitter";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import { useAnswerSubmission } from "@/hooks/useAnswerSubmission";
import type { SurveyStruct } from "@/lib/blockchain/contract";

export default function SurveyAnswerPage() {
  const params = useParams();
  const surveyId = params?.id as string;

  const { account, provider } = useWallet();
  const { isAuthenticated, isLoading: authLoading } = useWalletAuth();
  const { getSurvey, hasSubmitted, isReady } = useSurveyContract(provider);

  const [survey, setSurvey] = useState<SurveyStruct | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingSurvey, setIsLoadingSurvey] = useState(false);

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
    reset,
  } = useAnswerSubmission(provider);

  // Load survey + check duplicate on mount (once contract is ready and user is known)
  useEffect(() => {
    if (!isReady || !account || !surveyId) return;
    setIsLoadingSurvey(true);
    setLoadError(null);

    Promise.all([getSurvey(BigInt(surveyId)), hasSubmitted(BigInt(surveyId), account)])
      .then(([s, submitted]) => {
        setSurvey(s);
        setAlreadySubmitted(submitted);
      })
      .catch((e: unknown) => {
        setLoadError(e instanceof Error ? e.message : "Failed to load survey.");
      })
      .finally(() => setIsLoadingSurvey(false));
  }, [isReady, account, surveyId, getSurvey, hasSubmitted]);

  // Auto-start attempt once survey loads and user hasn't already answered
  useEffect(() => {
    if (survey && !alreadySubmitted && phase === "idle" && account) {
      startAttempt(surveyId).catch(() => {});
    }
  }, [survey, alreadySubmitted, phase, account, surveyId, startAttempt]);

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
        <p>You have already submitted a response to this survey.</p>
      )}

      {survey && !alreadySubmitted && (
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
              />
            </>
          )}
        </>
      )}
    </NetworkGuard>
  );
}
