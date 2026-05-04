'use client';

import { useEffect, useState } from 'react';
import { formatEther } from 'ethers';
import Link from 'next/link';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useWallet } from '@/hooks/useWallet';
import { useSurveyContract } from '@/hooks/useSurveyContract';
import Button from '@/components/Button';
import { AnswerIntegrityVerifier } from './AnswerIntegrityVerifier';

type AnswerData = {
  id: string;
  surveyId: string;
  status: string;
  validationScore?: number;
  validationReason?: string;
  completionSignature?: string | null;
  completionNonce?: string;
  completionDeadline?: string | null;
  answerHash?: string;
  onchainTxHash?: string | null;
};

function formatRewardDisplay(ethValue: string): string {
  const num = parseFloat(ethValue);
  if (num === 0) return '0';
  if (num < 0.000001) return `< 0.000001`;
  if (num < 0.01) return num.toFixed(6);
  if (num < 1) return num.toFixed(4);
  return num.toFixed(4);
}

function getStatusLabel(status: string): { label: string; color: string; description: string } {
  switch (status) {
    case 'pending_onchain':
      return {
        label: 'Pending On-Chain',
        color: 'text-amber-600',
        description: 'Your answer passed validation but the on-chain proof hasn\'t been submitted yet. Complete it to earn your reward.'
      };
    case 'completed_onchain':
      return {
        label: 'Confirmed On-Chain',
        color: 'text-emerald-600',
        description: 'Your reward has been credited and is claimable.'
      };
    case 'claimed':
      return {
        label: 'Claimed',
        color: 'text-blue-600',
        description: 'Reward has been claimed.'
      };
    case 'failed_validation':
      return {
        label: 'Failed Validation',
        color: 'text-red-500',
        description: 'Your response did not pass quality validation.'
      };
    default:
      return {
        label: status.replace(/_/g, ' '),
        color: 'text-muted',
        description: ''
      };
  }
}

