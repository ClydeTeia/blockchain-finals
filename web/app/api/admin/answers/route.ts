import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAllAnswers } from "@/lib/answers/data-store";

export async function GET() {
  const session = await requireAdminSession();
  if ("response" in session) {
    return session.response;
  }

  try {
    const answers = await getAllAnswers();
    return NextResponse.json({
      answers: answers.map((answer) => ({
        id: answer.id,
        surveyId: answer.surveyId.toString(),
        respondentWallet: answer.respondentWallet,
        status: answer.status,
        validationScore: answer.validationScore,
        validationStatus: answer.validationStatus,
        validationReason: answer.validationReason,
        validationDetails: answer.validationDetails,
        answerHash: answer.answerHash,
        rewardAmountWei: answer.rewardAmountWei,
        completionNonce: answer.completionNonce,
        completionDeadline: answer.completionDeadline?.toISOString() ?? null,
        completionSignature: answer.completionSignature,
        onchainTxHash: answer.onchainTxHash,
        onchainConfirmedAt: answer.onchainConfirmedAt?.toISOString() ?? null,
        flagged: answer.flagged,
        auditNotes: answer.auditNotes,
        createdAt: answer.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error("Error fetching answers for admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
