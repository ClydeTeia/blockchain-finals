CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"actor_wallet" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"details" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_nonces" (
	"nonce" text PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"message" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"status" text NOT NULL,
	"bucket_id" text NOT NULL,
	"document_path" text NOT NULL,
	"selfie_path" text NOT NULL,
	"document_hash" text NOT NULL,
	"selfie_hash" text NOT NULL,
	"proof_hash" text NOT NULL,
	"submitted_at" timestamp with time zone NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewer_wallet" text,
	"decision_reason" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_answers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"attempt_id" uuid NOT NULL,
	"survey_id" bigint NOT NULL,
	"respondent_wallet" text NOT NULL,
	"answer_json" jsonb NOT NULL,
	"normalized_answer_json" jsonb NOT NULL,
	"answer_hash" text NOT NULL,
	"salt" text NOT NULL,
	"status" text NOT NULL,
	"validation_score" integer NOT NULL,
	"validation_status" text NOT NULL,
	"validation_reason" text,
	"validation_details" jsonb NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone NOT NULL,
	"completion_time_seconds" integer NOT NULL,
	"reward_amount_wei" numeric NOT NULL,
	"completion_nonce" text NOT NULL,
	"completion_deadline" timestamp with time zone,
	"completion_signature" text,
	"onchain_tx_hash" text,
	"onchain_confirmed_at" timestamp with time zone,
	"flagged" boolean NOT NULL,
	"audit_notes" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"survey_id" bigint NOT NULL,
	"respondent_wallet" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"user_agent" text,
	"ip_hash" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_quality_rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"survey_id" bigint NOT NULL,
	"rules_json" jsonb NOT NULL,
	"version" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "kyc_requests_wallet_idx" ON "kyc_requests" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "kyc_requests_status_idx" ON "kyc_requests" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "kyc_requests_document_hash_unique" ON "kyc_requests" USING btree ("document_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "kyc_requests_selfie_hash_unique" ON "kyc_requests" USING btree ("selfie_hash");