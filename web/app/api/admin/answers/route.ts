import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { hasRoleOnContract } from "@/lib/blockchain/roles";
import { getAllAnswers } from "@/lib/answers/data-store";

export async function GET(request: Request) {
  const session = await requireSession();
  if ("response" in session) {
    return session.response;
  }

  // Admin check
  const isAdmin = await hasRoleOnContract(session.walletAddress, "ADMIN_ROLE");
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin role required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const surveyId = searchParams.get("surveyId");
  const wallet = searchParams.get("wallet");
  const status = searchParams.get("status");

  const allAnswers = await getAllAnswers();

  const filtered = allAnswers.filter((a) => {
    if (surveyId && a.surveyId.toString() !== surveyId) return false;
    if (wallet && a.respondentWallet.toLowerCase() !== wallet.toLowerCase()) return false;
    if (status && a.status !== status) return false;
    return true;
  });

  return NextResponse.json({
    total: filtered.length,
    answers: filtered.map((a) => ({
      id: a.id,
      surveyId: a.surveyId.toString(),
      respondentWallet: a.respondentWallet,
      answerHash: a.answerHash,
      status: a.status,
      validationScore: a.validationScore,
      validationStatus: a.validationStatus,
      validationReason: a.validationReason,
      flagged: a.flagged,
      auditNotes: a.auditNotes,
      createdAt: a.createdAt.toISOString()
    }))
  });
}
