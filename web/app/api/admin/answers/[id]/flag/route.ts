import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { updateAnswerFlag } from "@/lib/answers/data-store";
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
    const updated = await updateAnswerFlag(answerId, true);
    
    if (!updated) {
      return NextResponse.json(
        { error: "Answer not found" },
        { status: 404 }
      );
    }

    await auditLog({
      actorWallet: session.walletAddress,
      action: "flag_response",
      entityType: "answer",
      entityId: answerId,
      metadata: { flagged: true }
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