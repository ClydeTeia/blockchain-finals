import { randomUUID } from "node:crypto";

import {
  hasSupabaseRestConfig,
  supabaseInsert,
  supabasePatch,
  supabaseSelect
} from "@/lib/storage/supabase-rest";
import type {
  SubmitAnswerPayload,
  SurveyAnswerRecord,
  SurveyAttemptRecord
} from "./types";

const attempts = new Map<string, SurveyAttemptRecord>();
const answers = new Map<string, SurveyAnswerRecord>();

function toIsoNow(): string {
  return new Date().toISOString();
}

function makeAttemptId(): string {
  return randomUUID();
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

  if (hasSupabaseRestConfig()) {
    const inserted = await supabaseInsert("survey_attempts", {
      id: record.id,
      survey_id: record.surveyId.toString(),
      respondent_wallet: record.respondentWallet,
      status: record.status,
      started_at: record.startedAt.toISOString(),
      submitted_at: null,
      user_agent: record.userAgent,
      ip_hash: record.ipHash
    });

    if (!inserted) {
      attempts.set(record.id, record);
    }
  } else {
    attempts.set(record.id, record);
  }

  return record;
}

export async function getAttemptById(id: string): Promise<SurveyAttemptRecord | null> {
  if (hasSupabaseRestConfig()) {
    const rows = await supabaseSelect<{
      id: string;
      survey_id: string;
      respondent_wallet: string;
      status: "started" | "submitted";
      started_at: string;
      submitted_at: string | null;
      user_agent: string | null;
      ip_hash: string | null;
      created_at: string;
    }>(
      `survey_attempts?select=id,survey_id,respondent_wallet,status,started_at,submitted_at,user_agent,ip_hash,created_at&id=eq.${encodeURIComponent(
        id
      )}&limit=1`
    );
    const row = rows?.[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      surveyId: BigInt(row.survey_id),
      respondentWallet: row.respondent_wallet,
      status: row.status,
      startedAt: new Date(row.started_at),
      submittedAt: row.submitted_at ? new Date(row.submitted_at) : null,
      userAgent: row.user_agent,
      ipHash: row.ip_hash,
      createdAt: new Date(row.created_at)
    };
  }

  return attempts.get(id) ?? null;
}

export async function markAttemptSubmitted(id: string): Promise<void> {
  if (hasSupabaseRestConfig()) {
    await supabasePatch(
      `survey_attempts?id=eq.${encodeURIComponent(id)}`,
      {
        status: "submitted",
        submitted_at: toIsoNow()
      }
    );
    return;
  }
  const record = attempts.get(id);
  if (!record) {
    return;
  }
  record.status = "submitted";
  record.submittedAt = new Date();
  attempts.set(id, record);
}

export async function findSubmittedAnswerBySurveyAndWallet(
  surveyId: bigint,
  walletAddress: string
): Promise<SurveyAnswerRecord | null> {
  if (hasSupabaseRestConfig()) {
    const rows = await supabaseSelect<{
      id: string;
      attempt_id: string;
      survey_id: string;
      respondent_wallet: string;
      answer_json: unknown;
      normalized_answer_json: unknown;
      answer_hash: string;
      salt: string;
      status: SurveyAnswerRecord["status"];
      validation_score: number;
      validation_status: "passed" | "failed";
      validation_reason: string | null;
      validation_details: Record<string, unknown> | null;
      started_at: string;
      submitted_at: string;
      completion_time_seconds: number;
      reward_amount_wei: string | null;
      completion_nonce: string;
      completion_deadline: string | null;
      completion_signature: string | null;
      onchain_tx_hash: string | null;
      onchain_confirmed_at: string | null;
      flagged: boolean;
      audit_notes: string | null;
      created_at: string;
    }>(
      `survey_answers?select=*&survey_id=eq.${surveyId.toString()}&respondent_wallet=ilike.${encodeURIComponent(
        walletAddress
      )}&status=in.(pending_onchain,completed_onchain,claimed)&limit=1`
    );
    const row = rows?.[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      attemptId: row.attempt_id,
      surveyId: BigInt(row.survey_id),
      respondentWallet: row.respondent_wallet,
      answerJson: row.answer_json,
      normalizedAnswerJson: row.normalized_answer_json,
      answerHash: row.answer_hash,
      salt: row.salt,
      status: row.status,
      validationScore: row.validation_score,
      validationStatus: row.validation_status,
      validationReason: row.validation_reason,
      validationDetails: row.validation_details ?? {},
      startedAt: new Date(row.started_at),
      submittedAt: new Date(row.submitted_at),
      completionTimeSeconds: row.completion_time_seconds,
      rewardAmountWei: row.reward_amount_wei ?? "0",
      completionNonce: row.completion_nonce,
      completionDeadline: row.completion_deadline
        ? new Date(row.completion_deadline)
        : null,
      completionSignature: row.completion_signature,
      onchainTxHash: row.onchain_tx_hash,
      onchainConfirmedAt: row.onchain_confirmed_at
        ? new Date(row.onchain_confirmed_at)
        : null,
      flagged: row.flagged,
      auditNotes: row.audit_notes,
      createdAt: new Date(row.created_at)
    };
  }

  for (const answer of answers.values()) {
    if (
      answer.surveyId === surveyId &&
      answer.respondentWallet.toLowerCase() === walletAddress.toLowerCase() &&
      (answer.status === "pending_onchain" ||
        answer.status === "completed_onchain" ||
        answer.status === "claimed")
    ) {
      return answer;
    }
  }
  return null;
}

