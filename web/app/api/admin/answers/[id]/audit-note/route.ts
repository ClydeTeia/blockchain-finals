import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { hasRoleOnContract } from "@/lib/blockchain/roles";
import { updateAnswerAuditNote } from "@/lib/answers/data-store";

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
  const { note } = body;
  if (typeof note !== "string" && note !== null) {
    return NextResponse.json({ error: "note string or null required." }, { status: 400 });
  }

  const success = await updateAnswerAuditNote(id, note);
  if (!success) {
    return NextResponse.json({ error: "Answer not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, note });
}
