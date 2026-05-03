import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { hasRoleOnContract } from "@/lib/blockchain/roles";
import { getAnswerById } from "@/lib/answers/data-store";
import { hashAnswer } from "@/lib/answers/proof";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if ("response" in session) {
    return session.response;
  }

  const isAdmin = await hasRoleOnContract(session.walletAddress, "ADMIN_ROLE");
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin role required." }, { status: 403 });
  }

  const { id } = await context.params;

  const answer = await getAnswerById(id);
  if (!answer) {
    return NextResponse.json({ error: "Answer not found." }, { status: 404 });
  }

  // Recompute hash from normalized answer and salt
  const normalized = typeof answer.normalizedAnswerJson === "string"
    ? answer.normalizedAnswerJson
    : JSON.stringify(answer.normalizedAnswerJson);
  const computedHash = hashAnswer(normalized, answer.salt);
  const matches = computedHash === answer.answerHash;

  return NextResponse.json({
    ok: true,
    matches,
    storedHash: answer.answerHash,
    computedHash,
    normalizedAnswer: answer.normalizedAnswerJson
  });
}
