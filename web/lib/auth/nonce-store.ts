import { NONCE_TTL_SECONDS } from "./config";
import {
  hasSupabaseRestConfig,
  supabaseInsert,
  supabasePatch,
  supabaseSelect
} from "@/lib/storage/supabase-rest";

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

  if (hasSupabaseRestConfig()) {
    const inserted = await supabaseInsert("auth_nonces", {
      wallet_address: record.walletAddress,
      nonce: record.nonce,
      message: record.message,
      expires_at: record.expiresAt.toISOString()
    });

    if (!inserted) {
      nonceStore.set(record.nonce, record);
    }
  } else {
    nonceStore.set(record.nonce, record);
  }

  return record;
}

export async function getNonceRecord(nonce: string): Promise<NonceRecord | null> {
  if (hasSupabaseRestConfig()) {
    const rows = await supabaseSelect<{
      wallet_address: string;
      nonce: string;
      message: string;
      expires_at: string;
      used_at: string | null;
      created_at: string;
    }>(
      `auth_nonces?select=wallet_address,nonce,message,expires_at,used_at,created_at&nonce=eq.${encodeURIComponent(
        nonce
      )}&limit=1`
    );

    const row = rows?.[0];
    if (!row) {
      return null;
    }

    const record: NonceRecord = {
      walletAddress: row.wallet_address,
      nonce: row.nonce,
      message: row.message,
      expiresAt: new Date(row.expires_at),
      usedAt: row.used_at ? new Date(row.used_at) : null,
      createdAt: new Date(row.created_at)
    };

    if (record.expiresAt <= new Date()) {
      return null;
    }

    return record;
  }

  const record = nonceStore.get(nonce);
  if (!record) {
    return null;
  }

  if (record.expiresAt <= new Date()) {
    nonceStore.delete(nonce);
    return null;
  }

  return record;
}

export async function markNonceAsUsed(nonce: string): Promise<void> {
  if (hasSupabaseRestConfig()) {
    await supabasePatch(
      `auth_nonces?nonce=eq.${encodeURIComponent(nonce)}`,
      { used_at: new Date().toISOString() }
    );
    return;
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
