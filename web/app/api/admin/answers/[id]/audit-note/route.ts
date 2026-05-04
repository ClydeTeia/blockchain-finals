import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { updateAnswerAuditNote } from "@/lib/answers/data-store";
import { logAuditEvent } from "@/lib/audit/log";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if ("response" in session) {
    return session.response;
  }

  try {
    const { id: answerId } = await params;
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

    await logAuditEvent({
      actorWallet: session.walletAddress,
      action: "add_audit_note",
      entityType: "answer",
      entityId: answerId,
      details: { auditNote }
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
