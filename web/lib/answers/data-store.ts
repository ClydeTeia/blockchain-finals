import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { getDb, hasDatabaseConfig } from "@/lib/db/client";
import { surveyAnswers, surveyAttempts } from "@/lib/db/schema";
import type { SubmitAnswerPayload, SurveyAnswerRecord, SurveyAttemptRecord } from "./types";

const attempts = new Map<string, SurveyAttemptRecord>();
const answers = new Map<string, SurveyAnswerRecord>();

function makeAttemptId(): string {
  return randomUUID();
}

function toAttemptRecord(row: typeof surveyAttempts.$inferSelect): SurveyAttemptRecord {
  return {
    id: row.id,
    surveyId: BigInt(row.surveyId),
    respondentWallet: row.respondentWallet,
    status: row.status as SurveyAttemptRecord["status"],
    startedAt: row.startedAt,
    submittedAt: row.submittedAt ?? null,
    userAgent: row.userAgent ?? null,
    ipHash: row.ipHash ?? null,
    createdAt: row.createdAt
  };
}

function toAnswerRecord(row: typeof surveyAnswers.$inferSelect): SurveyAnswerRecord {
  return {
    id: row.id,
    attemptId: row.attemptId,
    surveyId: BigInt(row.surveyId),
    respondentWallet: row.respondentWallet,
    answerJson: row.answerJson,
    normalizedAnswerJson: row.normalizedAnswerJson,
    answerHash: row.answerHash,
    salt: row.salt,
    status: row.status as SurveyAnswerRecord["status"],
    validationScore: row.validationScore,
    validationStatus: row.validationStatus as "passed" | "failed",
    validationReason: row.validationReason ?? null,
    validationDetails: (row.validationDetails as Record<string, unknown>) ?? {},
    startedAt: row.startedAt,
    submittedAt: row.submittedAt,
    completionTimeSeconds: row.completionTimeSeconds,
    rewardAmountWei: row.rewardAmountWei,
    completionNonce: row.completionNonce,
    completionDeadline: row.completionDeadline ?? null,
    completionSignature: row.completionSignature ?? null,
    onchainTxHash: row.onchainTxHash ?? null,
    onchainConfirmedAt: row.onchainConfirmedAt ?? null,
    flagged: row.flagged,
    auditNotes: row.auditNotes ?? null,
    createdAt: row.createdAt
  };
}

export async function createAttempt(input: {
  surveyId: bigint;
  respondentWallet: string;
  userAgent: string | null;
  ipHash: string | null;
}): Promise<SurveyAttemptRecord> {
  const now = new Date();
  const record: SurveyAttemptRecord = {
    id: makeAttemptId(),
    surveyId: input.surveyId,
    respondentWallet: input.respondentWallet,
    status: "started",
    startedAt: now,
    submittedAt: null,
    userAgent: input.userAgent,
    ipHash: input.ipHash,
    createdAt: now
  };

  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      try {
        await db.insert(surveyAttempts).values({
          id: record.id,
          surveyId: Number(record.surveyId),
          respondentWallet: record.respondentWallet,
          status: record.status,
          startedAt: record.startedAt,
          submittedAt: null,
          userAgent: record.userAgent,
          ipHash: record.ipHash,
          createdAt: record.createdAt
        });
      } catch {
        attempts.set(record.id, record);
      }
      return record;
    }
  }

  attempts.set(record.id, record);
  return record;
}

export async function getAttemptById(id: string): Promise<SurveyAttemptRecord | null> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      const rows = await db.select().from(surveyAttempts).where(eq(surveyAttempts.id, id)).limit(1);
      return rows[0] ? toAttemptRecord(rows[0]) : null;
    }
  }
  return attempts.get(id) ?? null;
}

export async function markAttemptSubmitted(id: string): Promise<void> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      await db.update(surveyAttempts).set({ status: "submitted", submittedAt: new Date() }).where(eq(surveyAttempts.id, id));
      return;
    }
  }

  const record = attempts.get(id);
  if (!record) {
    return;
  }
  record.status = "submitted";
  record.submittedAt = new Date();
  attempts.set(id, record);
}

export async function findSubmittedAnswerBySurveyAndWallet(surveyId: bigint, walletAddress: string): Promise<SurveyAnswerRecord | null> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(surveyAnswers)
        .where(
          and(
            eq(surveyAnswers.surveyId, Number(surveyId)),
            ilike(surveyAnswers.respondentWallet, walletAddress),
            inArray(surveyAnswers.status, ["pending_onchain", "completed_onchain", "claimed"])
          )
        )
        .limit(1);
      return rows[0] ? toAnswerRecord(rows[0]) : null;
    }
  }

  for (const answer of answers.values()) {
    if (
      answer.surveyId === surveyId &&
      answer.respondentWallet.toLowerCase() === walletAddress.toLowerCase() &&
      (answer.status === "pending_onchain" || answer.status === "completed_onchain" || answer.status === "claimed")
    ) {
      return answer;
    }
  }
  return null;
}