export async function createAnswer(
  payload: SubmitAnswerPayload
): Promise<SurveyAnswerRecord> {
  const now = new Date();
  const status =
    payload.validationStatus === "passed" ? "pending_onchain" : "failed_validation";

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

  if (hasSupabaseRestConfig()) {
    const inserted = await supabaseInsert("survey_answers", {
      id: record.id,
      attempt_id: record.attemptId,
      survey_id: record.surveyId.toString(),
      respondent_wallet: record.respondentWallet,
      answer_json: record.answerJson,
      normalized_answer_json: record.normalizedAnswerJson,
      answer_hash: record.answerHash,
      salt: record.salt,
      status: record.status,
      validation_score: record.validationScore,
      validation_status: record.validationStatus,
      validation_reason: record.validationReason,
      validation_details: record.validationDetails,
      started_at: record.startedAt.toISOString(),
      submitted_at: record.submittedAt.toISOString(),
      completion_time_seconds: record.completionTimeSeconds,
      reward_amount_wei: record.rewardAmountWei,
      completion_nonce: record.completionNonce,
      completion_deadline: record.completionDeadline?.toISOString() ?? null,
      completion_signature: record.completionSignature
    });

    if (!inserted) {
      answers.set(record.id, record);
    }
  } else {
    answers.set(record.id, record);
  }

  return record;
}

