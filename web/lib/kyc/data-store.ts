import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike } from "drizzle-orm";
import { getDb, hasDatabaseConfig } from "@/lib/db/client";
import { kycRequests } from "@/lib/db/schema";

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

const memoryStore = new Map<string, KycRequestRecord>();

function isExplicitTestMode(): boolean {
  return process.env.NODE_ENV === "test" || process.env.SUPABASE_TEST_MODE === "1";
}

function allowMemoryFallback(): boolean {
  return !hasDatabaseConfig() && isExplicitTestMode();
}

function makePersistenceError(message: string, code: string): Error & { code: string } {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

function toRecord(row: typeof kycRequests.$inferSelect): KycRequestRecord {
  return {
    id: row.id,
    walletAddress: row.walletAddress,
    status: row.status as KycStatus,
    bucketId: row.bucketId,
    documentPath: row.documentPath,
    selfiePath: row.selfiePath,
    documentHash: row.documentHash,
    selfieHash: row.selfieHash,
    proofHash: row.proofHash,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt ?? null,
    reviewerWallet: row.reviewerWallet ?? null,
    decisionReason: row.decisionReason ?? null,
    createdAt: row.createdAt
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

  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      try {
        await db.insert(kycRequests).values(record);
      } catch {
        const [existingDocument, existingSelfie] = await Promise.all([
          db.select({ id: kycRequests.id }).from(kycRequests).where(eq(kycRequests.documentHash, record.documentHash)).limit(1),
          db.select({ id: kycRequests.id }).from(kycRequests).where(eq(kycRequests.selfieHash, record.selfieHash)).limit(1)
        ]);

        if (existingDocument.length > 0 || existingSelfie.length > 0) {
          throw makePersistenceError("Duplicate KYC image hash.", "DUPLICATE_KYC_HASH");
        }

        throw makePersistenceError("Failed to persist KYC request.", "KYC_PERSIST_FAILED");
      }
      return record;
    }
  }

  if (allowMemoryFallback()) {
    const hasDuplicate = [...memoryStore.values()].some(
      (item) =>
        item.documentHash === record.documentHash ||
        item.selfieHash === record.selfieHash
    );
    if (hasDuplicate) {
      throw makePersistenceError("Duplicate KYC image hash.", "DUPLICATE_KYC_HASH");
    }
    memoryStore.set(record.id, record);
    return record;
  }

  throw makePersistenceError("Database is not configured for KYC persistence.", "SUPABASE_CONFIG_MISSING");
}

export async function getLatestKycRequestByWallet(walletAddress: string): Promise<KycRequestRecord | null> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(kycRequests)
        .where(ilike(kycRequests.walletAddress, walletAddress))
        .orderBy(desc(kycRequests.createdAt))
        .limit(1);
      return rows[0] ? toRecord(rows[0]) : null;
    }
  }

  if (!allowMemoryFallback()) {
    throw makePersistenceError("Database is not configured for KYC reads.", "SUPABASE_CONFIG_MISSING");
  }

  const records = [...memoryStore.values()]
    .filter((item) => item.walletAddress.toLowerCase() === walletAddress.toLowerCase())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return records[0] ?? null;
}

export async function getKycRequestById(id: string): Promise<KycRequestRecord | null> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      const rows = await db.select().from(kycRequests).where(eq(kycRequests.id, id)).limit(1);
      return rows[0] ? toRecord(rows[0]) : null;
    }
  }

  if (!allowMemoryFallback()) {
    throw makePersistenceError("Database is not configured for KYC reads.", "SUPABASE_CONFIG_MISSING");
  }

  return memoryStore.get(id) ?? null;
}

export async function listKycRequests(status?: KycStatus): Promise<KycRequestRecord[]> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      const rows = status
        ? await db.select().from(kycRequests).where(eq(kycRequests.status, status)).orderBy(desc(kycRequests.createdAt))
        : await db.select().from(kycRequests).orderBy(desc(kycRequests.createdAt));
      return rows.map(toRecord);
    }
  }

  if (!allowMemoryFallback()) {
    throw makePersistenceError("Database is not configured for KYC reads.", "SUPABASE_CONFIG_MISSING");
  }

  return [...memoryStore.values()]
    .filter((item) => (status ? item.status === status : true))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function decideKycRequest(input: {
  id: string;
  status: Extract<KycStatus, "approved" | "rejected">;
  reviewerWallet: string;
  decisionReason: string | null;
}): Promise<KycRequestRecord | null> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      const reviewedAt = new Date();
      const rows = await db
        .update(kycRequests)
        .set({
          status: input.status,
          reviewerWallet: input.reviewerWallet,
          decisionReason: input.decisionReason,
          reviewedAt
        })
        .where(eq(kycRequests.id, input.id))
        .returning();

      return rows[0] ? toRecord(rows[0]) : null;
    }
  }

  if (!allowMemoryFallback()) {
    throw makePersistenceError("Database is not configured for KYC decisions.", "SUPABASE_CONFIG_MISSING");
  }

  const existing = memoryStore.get(input.id);
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
  memoryStore.set(input.id, updated);
  return updated;
}

export function resetKycStoreForTests(): void {
  memoryStore.clear();
}
