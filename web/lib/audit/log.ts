import { supabaseInsert } from "@/lib/storage/supabase-rest";

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
  const inserted = await supabaseInsert("audit_logs", {
    actor_wallet: input.actorWallet,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    details: input.details ?? {}
  });

  if (!inserted) {
    if (isExplicitTestMode()) {
      memoryAuditLogs.push(input);
      return;
    }

    throw new Error("Audit log persistence failed.");
  }
}

export function resetAuditLogsForTests(): void {
  memoryAuditLogs.length = 0;
}
