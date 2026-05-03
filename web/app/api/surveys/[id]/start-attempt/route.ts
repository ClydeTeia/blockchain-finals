import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { createAttempt } from "@/lib/answers/data-store";
import { requireSession } from "@/lib/auth/require-session";

function hashIp(ip: string | null): string | null {
  if (!ip) {
    return null;
  }
  return createHash("sha256").update(ip).digest("hex");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if ("response" in session) {
    return session.response;
  }

  const { id } = await context.params;
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid survey ID." }, { status: 400 });
  }

  const attempt = await createAttempt({
    surveyId: BigInt(id),
    respondentWallet: session.walletAddress,
    userAgent: request.headers.get("user-agent"),
    ipHash: hashIp(request.headers.get("x-forwarded-for"))
  });

  return NextResponse.json({
    attemptId: attempt.id,
    surveyId: attempt.surveyId.toString(),
    walletAddress: attempt.respondentWallet,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString()
  });
}
