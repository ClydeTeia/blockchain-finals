import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { getClaimableRewards, getTotalEarned } from "@/lib/blockchain/rewards";
import { getMyAnswers } from "@/lib/answers/data-store";

export async function GET() {
  try {
    const session = await requireSession();
    if ("response" in session) {
      return session.response;
    }

    const walletAddress = session.walletAddress;

    // Fetch on-chain reward balances
    const [claimableWei, totalEarnedWei] = await Promise.all([
      getClaimableRewards(walletAddress),
      getTotalEarned(walletAddress)
    ]);

    // Fetch off-chain answer history
    const answers = await getMyAnswers(walletAddress);

    // Compute summary stats
    const completedCount = answers.filter(
      (a) => a.status === "completed_onchain" || a.status === "claimed"
    ).length;
    const pendingCount = answers.filter((a) => a.status === "pending_onchain").length;
    const failedCount = answers.filter((a) => a.status === "failed_validation").length;

    return NextResponse.json({
      walletAddress,
      claimableRewardsWei: claimableWei.toString(),
      totalEarnedWei: totalEarnedWei.toString(),
      claimableRewardsEth: Number(claimableWei) / 1e18,
      totalEarnedEth: Number(totalEarnedWei) / 1e18,
      stats: {
        completed: completedCount,
        pending: pendingCount,
        failed: failedCount,
        total: answers.length
      },
      answers: answers.map((a) => ({
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
      }))
    });
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return NextResponse.json(
      { error: "Failed to fetch rewards." },
      { status: 500 }
    );
  }
}
