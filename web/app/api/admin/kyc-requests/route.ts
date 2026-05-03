import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth/admin";
import { listKycRequests, type KycStatus } from "@/lib/kyc/data-store";

const VALID_STATUS: KycStatus[] = ["pending", "approved", "rejected", "revoked"];

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if ("response" in session) {
    return session.response;
  }

  const url = new URL(request.url);
  const statusRaw = url.searchParams.get("status");
  const status = statusRaw ? (statusRaw as KycStatus) : undefined;

  if (status && !VALID_STATUS.includes(status)) {
    return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
  }

  const rows = await listKycRequests(status);
  return NextResponse.json({
    count: rows.length,
    requests: rows.map((row) => ({
      id: row.id,
      walletAddress: row.walletAddress,
      status: row.status,
      proofHash: row.proofHash,
      submittedAt: row.submittedAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      reviewerWallet: row.reviewerWallet,
      decisionReason: row.decisionReason
    }))
  });
}
