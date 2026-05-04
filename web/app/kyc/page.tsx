"use client";

import { NetworkGuard } from "@/components/NetworkGuard";
import { KycUploadForm } from "@/components/KycUploadForm";
import { VerifiedRespondentPassStatus } from "@/components/VerifiedRespondentPassStatus";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useVerification } from "@/hooks/useVerification";

export default function KycPage() {
  const { account, provider } = useWallet();
  const { isAuthenticated, isLoading: authLoading } = useWalletAuth();
  const {
    kycStatus,
    kycProofHash,
    onChainVerified,
    isLoading,
    isSubmitting,
    isRequestingOnChain,
    error,
    submitKyc,
    requestOnChainVerification,
  } = useVerification(account, provider);

  if (authLoading) return <p>Loading...</p>;

  if (!account) {
    return (
      <NetworkGuard>
        <p>Connect your wallet to view KYC status.</p>
      </NetworkGuard>
    );
  }

  if (!isAuthenticated) {
    return (
      <NetworkGuard>
        <p>Sign in with your wallet to access this page.</p>
      </NetworkGuard>
    );
  }

  // Pending API submission + on-chain step not yet done
  const onChainProofHash = kycProofHash ?? "";
  const needsOnChainStep =
    kycStatus === "pending" && Boolean(onChainProofHash) && !onChainVerified;

  return (
    <NetworkGuard>
      <h1>Verified Respondent Pass</h1>

      <VerifiedRespondentPassStatus
        status={kycStatus}
        onChainVerified={onChainVerified}
        isLoading={isLoading}
      />

      {needsOnChainStep && (
        <section>
          <h2>Complete On-Chain Step</h2>
          <p>
            Documents uploaded. Request on-chain verification to notify the
            contract.
          </p>
          <p>
            <small>
              KYC proof hash: <code>{onChainProofHash}</code>
            </small>
          </p>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button
            onClick={() => requestOnChainVerification(onChainProofHash)}
            disabled={!provider || isRequestingOnChain}
          >
            {isRequestingOnChain
              ? "Waiting for MetaMask..."
              : "Request Verification On-Chain"}
          </button>
        </section>
      )}

      {(kycStatus === "not_submitted" || kycStatus === "rejected") && (
        <section>
          <h2>Submit KYC Documents</h2>
          <KycUploadForm
            provider={provider}
            isSubmitting={isSubmitting}
            isRequestingOnChain={isRequestingOnChain}
            error={error}
            onSubmit={submitKyc}
            onRequestOnChain={requestOnChainVerification}
          />
        </section>
      )}
    </NetworkGuard>
  );
}
