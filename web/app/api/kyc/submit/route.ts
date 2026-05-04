import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log";
import { requireSession } from "@/lib/auth/require-session";
import { createKycRequest } from "@/lib/kyc/data-store";
import { buildKycProofHash, sha256Hex } from "@/lib/kyc/hash";
import { extensionForMimeType, validateKycImageFile } from "@/lib/kyc/validation";
import {
  isSupabaseStorageConfigured,
  isSupabaseStorageTestMode,
  uploadPrivateObjectDetailed
} from "@/lib/storage/supabase-storage";

const KYC_BUCKET = "kyc-documents";

export async function POST(request: Request) {
  const session = await requireSession();
  if ("response" in session) {
    return session.response;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data." }, { status: 400 });
  }

  const documentFile = formData.get("document");
  const selfieFile = formData.get("selfie");

  if (!(documentFile instanceof File) || !(selfieFile instanceof File)) {
    return NextResponse.json(
      { error: "document and selfie files are required." },
      { status: 400 }
    );
  }

  const documentValidationError = validateKycImageFile(documentFile, "document");
  if (documentValidationError) {
    return NextResponse.json({ error: documentValidationError }, { status: 400 });
  }

  const selfieValidationError = validateKycImageFile(selfieFile, "selfie");
  if (selfieValidationError) {
    return NextResponse.json({ error: selfieValidationError }, { status: 400 });
  }

  const documentBytes = new Uint8Array(await documentFile.arrayBuffer());
  const selfieBytes = new Uint8Array(await selfieFile.arrayBuffer());
  const documentHash = sha256Hex(documentBytes);
  const selfieHash = sha256Hex(selfieBytes);

  const requestId = randomUUID();
  const documentExt = extensionForMimeType(documentFile.type);
  const selfieExt = extensionForMimeType(selfieFile.type);
  const documentPath = `${requestId}/document-${documentHash.slice(0, 12)}.${documentExt}`;
  const selfiePath = `${requestId}/selfie-${selfieHash.slice(0, 12)}.${selfieExt}`;

  if (!isSupabaseStorageConfigured() && !isSupabaseStorageTestMode()) {
    return NextResponse.json(
      {
        error:
          "KYC storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server."
      },
      { status: 503 }
    );
  }

  const documentUpload = await uploadPrivateObjectDetailed({
    bucket: KYC_BUCKET,
    objectPath: documentPath,
    contentType: documentFile.type,
    data: documentBytes
  });
  if (!documentUpload.ok) {
    return NextResponse.json(
      {
        error: "Failed to upload document image.",
        detail:
          documentUpload.error ??
          `Supabase storage request failed with status ${documentUpload.status}.`
      },
      { status: 500 }
    );
  }

  const selfieUpload = await uploadPrivateObjectDetailed({
    bucket: KYC_BUCKET,
    objectPath: selfiePath,
    contentType: selfieFile.type,
    data: selfieBytes
  });
  if (!selfieUpload.ok) {
    return NextResponse.json(
      {
        error: "Failed to upload selfie image.",
        detail:
          selfieUpload.error ??
          `Supabase storage request failed with status ${selfieUpload.status}.`
      },
      { status: 500 }
    );
  }

  const proofHash = buildKycProofHash({
    walletAddress: session.walletAddress,
    documentHash,
    selfieHash
  });

  let created;
  try {
    created = await createKycRequest({
      id: requestId,
      walletAddress: session.walletAddress,
      bucketId: KYC_BUCKET,
      documentPath,
      selfiePath,
      documentHash,
      selfieHash,
      proofHash
    });
  } catch (error) {
    const typedError = error as { code?: string; message?: string } | undefined;
    if (typedError?.code === "DUPLICATE_KYC_HASH") {
      return NextResponse.json(
        { error: "A matching document or selfie image already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        error: "Unable to create KYC request.",
        detail:
          typedError?.message ??
          typedError?.code ??
          "Unknown persistence error while creating KYC request."
      },
      { status: 500 }
    );
  }

  try {
    await logAuditEvent({
      actorWallet: session.walletAddress,
      action: "kyc_submit",
      entityType: "kyc_request",
      entityId: created.id,
      details: {
        status: created.status,
        proofHash: created.proofHash
      }
    });
  } catch {
    return NextResponse.json({ error: "Unable to record audit log." }, { status: 500 });
  }

  return NextResponse.json({
    requestId: created.id,
    walletAddress: created.walletAddress,
    status: created.status,
    proofHash: created.proofHash,
    submittedAt: created.submittedAt.toISOString(),
    message: "Demo KYC submitted. Use dummy classroom images only."
  });
}
