import { NextResponse } from "next/server";
import { getAddress } from "ethers";

import { getAnswerById, updateAnswerProof } from "@/lib/answers/data-store";
import { buildProofNonce, signCompletionProof } from "@/lib/answers/proof";
import { requireSession } from "@/lib/auth/require-session";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if ("response" in session) {
    return session.response;
  }

  const { id } = await context.params;
  const answer = await getAnswerById(id);
  if (!answer) {
    return NextResponse.json({ error: "Answer not found." }, { status: 404 });
  }
  if (answer.respondentWallet !== session.walletAddress) {
    return NextResponse.json(
      { error: "Answer does not belong to current session wallet." },
      { status: 403 }
    );
  }
  if (answer.validationStatus !== "passed") {
    return NextResponse.json(
      { error: "Cannot refresh proof for failed validation." },
      { status: 400 }
    );
  }

  const nonceString = buildProofNonce();
  const nonce = BigInt(nonceString.replace(/\D/g, "").slice(0, 18) || "1");
  const deadline = new Date(Date.now() + 10 * 60 * 1000);

  let signature: string;
  try {
    signature = await signCompletionProof({
      respondent: getAddress(session.walletAddress),
      surveyId: answer.surveyId,
      answerHash: answer.answerHash,
      rewardAmount: BigInt(answer.rewardAmountWei),
      nonce,
      deadline: BigInt(Math.floor(deadline.getTime() / 1000))
    });
  } catch {
    return NextResponse.json(
      { error: "Proof signing configuration is missing." },
      { status: 500 }
    );
  }

  const updated = await updateAnswerProof(id, nonce.toString(), deadline, signature);
  if (!updated) {
    return NextResponse.json(
      { error: "Failed to update answer proof." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    answerId: id,
    proof: {
      nonce: nonce.toString(),
      deadline: Math.floor(deadline.getTime() / 1000).toString(),
      signature
    }
  });
}
