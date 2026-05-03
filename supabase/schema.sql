-- Phase 4 Supabase schema for SurveyChain Rewards.

create extension if not exists "pgcrypto";

create table if not exists auth_nonces (
	nonce text primary key,
	wallet_address text not null,
	message text not null,
	expires_at timestamptz not null,
	used_at timestamptz null,
	created_at timestamptz not null default now()
);

create index if not exists auth_nonces_wallet_idx on auth_nonces (wallet_address);

create table if not exists kyc_requests (
	id uuid primary key default gen_random_uuid(),
	wallet_address text not null,
	status text not null,
	bucket_id text not null default 'kyc-documents',
	document_path text not null,
	selfie_path text not null,
	document_hash text not null,
	selfie_hash text not null,
	proof_hash text not null,
	submitted_at timestamptz not null default now(),
	reviewed_at timestamptz null,
	reviewer_wallet text null,
	decision_reason text null,
	created_at timestamptz not null default now(),
	constraint kyc_requests_status_check check (
		status in ('pending', 'approved', 'rejected', 'revoked')
	)
);

create index if not exists kyc_requests_wallet_idx on kyc_requests (wallet_address);
create index if not exists kyc_requests_status_idx on kyc_requests (status);
create unique index if not exists kyc_requests_document_hash_unique on kyc_requests (document_hash);
create unique index if not exists kyc_requests_selfie_hash_unique on kyc_requests (selfie_hash);
create unique index if not exists kyc_requests_wallet_approved_unique
	on kyc_requests (wallet_address)
	where status = 'approved';

create table if not exists survey_attempts (
	id uuid primary key,
	survey_id bigint not null,
	respondent_wallet text not null,
	status text not null,
	started_at timestamptz not null,
	submitted_at timestamptz null,
	user_agent text null,
	ip_hash text null,
	created_at timestamptz not null default now(),
	constraint survey_attempts_status_check check (
		status in ('started', 'submitted')
	)
);

create index if not exists survey_attempts_survey_idx on survey_attempts (survey_id);
create index if not exists survey_attempts_wallet_idx on survey_attempts (respondent_wallet);

create table if not exists survey_answers (
	id uuid primary key,
	attempt_id uuid not null references survey_attempts (id) on delete cascade,
	survey_id bigint not null,
	respondent_wallet text not null,
	answer_json jsonb not null,
	normalized_answer_json jsonb not null,
	answer_hash text not null,
	salt text not null,
	status text not null,
	validation_score integer not null,
	validation_status text not null,
	validation_reason text null,
	validation_details jsonb not null default '{}'::jsonb,
	started_at timestamptz not null,
	submitted_at timestamptz not null,
	completion_time_seconds integer not null,
	reward_amount_wei numeric(78, 0) not null default 0,
	completion_nonce text not null,
	completion_deadline timestamptz null,
	completion_signature text null,
	onchain_tx_hash text null,
	onchain_confirmed_at timestamptz null,
	flagged boolean not null default false,
	audit_notes text null,
	created_at timestamptz not null default now(),
	constraint survey_answers_status_check check (
		status in (
			'submitted_offchain',
			'failed_validation',
			'pending_onchain',
			'completed_onchain',
			'claimed',
			'failed_onchain',
			'flagged'
		)
	),
	constraint survey_answers_validation_status_check check (
		validation_status in ('passed', 'failed')
	)
);

comment on table survey_answers is 'Append-only survey answer records. Do not update original answer content.';

create unique index if not exists survey_answers_attempt_unique on survey_answers (attempt_id);
create index if not exists survey_answers_survey_idx on survey_answers (survey_id);
create index if not exists survey_answers_wallet_idx on survey_answers (respondent_wallet);
create index if not exists survey_answers_status_idx on survey_answers (status);
create index if not exists survey_answers_answer_hash_idx on survey_answers (answer_hash);
create unique index if not exists survey_answers_reward_eligible_unique
	on survey_answers (survey_id, respondent_wallet)
	where status in ('pending_onchain', 'completed_onchain', 'claimed');

create table if not exists survey_quality_rules (
	id uuid primary key default gen_random_uuid(),
	survey_id bigint not null,
	rules_json jsonb not null default '{}'::jsonb,
	version integer not null default 1,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create unique index if not exists survey_quality_rules_survey_unique
	on survey_quality_rules (survey_id);

create table if not exists audit_logs (
	id uuid primary key default gen_random_uuid(),
	actor_wallet text null,
	action text not null,
	entity_type text not null,
	entity_id text not null,
	details jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_idx on audit_logs (entity_type, entity_id);
create index if not exists audit_logs_actor_idx on audit_logs (actor_wallet);
