import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import { ethers } from "ethers";
import Link from "next/link";

type SurveyCardProps = {
  survey: {
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
  };
  onAnswerClick?: (surveyId: number) => void;
};

export function SurveyCard({ survey, onAnswerClick }: SurveyCardProps) {
  const { account } = useWallet();
  const { isAdmin } = useWalletAuth();
  const contract = useSurveyContract(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [hasOnChainAdminRole, setHasOnChainAdminRole] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account || !contract.contractAddress) {
      setLoading(false);
      return;
    }

    async function checkStatus() {
      try {
        setLoading(true);
        const [submitted, verified, onChainAdmin] = await Promise.all([
          contract.hasSubmitted(survey.id, account as string).catch(() => false),
          contract.isVerified(account as string).catch(() => false),
          contract.hasAdminRole(account as string).catch(() => false),
        ]);
        setHasSubmitted(submitted);
        setIsVerified(verified);
        setHasOnChainAdminRole(onChainAdmin);
      } catch (err) {
        console.warn("Could not check survey status:", err);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, contract.contractAddress, survey.id]);

  const rewardPerResponseEth = ethers.formatEther(survey.rewardPerResponse);
  const escrowRemainingEth = ethers.formatEther(survey.escrowRemaining);
  const maxResponsesNum = parseInt(survey.maxResponses);
  const responseCountNum = parseInt(survey.responseCount);
  const remainingSlots = maxResponsesNum - responseCountNum;
  const progressPercent = maxResponsesNum > 0 ? (responseCountNum / maxResponsesNum) * 100 : 0;

  const isFull = responseCountNum >= maxResponsesNum;
  const isCreator = account?.toLowerCase() === survey.creator.toLowerCase();
  const canAnswerWithoutKyc = isAdmin || hasOnChainAdminRole;
  const isEligibleToAnswer = Boolean(isVerified) || canAnswerWithoutKyc;

  return (
    <div className="glass-card flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`badge ${survey.active ? "badge-success" : "badge-danger"}`}>
          {survey.active ? "Active" : "Closed"}
        </span>
        {isCreator && (
          <span className="badge badge-primary">
            Your Survey
          </span>
        )}
      </div>

      <h3 className="text-xl font-bold m-0">{survey.title}</h3>
      <p className="text-muted text-sm m-0">{survey.description}</p>

      <div className="mt-4 mb-4 p-4 rounded-xl border border-white/10 bg-white/5">
        <h4 className="text-sm font-semibold text-muted mb-2 uppercase tracking-wide">Question:</h4>
        <p className="text-lg font-medium">{survey.question}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Reward</p>
          <p className="text-lg font-bold text-success">{rewardPerResponseEth} ETH</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Responses</p>
          <p className="text-lg font-bold">{responseCountNum} / {maxResponsesNum}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Escrow</p>
          <p className="text-lg font-bold text-primary">{escrowRemainingEth} ETH</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-muted mb-2">
          <span>Progress</span>
          <span className="font-mono">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: progressPercent > 80 ? 'var(--danger)' : progressPercent > 50 ? 'var(--warning)' : 'var(--success)'
            }}
          />
        </div>
      </div>

      {!contract.contractAddress && (
        <div className="p-3 bg-warning/20 border border-warning/30 rounded-lg text-warning text-sm font-medium text-center">
          Contract not configured
        </div>
      )}

      {isFull && (
        <div className="p-3 bg-danger/20 border border-danger/30 rounded-lg text-danger text-sm font-medium text-center">
          This survey is full. No more responses are being accepted.
        </div>
      )}

      {loading && (
        <div className="p-3 text-center text-muted text-sm flex items-center justify-center gap-2">
           <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Checking your eligibility...
        </div>
      )}

       {!loading && account && !isCreator && !isFull && survey.active && (
        <div className="mt-2">
          {isVerified === false && !canAnswerWithoutKyc && (
            <div className="p-3 mb-3 bg-warning/20 border border-warning/30 rounded-lg text-warning text-sm font-medium">
              ⚠️ You need to complete KYC verification to participate in reward surveys.
            </div>
          )}
          {hasSubmitted && (
            <div className="p-3 mb-3 bg-success/20 border border-success/30 rounded-lg text-success text-sm font-medium">
              ✅ You have already submitted a response to this survey.
            </div>
          )}
          {!hasSubmitted && isEligibleToAnswer && onAnswerClick && (
            <button
              onClick={() => onAnswerClick(survey.id)}
              className="btn btn-primary w-full"
            >
              Answer Survey
            </button>
          )}
          {!hasSubmitted && !isEligibleToAnswer && onAnswerClick && (
            <button
              disabled
              className="btn btn-secondary w-full"
            >
              Complete KYC to Answer
            </button>
          )}
        </div>
      )}

      {!account && !isCreator && (
        <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-muted text-sm text-center">
          Connect your wallet to participate.
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-white/10 text-xs text-muted flex justify-between">
        <span className="font-mono">Creator: {survey.creator.slice(0, 6)}...{survey.creator.slice(-4)}</span>
        <span className="font-mono">ID: {survey.id}</span>
      </div>
    </div>
  );
}
