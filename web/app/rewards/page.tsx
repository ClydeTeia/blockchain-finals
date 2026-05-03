import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/require-session";
import { getClaimableRewards, getTotalEarned } from "@/lib/blockchain/rewards";
import { getMyAnswers } from "@/lib/answers/data-store";
import RewardsDashboard from "@/components/RewardsDashboard";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const session = await requireSession();
  if ("response" in session) {
    redirect("/?error=login_required");
  }

  const [claimableWei, totalEarnedWei, answers] = await Promise.all([
    getClaimableRewards(session.walletAddress),
    getTotalEarned(session.walletAddress),
    getMyAnswers(session.walletAddress)
  ]);

  const claimableEth = Number(claimableWei) / 1e18;
  const totalEarnedEth = Number(totalEarnedWei) / 1e18;

  const completedCount = answers.filter(
    (a) => a.status === "completed_onchain" || a.status === "claimed"
  ).length;
  const pendingCount = answers.filter((a) => a.status === "pending_onchain").length;
  const failedCount = answers.filter((a) => a.status === "failed_validation").length;

  return (
    <RewardsDashboard
      walletAddress={session.walletAddress}
      claimableEth={claimableEth}
      totalEarnedEth={totalEarnedEth}
      stats={{ completed: completedCount, pending: pendingCount, failed: failedCount, total: answers.length }}
      initialAnswers={answers.map((a) => ({
        id: a.id,
        surveyId: a.surveyId.toString(),
        status: a.status,
        validationScore: a.validationScore,
        validationStatus: a.validationStatus,
        validationReason: a.validationReason,
        rewardAmountWei: a.rewardAmountWei,
        onchainTxHash: a.onchainTxHash,
        onchainConfirmedAt: a.onchainConfirmedAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString()
      }))}
    />
  );
}