export async function getAnswerById(id: string): Promise<SurveyAnswerRecord | null> {
  if (hasSupabaseRestConfig()) {
    const rows = await supabaseSelect<{
      id: string;
      attempt_id: string;
      survey_id: string;
      respondent_wallet: string;
      answer_json: unknown;
      normalized_answer_json: unknown;
      answer_hash: string;
      salt: string;
      status: SurveyAnswerRecord["status"];
      validation_score: number;
      validation_status: "passed" | "failed";
      validation_reason: string | null;
      validation_details: Record<string, unknown> | null;
      started_at: string;
      submitted_at: string;
      completion_time_seconds: number;
      reward_amount_wei: string | null;
      completion_nonce: string;
      completion_deadline: string | null;
      completion_signature: string | null;
      onchain_tx_hash: string | null;
      onchain_confirmed_at: string | null;
      flagged: boolean;
      audit_notes: string | null;
      created_at: string;
    }>(`survey_answers?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);

    const row = rows?.[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      attemptId: row.attempt_id,
      surveyId: BigInt(row.survey_id),
      respondentWallet: row.respondent_wallet,
      answerJson: row.answer_json,
      normalizedAnswerJson: row.normalized_answer_json,
      answerHash: row.answer_hash,
      salt: row.salt,
      status: row.status,
      validationScore: row.validation_score,
      validationStatus: row.validation_status,
      validationReason: row.validation_reason,
      validationDetails: row.validation_details ?? {},
      startedAt: new Date(row.started_at),
      submittedAt: new Date(row.submitted_at),
      completionTimeSeconds: row.completion_time_seconds,
      rewardAmountWei: row.reward_amount_wei ?? "0",
      completionNonce: row.completion_nonce,
      completionDeadline: row.completion_deadline
        ? new Date(row.completion_deadline)
        : null,
      completionSignature: row.completion_signature,
      onchainTxHash: row.onchain_tx_hash,
      onchainConfirmedAt: row.onchain_confirmed_at
        ? new Date(row.onchain_confirmed_at)
        : null,
      flagged: row.flagged,
      auditNotes: row.audit_notes,
      createdAt: new Date(row.created_at)
    };
  }
  return answers.get(id) ?? null;
}

export async function markAnswerOnchainConfirmed(
  id: string,
  txHash: string
): Promise<boolean> {
  if (hasSupabaseRestConfig()) {
    return supabasePatch(
      `survey_answers?id=eq.${encodeURIComponent(id)}`,
      {
        status: "completed_onchain",
        onchain_tx_hash: txHash,
        onchain_confirmed_at: toIsoNow()
      }
    );
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

export async function updateAnswerProof(
  id: string,
  nonce: string,
  deadline: Date,
  signature: string
): Promise<boolean> {
  if (hasSupabaseRestConfig()) {
    return supabasePatch(
      `survey_answers?id=eq.${encodeURIComponent(id)}`,
      {
        completion_nonce: nonce,
        completion_deadline: deadline.toISOString(),
        completion_signature: signature
      }
    );
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

export async function getMyAnswers(
  walletAddress: string
): Promise<SurveyAnswerRecord[]> {
  if (hasSupabaseRestConfig()) {
    const rows = await supabaseSelect<{
      id: string;
      attempt_id: string;
      survey_id: string;
      respondent_wallet: string;
      answer_json: unknown;
      normalized_answer_json: unknown;
      answer_hash: string;
      salt: string;
      status: SurveyAnswerRecord["status"];
      validation_score: number;
      validation_status: "passed" | "failed";
      validation_reason: string | null;
      validation_details: Record<string, unknown> | null;
      started_at: string;
      submitted_at: string;
      completion_time_seconds: number;
      reward_amount_wei: string | null;
      completion_nonce: string;
      completion_deadline: string | null;
      completion_signature: string | null;
      onchain_tx_hash: string | null;
      onchain_confirmed_at: string | null;
      flagged: boolean;
      audit_notes: string | null;
      created_at: string;
    }>(
      `survey_answers?select=*&respondent_wallet=ilike.${encodeURIComponent(
        walletAddress
      )}&order=created_at.desc`
    );

    return (rows ?? []).map((row) => ({
      id: row.id,
      attemptId: row.attempt_id,
      surveyId: BigInt(row.survey_id),
      respondentWallet: row.respondent_wallet,
      answerJson: row.answer_json,
      normalizedAnswerJson: row.normalized_answer_json,
      answerHash: row.answer_hash,
      salt: row.salt,
      status: row.status,
      validationScore: row.validation_score,
      validationStatus: row.validation_status,
      validationReason: row.validation_reason,
      validationDetails: row.validation_details ?? {},
      startedAt: new Date(row.started_at),
      submittedAt: new Date(row.submitted_at),
      completionTimeSeconds: row.completion_time_seconds,
      rewardAmountWei: row.reward_amount_wei ?? "0",
      completionNonce: row.completion_nonce,
      completionDeadline: row.completion_deadline
        ? new Date(row.completion_deadline)
        : null,
      completionSignature: row.completion_signature,
      onchainTxHash: row.onchain_tx_hash,
      onchainConfirmedAt: row.onchain_confirmed_at
        ? new Date(row.onchain_confirmed_at)
        : null,
      flagged: row.flagged,
      auditNotes: row.audit_notes,
      createdAt: new Date(row.created_at)
    }));
  }

  return [...answers.values()]
    .filter(
      (answer) =>
        answer.respondentWallet.toLowerCase() === walletAddress.toLowerCase()
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getAllAnswers(): Promise<SurveyAnswerRecord[]> {
  if (hasSupabaseRestConfig()) {
    const rows = await supabaseSelect<{
      id: string;
      attempt_id: string;
      survey_id: string;
      respondent_wallet: string;
      answer_json: unknown;
      normalized_answer_json: unknown;
      answer_hash: string;
      salt: string;
      status: SurveyAnswerRecord["status"];
      validation_score: number;
      validation_status: "passed" | "failed";
      validation_reason: string | null;
      validation_details: Record<string, unknown> | null;
      started_at: string;
      submitted_at: string;
      completion_time_seconds: number;
      reward_amount_wei: string | null;
      completion_nonce: string;
      completion_deadline: string | null;
      completion_signature: string | null;
      onchain_tx_hash: string | null;
      onchain_confirmed_at: string | null;
      flagged: boolean;
      audit_notes: string | null;
      created_at: string;
    }>(
      `survey_answers?select=*&order=created_at.desc`
    );

    return (rows ?? []).map((row) => ({
      id: row.id,
      attemptId: row.attempt_id,
      surveyId: BigInt(row.survey_id),
      respondentWallet: row.respondent_wallet,
      answerJson: row.answer_json,
      normalizedAnswerJson: row.normalized_answer_json,
      answerHash: row.answer_hash,
      salt: row.salt,
      status: row.status,
      validationScore: row.validation_score,
      validationStatus: row.validation_status,
      validationReason: row.validation_reason,
      validationDetails: row.validation_details ?? {},
      startedAt: new Date(row.started_at),
      submittedAt: new Date(row.submitted_at),
      completionTimeSeconds: row.completion_time_seconds,
      rewardAmountWei: row.reward_amount_wei ?? "0",
      completionNonce: row.completion_nonce,
      completionDeadline: row.completion_deadline
        ? new Date(row.completion_deadline)
        : null,
      completionSignature: row.completion_signature,
      onchainTxHash: row.onchain_tx_hash,
      onchainConfirmedAt: row.onchain_confirmed_at
        ? new Date(row.onchain_confirmed_at)
        : null,
      flagged: row.flagged,
      auditNotes: row.audit_notes,
      createdAt: new Date(row.created_at)
    }));
  }

  return [...answers.values()]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
