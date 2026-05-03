import { supabaseInsert } from "@/lib/storage/supabase-rest";

type AuditInput = {
  actorWallet: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
};

const memoryAuditLogs: AuditInput[] = [];

export async function logAuditEvent(input: AuditInput): Promise<void> {
  const inserted = await supabaseInsert("audit_logs", {
    actor_wallet: input.actorWallet,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    details: input.details ?? {}
  });

  if (!inserted) {
    memoryAuditLogs.push(input);
  }
}

export function resetAuditLogsForTests(): void {
  memoryAuditLogs.length = 0;
}
