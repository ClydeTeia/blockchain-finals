import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log";
import { requireSession } from "@/lib/auth/require-session";
import { createKycRequest } from "@/lib/kyc/data-store";
import { buildKycProofHash, sha256Hex } from "@/lib/kyc/hash";
import { extensionForMimeType, validateKycImageFile } from "@/lib/kyc/validation";
import { uploadPrivateObject } from "@/lib/storage/supabase-storage";

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

  const documentUploaded = await uploadPrivateObject({
    bucket: KYC_BUCKET,
    objectPath: documentPath,
    contentType: documentFile.type,
    data: documentBytes
  });
  if (!documentUploaded) {
    return NextResponse.json({ error: "Failed to upload document image." }, { status: 500 });
  }

  const selfieUploaded = await uploadPrivateObject({
    bucket: KYC_BUCKET,
    objectPath: selfiePath,
    contentType: selfieFile.type,
    data: selfieBytes
  });
  if (!selfieUploaded) {
    return NextResponse.json({ error: "Failed to upload selfie image." }, { status: 500 });
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
  } catch {
    return NextResponse.json({ error: "Unable to create KYC request." }, { status: 500 });
  }

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

  return NextResponse.json({
    requestId: created.id,
    walletAddress: created.walletAddress,
    status: created.status,
    proofHash: created.proofHash,
    submittedAt: created.submittedAt.toISOString(),
    message: "Demo KYC submitted. Use dummy classroom images only."
  });
}
