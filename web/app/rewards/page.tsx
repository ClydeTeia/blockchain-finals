'use client';

import { RewardDashboard } from '@/components/RewardDashboard';
import { NetworkGuard } from '@/components/NetworkGuard';
import { useWallet } from '@/hooks/useWallet';
import { useWalletAuth } from '@/hooks/useWalletAuth';

export default function RewardsPage() {
  const { account } = useWallet();
  const { isAuthenticated, isLoading: authLoading } = useWalletAuth();

  if (authLoading) return <p>Loading...</p>;

  if (!account || !isAuthenticated) {
    return (
      <NetworkGuard>
        <p>Connect and sign in with your wallet to access the rewards dashboard.</p>
      </NetworkGuard>
    );
  }

  return (
    <NetworkGuard>
      <RewardDashboard />
    </NetworkGuard>
  );
}