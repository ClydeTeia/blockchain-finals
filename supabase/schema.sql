-- SurveyChain Rewards - Full Supabase Schema
-- Run this in Supabase SQL Editor to create all tables and indexes

-- Enable UUID extension if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: kyc_requests
create table if not exists kyc_requests (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  id_image_path text not null,
  selfie_image_path text not null,
  id_image_hash text not null,
  selfie_image_hash text not null,
  kyc_proof_hash text not null,
  status text not null default 'pending',
  rejection_reason text,
  reviewed_by text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create unique index if not exists unique_approved_wallet
on kyc_requests (lower(wallet_address))
where status = 'approved';

create unique index if not exists unique_id_image_hash
on kyc_requests (id_image_hash);

create unique index if not exists unique_selfie_image_hash
on kyc_requests (selfie_image_hash);

-- Table: survey_attempts
create table if not exists survey_attempts (
  id uuid primary key default gen_random_uuid(),
  survey_id bigint not null,
  respondent_wallet text not null,
  status text not null default 'started',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_survey_attempts_wallet
on survey_attempts (respondent_wallet);

create index if not exists idx_survey_attempts_survey
on survey_attempts (survey_id);

-- Table: survey_answers
create table if not exists survey_answers (
  id uuid primary key default gen_random_uuid(),

  attempt_id uuid references survey_attempts(id),
  survey_id bigint not null,
  respondent_wallet text not null,

  answer_json jsonb not null,
  normalized_answer_json jsonb not null,

  answer_hash text not null,
  salt text not null,

  status text not null default 'submitted_offchain',
  -- submitted_offchain
  -- failed_validation
  -- pending_onchain
  -- completed_onchain
  -- claimed
  -- failed_onchain
  -- flagged

  validation_score numeric not null default 0,
  validation_status text not null,
  validation_reason text,
  validation_details jsonb,

  started_at timestamptz not null,
  submitted_at timestamptz not null default now(),
  completion_time_seconds integer,

  completion_nonce text not null unique,
  completion_deadline timestamptz,
  completion_signature text,

  onchain_tx_hash text,
  onchain_confirmed_at timestamptz,

  flagged boolean not null default false,
  audit_notes text,

  created_at timestamptz not null default now()
);

create unique index if not exists unique_reward_eligible_response_per_wallet
on survey_answers (survey_id, lower(respondent_wallet))
where status in ('pending_onchain', 'completed_onchain', 'claimed');

create index if not exists idx_survey_answers_wallet
on survey_answers (respondent_wallet);

create index if not exists idx_survey_answers_survey
on survey_answers (survey_id);

create index if not exists idx_survey_answers_status
on survey_answers (status);

-- Table: surveys
create table if not exists surveys (
  id bigint primary key,
  creator text not null,
  title text not null,
  description text,
  question text not null,
  options text[] not null,
  reward_per_response text not null,
  max_responses bigint not null,
  response_count bigint not null default 0,
  escrow_remaining text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_surveys_creator
on surveys (creator);

create index if not exists idx_surveys_active
on surveys (active);

-- Table: survey_quality_rules
create table if not exists survey_quality_rules (
  survey_id bigint primary key,
  min_completion_seconds integer not null default 30,
  min_text_answer_length integer not null default 20,
  require_attention_check boolean not null default true,
  attention_check_question_id text,
  attention_check_expected_answer text,
  passing_score integer not null default 70,
  created_at timestamptz not null default now()
);

-- Table: auth_nonces
create table if not exists auth_nonces (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  nonce text not null unique,
  message text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_nonces_wallet
on auth_nonces (wallet_address);

-- Table: audit_logs
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_wallet text,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor
on audit_logs (actor_wallet);

create index if not exists idx_audit_logs_entity
on audit_logs (entity_type, entity_id);

-- Enable Row Level Security (RLS)
-- For development you can disable, but production should use RLS
-- alter table kyc_requests enable row level security;
-- etc.

-- Notes:
-- - All monetary values are stored as wei strings (text) to avoid precision loss
-- - answer_hash is keccak256 of normalized answer + salt + surveyId + wallet + timestamp
-- - completion_nonce is a random string that must be unique per proof
-- - status values: see enum comments on each table
-- - timestamps are stored as timestamptz (UTC)
