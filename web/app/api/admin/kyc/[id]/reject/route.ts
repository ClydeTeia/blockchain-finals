import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log";
import { requireAdminSession } from "@/lib/auth/admin";
import { decideKycRequest, getKycRequestById } from "@/lib/kyc/data-store";

type DecisionBody = {
  reason?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if ("response" in session) {
    return session.response;
  }

  const { id } = await params;
  const existing = await getKycRequestById(id);
  if (!existing) {
    return NextResponse.json({ error: "KYC request not found." }, { status: 404 });
  }

  if (existing.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending KYC requests can be rejected." },
      { status: 400 }
    );
  }

  let body: DecisionBody = {};
  try {
    body = (await request.json()) as DecisionBody;
  } catch {
    body = {};
  }

  const updated = await decideKycRequest({
    id,
    status: "rejected",
    reviewerWallet: session.walletAddress,
    decisionReason: body.reason ?? null
  });

  if (!updated) {
    return NextResponse.json({ error: "Failed to update KYC request." }, { status: 500 });
  }

  await logAuditEvent({
    actorWallet: session.walletAddress,
    action: "kyc_reject",
    entityType: "kyc_request",
    entityId: id,
    details: {
      walletAddress: updated.walletAddress,
      decisionReason: updated.decisionReason
    }
  });

  return NextResponse.json({
    requestId: updated.id,
    walletAddress: updated.walletAddress,
    status: updated.status,
    reviewedAt: updated.reviewedAt?.toISOString() ?? null,
    reviewerWallet: updated.reviewerWallet,
    decisionReason: updated.decisionReason
  });
}
