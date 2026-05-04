import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { updateAnswerFlag } from "@/lib/answers/data-store";
import { logAuditEvent } from "@/lib/audit/log";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if ("response" in session) {
    return session.response;
  }

  try {
    const { id: answerId } = await params;
    const updated = await updateAnswerFlag(answerId, true);
    
    if (!updated) {
      return NextResponse.json(
        { error: "Answer not found" },
        { status: 404 }
      );
    }

    await logAuditEvent({
      actorWallet: session.walletAddress,
      action: "flag_response",
      entityType: "answer",
      entityId: answerId,
      details: { flagged: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error flagging answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