export async function createAnswer(payload: SubmitAnswerPayload): Promise<SurveyAnswerRecord> {
  const now = new Date();
  const status = payload.validationStatus === "passed" ? "pending_onchain" : "failed_validation";

  const record: SurveyAnswerRecord = {
    id: randomUUID(),
    attemptId: payload.attemptId,
    surveyId: payload.surveyId,
    respondentWallet: payload.respondentWallet,
    answerJson: payload.answerJson,
    normalizedAnswerJson: payload.normalizedAnswerJson,
    answerHash: payload.answerHash,
    salt: payload.salt,
    status,
    validationScore: payload.validationScore,
    validationStatus: payload.validationStatus,
    validationReason: payload.validationReason,
    validationDetails: payload.validationDetails,
    startedAt: now,
    submittedAt: now,
    completionTimeSeconds: payload.completionTimeSeconds,
    rewardAmountWei: payload.rewardAmountWei,
    completionNonce: payload.completionNonce,
    completionDeadline: payload.completionDeadline,
    completionSignature: payload.completionSignature,
    onchainTxHash: null,
    onchainConfirmedAt: null,
    flagged: false,
    auditNotes: null,
    createdAt: now
  };

  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      try {
        await db.insert(surveyAnswers).values({
          id: record.id,
          attemptId: record.attemptId,
          surveyId: Number(record.surveyId),
          respondentWallet: record.respondentWallet,
          answerJson: record.answerJson,
          normalizedAnswerJson: record.normalizedAnswerJson,
          answerHash: record.answerHash,
          salt: record.salt,
          status: record.status,
          validationScore: record.validationScore,
          validationStatus: record.validationStatus,
          validationReason: record.validationReason,
          validationDetails: record.validationDetails,
          startedAt: record.startedAt,
          submittedAt: record.submittedAt,
          completionTimeSeconds: record.completionTimeSeconds,
          rewardAmountWei: record.rewardAmountWei,
          completionNonce: record.completionNonce,
          completionDeadline: record.completionDeadline,
          completionSignature: record.completionSignature,
          onchainTxHash: null,
          onchainConfirmedAt: null,
          flagged: false,
          auditNotes: null,
          createdAt: record.createdAt
        });
      } catch {
        answers.set(record.id, record);
      }
      return record;
    }
  }

  answers.set(record.id, record);
  return record;
}

export async function getAnswerById(id: string): Promise<SurveyAnswerRecord | null> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      const rows = await db.select().from(surveyAnswers).where(eq(surveyAnswers.id, id)).limit(1);
      return rows[0] ? toAnswerRecord(rows[0]) : null;
    }
  }
  return answers.get(id) ?? null;
}

export async function markAnswerOnchainConfirmed(id: string, txHash: string): Promise<boolean> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      const rows = await db
        .update(surveyAnswers)
        .set({ status: "completed_onchain", onchainTxHash: txHash, onchainConfirmedAt: new Date() })
        .where(eq(surveyAnswers.id, id))
        .returning({ id: surveyAnswers.id });
      return rows.length > 0;
    }
  }

  const record = answers.get(id);
  if (!record) {
    return false;
  }
  record.status = "completed_onchain";
  record.onchainTxHash = txHash;
  record.onchainConfirmedAt = new Date();
  answers.set(id, record);
  return true;
}

export async function updateAnswerProof(id: string, nonce: string, deadline: Date, signature: string): Promise<boolean> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      const rows = await db
        .update(surveyAnswers)
        .set({ completionNonce: nonce, completionDeadline: deadline, completionSignature: signature })
        .where(eq(surveyAnswers.id, id))
        .returning({ id: surveyAnswers.id });
      return rows.length > 0;
    }
  }

  const record = answers.get(id);
  if (!record) {
    return false;
  }
  record.completionNonce = nonce;
  record.completionDeadline = deadline;
  record.completionSignature = signature;
  answers.set(id, record);
  return true;
}

export async function getMyAnswers(walletAddress: string): Promise<SurveyAnswerRecord[]> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(surveyAnswers)
        .where(ilike(surveyAnswers.respondentWallet, walletAddress))
        .orderBy(desc(surveyAnswers.createdAt));
      return rows.map(toAnswerRecord);
    }
  }

  return [...answers.values()]
    .filter((answer) => answer.respondentWallet.toLowerCase() === walletAddress.toLowerCase())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getAllAnswers(): Promise<SurveyAnswerRecord[]> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      const rows = await db.select().from(surveyAnswers).orderBy(desc(surveyAnswers.createdAt));
      return rows.map(toAnswerRecord);
    }
  }

  return [...answers.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function updateAnswerFlag(id: string, flagged: boolean): Promise<boolean> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      const rows = await db
        .update(surveyAnswers)
        .set({ flagged })
        .where(eq(surveyAnswers.id, id))
        .returning({ id: surveyAnswers.id });
      return rows.length > 0;
    }
  }

  const record = answers.get(id);
  if (!record) {
    return false;
  }
  record.flagged = flagged;
  answers.set(id, record);
  return true;
}

export async function updateAnswerAuditNote(id: string, auditNote: string): Promise<boolean> {
  if (hasDatabaseConfig()) {
    const db = getDb();
    if (db) {
      const rows = await db
        .update(surveyAnswers)
        .set({ auditNotes: auditNote })
        .where(eq(surveyAnswers.id, id))
        .returning({ id: surveyAnswers.id });
      return rows.length > 0;
    }
  }

  const record = answers.get(id);
  if (!record) {
    return false;
  }
  record.auditNotes = auditNote;
  answers.set(id, record);
  return true;
}

export function resetAnswerStoresForTests(): void {
  attempts.clear();
  answers.clear();
}
