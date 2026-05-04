import { randomUUID } from "node:crypto";
import { getDb, hasDatabaseConfig } from "@/lib/db/client";
import { auditLogs } from "@/lib/db/schema";

type AuditInput = {
  actorWallet: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
};

const memoryAuditLogs: AuditInput[] = [];

function isExplicitTestMode(): boolean {
  return process.env.NODE_ENV === "test" || process.env.SUPABASE_TEST_MODE === "1";
}

export async function logAuditEvent(input: AuditInput): Promise<void> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      try {
        await db.insert(auditLogs).values({
          id: randomUUID(),
          actorWallet: input.actorWallet,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          details: input.details ?? {},
          createdAt: new Date()
        });
        return;
      } catch {
        // fallback below
      }
    }
  }

  if (isExplicitTestMode()) {
    memoryAuditLogs.push(input);
    return;
  }

  throw new Error("Audit log persistence failed.");
}

export function resetAuditLogsForTests(): void {
  memoryAuditLogs.length = 0;
}
