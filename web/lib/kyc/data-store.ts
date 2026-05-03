import { randomUUID } from "node:crypto";

import {
  hasSupabaseRestConfig,
  supabaseInsert,
  supabasePatch,
  supabaseSelect
} from "@/lib/storage/supabase-rest";

export type KycStatus = "pending" | "approved" | "rejected" | "revoked";

export type KycRequestRecord = {
  id: string;
  walletAddress: string;
  status: KycStatus;
  bucketId: string;
  documentPath: string;
  selfiePath: string;
  documentHash: string;
  selfieHash: string;
  proofHash: string;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewerWallet: string | null;
  decisionReason: string | null;
  createdAt: Date;
};

const kycRequests = new Map<string, KycRequestRecord>();

function normalizeRow(row: {
  id: string;
  wallet_address: string;
  status: KycStatus;
  bucket_id: string;
  document_path: string;
  selfie_path: string;
  document_hash: string;
  selfie_hash: string;
  proof_hash: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_wallet: string | null;
  decision_reason: string | null;
  created_at: string;
}): KycRequestRecord {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    status: row.status,
    bucketId: row.bucket_id,
    documentPath: row.document_path,
    selfiePath: row.selfie_path,
    documentHash: row.document_hash,
    selfieHash: row.selfie_hash,
    proofHash: row.proof_hash,
    submittedAt: new Date(row.submitted_at),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
    reviewerWallet: row.reviewer_wallet,
    decisionReason: row.decision_reason,
    createdAt: new Date(row.created_at)
  };
}

export async function createKycRequest(input: {
  id?: string;
  walletAddress: string;
  bucketId: string;
  documentPath: string;
  selfiePath: string;
  documentHash: string;
  selfieHash: string;
  proofHash: string;
}): Promise<KycRequestRecord> {
  const now = new Date();
  const record: KycRequestRecord = {
    id: input.id ?? randomUUID(),
    walletAddress: input.walletAddress,
    status: "pending",
    bucketId: input.bucketId,
    documentPath: input.documentPath,
    selfiePath: input.selfiePath,
    documentHash: input.documentHash,
    selfieHash: input.selfieHash,
    proofHash: input.proofHash,
    submittedAt: now,
    reviewedAt: null,
    reviewerWallet: null,
    decisionReason: null,
    createdAt: now
  };

  if (hasSupabaseRestConfig()) {
    const inserted = await supabaseInsert("kyc_requests", {
      id: record.id,
      wallet_address: record.walletAddress,
      status: record.status,
      bucket_id: record.bucketId,
      document_path: record.documentPath,
      selfie_path: record.selfiePath,
      document_hash: record.documentHash,
      selfie_hash: record.selfieHash,
      proof_hash: record.proofHash,
      submitted_at: record.submittedAt.toISOString()
    });

    if (!inserted) {
      kycRequests.set(record.id, record);
    }
  } else {
    kycRequests.set(record.id, record);
  }

  return record;
}

export async function getLatestKycRequestByWallet(
  walletAddress: string
): Promise<KycRequestRecord | null> {
  if (hasSupabaseRestConfig()) {
    const rows = await supabaseSelect<{
      id: string;
      wallet_address: string;
      status: KycStatus;
      bucket_id: string;
      document_path: string;
      selfie_path: string;
      document_hash: string;
      selfie_hash: string;
      proof_hash: string;
      submitted_at: string;
      reviewed_at: string | null;
      reviewer_wallet: string | null;
      decision_reason: string | null;
      created_at: string;
    }>(
      `kyc_requests?select=*&wallet_address=ilike.${encodeURIComponent(
        walletAddress
      )}&order=created_at.desc&limit=1`
    );

    const row = rows?.[0];
    return row ? normalizeRow(row) : null;
  }

  const records = [...kycRequests.values()]
    .filter(
      (item) => item.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return records[0] ?? null;
}

export async function getKycRequestById(id: string): Promise<KycRequestRecord | null> {
  if (hasSupabaseRestConfig()) {
    const rows = await supabaseSelect<{
      id: string;
      wallet_address: string;
      status: KycStatus;
      bucket_id: string;
      document_path: string;
      selfie_path: string;
      document_hash: string;
      selfie_hash: string;
      proof_hash: string;
      submitted_at: string;
      reviewed_at: string | null;
      reviewer_wallet: string | null;
      decision_reason: string | null;
      created_at: string;
    }>(`kyc_requests?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);

    const row = rows?.[0];
    return row ? normalizeRow(row) : null;
  }

  return kycRequests.get(id) ?? null;
}

export async function listKycRequests(status?: KycStatus): Promise<KycRequestRecord[]> {
  if (hasSupabaseRestConfig()) {
    const statusFilter = status ? `&status=eq.${encodeURIComponent(status)}` : "";
    const rows = await supabaseSelect<{
      id: string;
      wallet_address: string;
      status: KycStatus;
      bucket_id: string;
      document_path: string;
      selfie_path: string;
      document_hash: string;
      selfie_hash: string;
      proof_hash: string;
      submitted_at: string;
      reviewed_at: string | null;
      reviewer_wallet: string | null;
      decision_reason: string | null;
      created_at: string;
    }>(`kyc_requests?select=*&order=created_at.desc${statusFilter}`);

    return (rows ?? []).map(normalizeRow);
  }

  return [...kycRequests.values()]
    .filter((item) => (status ? item.status === status : true))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function decideKycRequest(input: {
  id: string;
  status: Extract<KycStatus, "approved" | "rejected">;
  reviewerWallet: string;
  decisionReason: string | null;
}): Promise<KycRequestRecord | null> {
  if (hasSupabaseRestConfig()) {
    const ok = await supabasePatch(`kyc_requests?id=eq.${encodeURIComponent(input.id)}`, {
      status: input.status,
      reviewer_wallet: input.reviewerWallet,
      decision_reason: input.decisionReason,
      reviewed_at: new Date().toISOString()
    });
    if (!ok) {
      return null;
    }
    return getKycRequestById(input.id);
  }

  const existing = kycRequests.get(input.id);
  if (!existing) {
    return null;
  }

  const updated: KycRequestRecord = {
    ...existing,
    status: input.status,
    reviewerWallet: input.reviewerWallet,
    decisionReason: input.decisionReason,
    reviewedAt: new Date()
  };

  kycRequests.set(input.id, updated);
  return updated;
}

export function resetKycStoreForTests(): void {
  kycRequests.clear();
}
