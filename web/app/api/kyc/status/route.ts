import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { getLatestKycRequestByWallet } from "@/lib/kyc/data-store";

export async function GET() {
  const session = await requireSession();
  if ("response" in session) {
    return session.response;
  }

  const kycRequest = await getLatestKycRequestByWallet(session.walletAddress);
  if (!kycRequest) {
    return NextResponse.json({
      walletAddress: session.walletAddress,
      status: "not_submitted"
    });
  }

  return NextResponse.json({
    requestId: kycRequest.id,
    walletAddress: kycRequest.walletAddress,
    status: kycRequest.status,
    proofHash: kycRequest.proofHash,
    submittedAt: kycRequest.submittedAt.toISOString(),
    reviewedAt: kycRequest.reviewedAt?.toISOString() ?? null,
    decisionReason: kycRequest.decisionReason
  });
}
