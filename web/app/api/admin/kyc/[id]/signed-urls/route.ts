import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log";
import { requireAdminSession } from "@/lib/auth/admin";
import { getKycRequestById } from "@/lib/kyc/data-store";
import { createSignedObjectUrl } from "@/lib/storage/supabase-storage";

type SignedUrlBody = {
  expiresInSeconds?: number;
};

function clampExpiry(seconds: number): number {
  if (!Number.isFinite(seconds)) {
    return 120;
  }
  if (seconds < 30) {
    return 30;
  }
  if (seconds > 600) {
    return 600;
  }
  return Math.floor(seconds);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if ("response" in session) {
    return session.response;
  }

  const { id } = await params;
  const kycRequest = await getKycRequestById(id);
  if (!kycRequest) {
    return NextResponse.json({ error: "KYC request not found." }, { status: 404 });
  }

  let body: SignedUrlBody = {};
  try {
    body = (await request.json()) as SignedUrlBody;
  } catch {
    body = {};
  }

  const expiresInSeconds = clampExpiry(Number(body.expiresInSeconds ?? 120));

  const [documentSignedUrl, selfieSignedUrl] = await Promise.all([
    createSignedObjectUrl({
      bucket: kycRequest.bucketId,
      objectPath: kycRequest.documentPath,
      expiresInSeconds
    }),
    createSignedObjectUrl({
      bucket: kycRequest.bucketId,
      objectPath: kycRequest.selfiePath,
      expiresInSeconds
    })
  ]);

  if (!documentSignedUrl || !selfieSignedUrl) {
    return NextResponse.json({ error: "Unable to create signed URLs." }, { status: 500 });
  }

  await logAuditEvent({
    actorWallet: session.walletAddress,
    action: "kyc_signed_urls",
    entityType: "kyc_request",
    entityId: kycRequest.id,
    details: { expiresInSeconds }
  });

  return NextResponse.json({
    requestId: kycRequest.id,
    expiresInSeconds,
    documentSignedUrl,
    selfieSignedUrl
  });
}
