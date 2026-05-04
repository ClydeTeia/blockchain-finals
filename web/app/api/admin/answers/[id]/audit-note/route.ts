import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { updateAnswerAuditNote } from "@/lib/answers/data-store";
import { auditLog } from "@/lib/audit/log";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  if ("response" in session) {
    return session.response;
  }

  try {
    const answerId = params.id;
    const { auditNote } = await request.json();
    
    if (auditNote === undefined) {
      return NextResponse.json(
        { error: "auditNote is required" },
        { status: 400 }
      );
    }

    const updated = await updateAnswerAuditNote(answerId, auditNote);
    
    if (!updated) {
      return NextResponse.json(
        { error: "Answer not found" },
        { status: 404 }
      );
    }

    await auditLog({
      actorWallet: session.walletAddress,
      action: "add_audit_note",
      entityType: "answer",
      entityId: answerId,
      metadata: { auditNote }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding audit note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}