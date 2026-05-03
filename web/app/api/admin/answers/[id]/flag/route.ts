import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { hasRoleOnContract } from "@/lib/blockchain/roles";
import { updateAnswerFlag, getAnswerById } from "@/lib/answers/data-store";

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

  const body = await request.json();
  const { flagged } = body;
  if (typeof flagged !== "boolean") {
    return NextResponse.json({ error: "flagged boolean required." }, { status: 400 });
  }

  const success = await updateAnswerFlag(id, flagged);
  if (!success) {
    return NextResponse.json({ error: "Answer not found." }, { status: 404 });
  }

  // Optionally log audit action (could insert into audit_logs table)
  // For now just return success

  return NextResponse.json({ ok: true, flagged });
}
