import { pgTable, text, timestamp, uuid, bigint, jsonb, integer, numeric, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";

export const authNonces = pgTable("auth_nonces", {
  nonce: text("nonce").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  message: text("message").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const kycRequests = pgTable("kyc_requests", {
  id: uuid("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  status: text("status").notNull(),
  bucketId: text("bucket_id").notNull(),
  documentPath: text("document_path").notNull(),
  selfiePath: text("selfie_path").notNull(),
  documentHash: text("document_hash").notNull(),
  selfieHash: text("selfie_hash").notNull(),
  proofHash: text("proof_hash").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewerWallet: text("reviewer_wallet"),
  decisionReason: text("decision_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
}, (table) => ({
  walletIdx: index("kyc_requests_wallet_idx").on(table.walletAddress),
  statusIdx: index("kyc_requests_status_idx").on(table.status),
  documentHashUnique: uniqueIndex("kyc_requests_document_hash_unique").on(table.documentHash),
  selfieHashUnique: uniqueIndex("kyc_requests_selfie_hash_unique").on(table.selfieHash)
}));

export const surveyAttempts = pgTable("survey_attempts", {
  id: uuid("id").primaryKey(),
  surveyId: bigint("survey_id", { mode: "number" }).notNull(),
  respondentWallet: text("respondent_wallet").notNull(),
  status: text("status").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  userAgent: text("user_agent"),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const surveyAnswers = pgTable("survey_answers", {
  id: uuid("id").primaryKey(),
  attemptId: uuid("attempt_id").notNull(),
  surveyId: bigint("survey_id", { mode: "number" }).notNull(),
  respondentWallet: text("respondent_wallet").notNull(),
  answerJson: jsonb("answer_json").notNull(),
  normalizedAnswerJson: jsonb("normalized_answer_json").notNull(),
  answerHash: text("answer_hash").notNull(),
  salt: text("salt").notNull(),
  status: text("status").notNull(),
  validationScore: integer("validation_score").notNull(),
  validationStatus: text("validation_status").notNull(),
  validationReason: text("validation_reason"),
  validationDetails: jsonb("validation_details").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
  completionTimeSeconds: integer("completion_time_seconds").notNull(),
  rewardAmountWei: numeric("reward_amount_wei").notNull(),
  completionNonce: text("completion_nonce").notNull(),
  completionDeadline: timestamp("completion_deadline", { withTimezone: true }),
  completionSignature: text("completion_signature"),
  onchainTxHash: text("onchain_tx_hash"),
  onchainConfirmedAt: timestamp("onchain_confirmed_at", { withTimezone: true }),
  flagged: boolean("flagged").notNull(),
  auditNotes: text("audit_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const surveyQualityRules = pgTable("survey_quality_rules", {
  id: uuid("id").primaryKey(),
  surveyId: bigint("survey_id", { mode: "number" }).notNull(),
  rulesJson: jsonb("rules_json").notNull(),
  version: integer("version").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey(),
  actorWallet: text("actor_wallet"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  details: jsonb("details").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});
