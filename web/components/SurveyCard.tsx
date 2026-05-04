import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import { ethers } from "ethers";

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
  const progressPercent = maxResponsesNum > 0 ? (responseCountNum / maxResponsesNum) * 100 : 0;

  const isFull = responseCountNum >= maxResponsesNum;
  const isCreator = account?.toLowerCase() === survey.creator.toLowerCase();
  const canAnswerWithoutKyc = isAdmin || hasOnChainAdminRole;
  const isEligibleToAnswer = Boolean(isVerified) || canAnswerWithoutKyc;

  return (
    <div className="card flex flex-col gap-5">
      <div className="flex items-center gap-2 mb-1">
        <span className={`badge ${survey.active ? "badge-success" : "badge-danger"}`}>
          {survey.active ? "Active" : "Closed"}
        </span>
        {isCreator && (
          <span className="badge badge-primary">
            Your Survey
          </span>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-1">{survey.title}</h3>
        <p className="text-muted text-sm">{survey.description}</p>
      </div>

      <div className="surface">
        <h4 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wide">Question</h4>
        <p className="text-base font-medium">{survey.question}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted font-medium mb-1">Reward</p>
          <p className="text-sm font-semibold">{rewardPerResponseEth} ETH</p>
        </div>
        <div>
          <p className="text-xs text-muted font-medium mb-1">Responses</p>
          <p className="text-sm font-semibold">{responseCountNum} / {maxResponsesNum}</p>
        </div>
        <div>
          <p className="text-xs text-muted font-medium mb-1">Escrow</p>
          <p className="text-sm font-semibold">{escrowRemainingEth} ETH</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: progressPercent > 80 ? 'var(--danger)' : progressPercent > 50 ? 'var(--warning)' : 'var(--primary)'
            }}
          />
        </div>
        <span className="text-xs text-muted font-medium">{Math.round(progressPercent)}%</span>
      </div>

      {!contract.contractAddress && (
        <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded">
          Contract not configured
        </div>
      )}

      {isFull && (
        <div className="p-3 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded text-center">
          This survey is full. No more responses are being accepted.
        </div>
      )}

      {loading && (
        <div className="p-3 text-center text-muted text-sm flex items-center justify-center gap-2">
           <div className="animate-spin inline-block w-4 h-4 border-[2px] border-current border-t-transparent text-muted rounded-full" role="status" aria-label="loading"></div>
          Checking your eligibility...
        </div>
      )}

       {!loading && account && !isCreator && !isFull && survey.active && (
        <div className="mt-2">
          {isVerified === false && !canAnswerWithoutKyc && (
            <div className="p-3 mb-3 bg-amber-50 text-amber-800 border border-amber-200 text-sm font-medium rounded">
              You need to complete KYC verification to participate in reward surveys.
            </div>
          )}
          {hasSubmitted && (
            <div className="p-3 mb-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-medium rounded">
              You have already submitted a response to this survey.
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
        <div className="p-3 surface text-muted text-sm text-center">
          Connect your wallet to participate.
        </div>
      )}

      <div className="mt-2 pt-4 border-t border-gray-100 text-xs text-muted flex justify-between font-mono">
        <span>Creator: {survey.creator.slice(0, 6)}...{survey.creator.slice(-4)}</span>
        <span>ID: {survey.id}</span>
      </div>
    </div>
  );
}
