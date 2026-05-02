import { NextResponse } from "next/server";

import { getMyAnswers } from "@/lib/answers/data-store";
import { requireSession } from "@/lib/auth/require-session";

export async function GET() {
  const session = await requireSession();
  if ("response" in session) {
    return session.response;
  }

  const answers = await getMyAnswers(session.walletAddress);
  return NextResponse.json({
    walletAddress: session.walletAddress,
    answers: answers.map((answer) => ({
      id: answer.id,
      surveyId: answer.surveyId.toString(),
      status: answer.status,
      validationScore: answer.validationScore,
      validationStatus: answer.validationStatus,
      validationReason: answer.validationReason,
      answerHash: answer.answerHash,
      completionNonce: answer.completionNonce,
      completionDeadline: answer.completionDeadline?.toISOString() ?? null,
      completionSignature: answer.completionSignature,
      onchainTxHash: answer.onchainTxHash,
      onchainConfirmedAt: answer.onchainConfirmedAt?.toISOString() ?? null,
      createdAt: answer.createdAt.toISOString()
    }))
  });
}

