"use client";

import { useEffect, useState } from "react";
import { NetworkGuard } from "@/components/NetworkGuard";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import Link from "next/link";

export default function HomePage() {
  const { account, provider } = useWallet();
  const { isAdmin } = useWalletAuth();
  const contract = useSurveyContract(provider);
  const [hasOnChainAdminRole, setHasOnChainAdminRole] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkOnChainAdmin() {
      if (!account || !contract.contractAddress) {
        if (!cancelled) {
          setHasOnChainAdminRole(false);
        }
        return;
      }

      const onChainAdmin = await contract.hasAdminRole(account).catch(() => false);
      if (!cancelled) {
        setHasOnChainAdminRole(onChainAdmin);
      }
    }

    void checkOnChainAdmin();
    return () => {
      cancelled = true;
    };
  }, [account, contract]);

  const shouldShowKycCta = !(isAdmin || hasOnChainAdminRole);

  return (
    <NetworkGuard>
      <div className="text-center" style={{ padding: "6rem 0" }}>
        <h1 className="text-4xl font-bold mb-4">
          SurveyChain Rewards
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto mb-8">
          A blockchain-based escrow and proof-of-completion system for verified survey rewards.
          Clean, transparent, and direct to your wallet.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/surveys" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem", fontSize: "1rem" }}>
            Browse Surveys
          </Link>

          {shouldShowKycCta ? (
            <Link href="/kyc" className="btn btn-secondary" style={{ padding: "0.75rem 1.5rem", fontSize: "1rem" }}>
              Complete KYC
            </Link>
          ) : (
            <Link href="/admin" className="btn btn-secondary" style={{ padding: "0.75rem 1.5rem", fontSize: "1rem" }}>
              Admin Dashboard
            </Link>
          )}
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
          <div className="surface">
            <h3 className="text-lg font-semibold mb-2">Funded Escrow</h3>
            <p className="text-muted text-sm">Creators fund reward pools before launching surveys. No payment, no survey. Smart contracts ensure fair play.</p>
          </div>
          <div className="surface">
            <h3 className="text-lg font-semibold mb-2">Verified Rewards</h3>
            <p className="text-muted text-sm">On-chain proofs guarantee legitimate respondents get automatically rewarded directly to their wallets.</p>
          </div>
          <div className="surface">
            <h3 className="text-lg font-semibold mb-2">Quality Gates</h3>
            <p className="text-muted text-sm">Off-chain validation filters out bots and low-effort responses, ensuring premium insights for creators.</p>
          </div>
        </div>
      </div>
    </NetworkGuard>
  );
}
