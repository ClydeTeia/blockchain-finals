'use client';

import { useEffect, useState } from 'react';
import { formatEther } from 'ethers';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useWallet } from '@/hooks/useWallet';
import { useSurveyContract } from '@/hooks/useSurveyContract';
import Button from '@/components/Button';
import { AnswerIntegrityVerifier } from './AnswerIntegrityVerifier';

export function RewardDashboard() {
  const { isAuthenticated, walletAddress, isLoading: authLoading } = useWalletAuth();
  const { provider } = useWallet();
  const { isReady, claimableRewards, totalEarned, claimRewards } = useSurveyContract(provider);
  const [claimable, setClaimable] = useState<string>('0');
  const [total, setTotal] = useState<string>('0');
  const [answers, setAnswers] = useState<Array<any>>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch claimable rewards and total earned
  useEffect(() => {
    if (!isAuthenticated || !walletAddress || !isReady) return;

    (async () => {
      try {
        const claimableWei = await claimableRewards(walletAddress);
        const totalWei = await totalEarned(walletAddress);
        setClaimable(formatEther(claimableWei));
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
      const claimableWei = await claimableRewards(walletAddress);
      setClaimable(formatEther(claimableWei));
    } catch (err) {
      console.error('Failed to claim rewards:', err);
      setError('Failed to claim rewards. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  if (authLoading) return <p>Loading...</p>;
  if (!isAuthenticated) return <p>Please connect and sign in to view your rewards.</p>;

  return (
    <div>
      <h1>Rewards Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <section>
        <h2>Your Rewards</h2>
        <p>
          <strong>Claimable:</strong> {claimable} ETH
        </p>
        <p>
          <strong>Total Earned:</strong> {total} ETH
        </p>
        {parseFloat(claimable) > 0 && (
          <Button onClick={handleClaim} disabled={isClaiming} loading={isClaiming}>
            {isClaiming ? 'Claiming...' : 'Claim Rewards'}
          </Button>
        )}
      </section>

      <section>
        <h2>Your Responses</h2>
        {answers.length === 0 ? (
          <p>You haven&apos;t submitted any responses yet.</p>
        ) : (
          <div>
            {answers.map((answer) => (
              <div key={answer.id} style={{ border: '1px solid #ccc', marginBottom: '1rem', padding: '1rem' }}>
                <h3>Survey {answer.surveyId}</h3>
                <p>
                  <strong>Status:</strong> {answer.status}
                </p>
                {answer.validationScore !== undefined && (
                  <p>
                    <strong>Validation Score:</strong> {answer.validationScore}/100
                  </p>
                )}
                {answer.validationReason && (
                  <p>
                    <strong>Reason:</strong> {answer.validationReason}
                  </p>
                )}
                {answer.status === 'completed_onchain' || answer.status === 'claimed' ? (
                  <AnswerIntegrityVerifier answerId={answer.id} />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
