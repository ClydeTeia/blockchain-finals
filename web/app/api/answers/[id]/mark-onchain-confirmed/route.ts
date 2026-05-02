import { NextResponse } from "next/server";

import { getAnswerById, markAnswerOnchainConfirmed } from "@/lib/answers/data-store";
import { requireSession } from "@/lib/auth/require-session";

type MarkConfirmedRequest = {
  txHash?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if ("response" in session) {
    return session.response;
  }

  const { id } = await context.params;
  let body: MarkConfirmedRequest;
  try {
    body = (await request.json()) as MarkConfirmedRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.txHash || !/^0x[a-fA-F0-9]{64}$/.test(body.txHash)) {
    return NextResponse.json({ error: "Valid txHash is required." }, { status: 400 });
  }

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

  const updated = await markAnswerOnchainConfirmed(id, body.txHash);
  if (!updated) {
    return NextResponse.json(
      { error: "Failed to update answer on-chain status." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    answerId: id,
    status: "completed_onchain",
    txHash: body.txHash
  });
}

