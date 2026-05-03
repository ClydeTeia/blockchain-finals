"use client";

import type { ProofData, SubmissionPhase } from "@/hooks/useAnswerSubmission";
import { TransactionStatus } from "@/components/TransactionStatus";
import type { TxStatus } from "@/components/TransactionStatus";

type CompletionProofSubmitterProps = {
  phase: SubmissionPhase;
  proof: ProofData | null;
  txStatus: TxStatus;
  txHash: string | null;
  isProofExpired: boolean;
  error: string | null;
  onSubmitOnChain: () => void;
  onRefreshProof: () => void;
};

export function CompletionProofSubmitter({
  phase,
  proof,
  txStatus,
  txHash,
  isProofExpired,
  error,
  onSubmitOnChain,
  onRefreshProof,
}: CompletionProofSubmitterProps) {
  if (phase === "completed") {
    return (
      <div>
        <p style={{ color: "green" }}>
          <strong>Reward transaction confirmed.</strong> Your reward is now
          claimable.
        </p>
        <TransactionStatus status={txStatus} txHash={txHash} />
      </div>
    );
  }

  if (phase !== "pending_onchain" && phase !== "submitting_onchain") {
    return null;
  }

  if (!proof) return null;

  const deadlineDate = new Date(parseInt(proof.deadline, 10) * 1000);
  const isSubmitting = phase === "submitting_onchain";

  return (
    <div>
      <h3>Complete Reward Transaction</h3>
      <p>
        Your answer was validated off-chain. Submit the proof on-chain to credit
        your claimable reward.
      </p>

      {isProofExpired ? (
        <div>
          <p style={{ color: "orange" }}>
            <strong>Proof expired</strong> — the signing deadline has passed.
            Refresh the proof to get a new one.
          </p>
          <button onClick={onRefreshProof} disabled={isSubmitting}>
            Refresh Proof
          </button>
        </div>
      ) : (
        <div>
          <p>
            <small>
              Proof valid until:{" "}
              {deadlineDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          </p>
          <button
            onClick={onSubmitOnChain}
            disabled={isSubmitting || !proof.signature}
          >
            {isSubmitting ? "Waiting for MetaMask..." : "Submit Proof On-Chain"}
          </button>
        </div>
      )}

      <TransactionStatus
        status={txStatus}
        txHash={txHash}
        errorMessage={error}
      />

      {txStatus === "failed" && !isProofExpired && (
        <p>
          <small>
            Transaction was cancelled or failed. You can retry above.
          </small>
        </p>
      )}
    </div>
  );
}