export function RewardDashboard() {
  const { isAuthenticated, walletAddress, isLoading: authLoading } = useWalletAuth();
  const { provider } = useWallet();
  const { isReady, claimableRewards, totalEarned, claimRewards } = useSurveyContract(provider);
  const [claimableWei, setClaimableWei] = useState<bigint>(0n);
  const [claimable, setClaimable] = useState<string>('0');
  const [total, setTotal] = useState<string>('0');
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch claimable rewards and total earned
  useEffect(() => {
    if (!isAuthenticated || !walletAddress || !isReady) return;

    (async () => {
      try {
        const cWei = await claimableRewards(walletAddress);
        const totalWei = await totalEarned(walletAddress);
        setClaimableWei(cWei);
        setClaimable(formatEther(cWei));
        setTotal(formatEther(totalWei));
      } catch (err) {
        console.error('Failed to fetch rewards:', err);
        setError('Failed to load reward data');
      }
    })();
  }, [isAuthenticated, walletAddress, isReady, claimableRewards, totalEarned]);

  // Fetch user's answers
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const response = await fetch('/api/answers/my');
        if (!response.ok) throw new Error('Failed to fetch answers');
        const data = await response.json();
        setAnswers(data.answers);
      } catch (err) {
        console.error('Failed to fetch answers:', err);
        setError('Failed to load answers');
      }
    })();
  }, [isAuthenticated]);

  const handleClaim = async () => {
    if (!isAuthenticated || !isReady) return;
    setIsClaiming(true);
    setError(null);
    try {
      const tx = await claimRewards();
      await tx.wait();
      // Refetch claimable rewards after successful claim
      if (!walletAddress) {
        return;
      }
      const cWei = await claimableRewards(walletAddress);
      setClaimableWei(cWei);
      setClaimable(formatEther(cWei));
    } catch (err) {
      console.error('Failed to claim rewards:', err);
      setError('Failed to claim rewards. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  if (authLoading) return <p>Loading...</p>;
  if (!isAuthenticated) return <p>Please connect and sign in to view your rewards.</p>;

  const pendingAnswers = answers.filter((a) => a.status === 'pending_onchain');
  const confirmedAnswers = answers.filter((a) => a.status === 'completed_onchain' || a.status === 'claimed');
  const failedAnswers = answers.filter((a) => a.status === 'failed_validation');
  const hasClaimable = claimableWei > 0n;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-semibold mb-1">Rewards Dashboard</h1>
      <p className="text-muted text-base mb-8">
        Track your survey rewards, pending proofs, and claim your earned ETH.
      </p>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 border border-red-200 text-sm font-medium rounded">
          {error}
        </div>
      )}

      {/* Rewards Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-muted font-medium mb-2 uppercase tracking-wide">Claimable</p>
          <p className="text-2xl font-bold">{formatRewardDisplay(claimable)} <span className="text-base font-normal text-muted">ETH</span></p>
          {hasClaimable && (
            <div className="mt-4">
              <Button onClick={handleClaim} disabled={isClaiming} loading={isClaiming}>
                {isClaiming ? 'Claiming...' : 'Claim Rewards'}
              </Button>
            </div>
          )}
          {!hasClaimable && pendingAnswers.length > 0 && (
            <p className="text-xs text-amber-600 mt-3">
              You have {pendingAnswers.length} response{pendingAnswers.length !== 1 ? 's' : ''} pending on-chain submission below
            </p>
          )}
        </div>
        <div className="card">
          <p className="text-xs text-muted font-medium mb-2 uppercase tracking-wide">Total Earned</p>
          <p className="text-2xl font-bold">{formatRewardDisplay(total)} <span className="text-base font-normal text-muted">ETH</span></p>
          <p className="text-xs text-muted mt-3">
            {confirmedAnswers.length} confirmed response{confirmedAnswers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Pending On-Chain Submissions Alert */}
      {pendingAnswers.length > 0 && (
        <div className="p-4 mb-6 bg-amber-50 border border-amber-200 rounded">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">
            ⚠️ {pendingAnswers.length} Response{pendingAnswers.length !== 1 ? 's' : ''} Need On-Chain Submission
          </h3>
          <p className="text-xs text-amber-700 mb-3">
            Your answers passed validation but the on-chain proof wasn&apos;t submitted yet.
            Go to each survey to complete the on-chain submission and earn your rewards.
          </p>
          <div className="flex flex-col gap-2">
            {pendingAnswers.map((answer) => (
              <Link
                key={answer.id}
                href={`/surveys/${answer.surveyId}`}
                className="flex items-center justify-between p-3 bg-white rounded border border-amber-200 hover:border-amber-400 transition-colors"
              >
                <span className="text-sm font-medium">Survey #{answer.surveyId}</span>
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  Submit Proof →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Your Responses */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Your Responses</h2>
        {answers.length === 0 ? (
          <div className="surface text-center py-8">
            <p className="text-muted">You haven&apos;t submitted any responses yet.</p>
            <Link href="/surveys" className="text-sm text-primary font-medium mt-2 inline-block hover:underline">
              Browse surveys →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {answers.map((answer) => {
              const statusInfo = getStatusLabel(answer.status);
              return (
                <div key={answer.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold">Survey #{answer.surveyId}</h3>
                    <span className={`text-xs font-semibold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {statusInfo.description && (
                    <p className="text-xs text-muted mb-3">{statusInfo.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    {answer.validationScore !== undefined && (
                      <div>
                        <span className="text-xs text-muted font-medium">Score: </span>
                        <span className="font-semibold">{answer.validationScore}/100</span>
                      </div>
                    )}
                    {answer.validationReason && (
                      <div>
                        <span className="text-xs text-muted font-medium">Reason: </span>
                        <span className="text-sm">{answer.validationReason}</span>
                      </div>
                    )}
                  </div>

                  {answer.status === 'pending_onchain' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Link
                        href={`/surveys/${answer.surveyId}`}
                        className="btn btn-primary text-sm inline-block"
                      >
                        Complete On-Chain Submission →
                      </Link>
                    </div>
                  )}

                  {(answer.status === 'completed_onchain' || answer.status === 'claimed') && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <AnswerIntegrityVerifier answerId={answer.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
