import { NONCE_TTL_SECONDS } from "./config";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, hasDatabaseConfig } from "@/lib/db/client";
import { authNonces } from "@/lib/db/schema";

export type NonceRecord = {
  walletAddress: string;
  nonce: string;
  message: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

const nonceStore = new Map<string, NonceRecord>();

function cleanupExpiredRecords(now: Date): void {
  for (const [nonce, record] of nonceStore.entries()) {
    if (record.expiresAt <= now || record.usedAt) {
      nonceStore.delete(nonce);
    }
  }
}

export async function createNonceRecord(params: {
  walletAddress: string;
  nonce: string;
  message: string;
}): Promise<NonceRecord> {
  const now = new Date();
  cleanupExpiredRecords(now);

  const record: NonceRecord = {
    walletAddress: params.walletAddress,
    nonce: params.nonce,
    message: params.message,
    expiresAt: new Date(now.getTime() + NONCE_TTL_SECONDS * 1000),
    usedAt: null,
    createdAt: now
  };

  nonceStore.set(record.nonce, record);

  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      try {
        await db.insert(authNonces).values({
          nonce: record.nonce,
          walletAddress: record.walletAddress,
          message: record.message,
          expiresAt: record.expiresAt,
          usedAt: null,
          createdAt: record.createdAt
        });
      } catch {
        return record;
      }
    }
  }

  return record;
}

export async function getNonceRecord(nonce: string): Promise<NonceRecord | null> {
  const getFromMemoryStore = (): NonceRecord | null => {
    const fallbackRecord = nonceStore.get(nonce);
    if (!fallbackRecord) {
      return null;
    }

    if (fallbackRecord.expiresAt <= new Date()) {
      nonceStore.delete(nonce);
      return null;
    }

    return fallbackRecord;
  };

  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(authNonces)
        .where(eq(authNonces.nonce, nonce))
        .limit(1);
      const row = rows[0];
      if (!row) {
        return getFromMemoryStore();
      }
      if (row.expiresAt <= new Date()) {
        return getFromMemoryStore();
      }
      return {
        walletAddress: row.walletAddress,
        nonce: row.nonce,
        message: row.message,
        expiresAt: row.expiresAt,
        usedAt: row.usedAt ?? null,
        createdAt: row.createdAt
      };
    }
  }

  return getFromMemoryStore();
}

export async function markNonceAsUsed(nonce: string): Promise<void> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      const now = new Date();
      const result = await db
        .update(authNonces)
        .set({ usedAt: now })
        .where(and(eq(authNonces.nonce, nonce), isNull(authNonces.usedAt)));
      if (result.rowCount && result.rowCount > 0) {
        return;
      }
    }
  }

  const record = nonceStore.get(nonce);
  if (!record) {
    return;
  }

  record.usedAt = new Date();
  nonceStore.set(nonce, record);
}

export function resetNonceStoreForTests(): void {
  nonceStore.clear();
}
