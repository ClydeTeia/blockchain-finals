# Supabase Schema

This document describes the Phase 4 schema for SurveyChain Rewards. It is the source of truth for the Supabase tables used by server-side routes.

## Tables

### auth_nonces
- Stores login nonce records for wallet-signature authentication.
- Key fields: `nonce`, `wallet_address`, `message`, `expires_at`, `used_at`, `created_at`.

### kyc_requests
- Demo KYC submissions and admin review state.
- Key fields: `wallet_address`, `status`, `document_path`, `selfie_path`, `document_hash`, `selfie_hash`, `proof_hash`.
- Unique constraints prevent duplicate image reuse and multiple approved wallets.

### survey_attempts
- Tracks attempt lifecycle per wallet and survey.
- Key fields: `survey_id`, `respondent_wallet`, `status`, `started_at`, `submitted_at`.

### survey_answers
- Stores raw and normalized answers, validation results, proof metadata, and on-chain confirmation.
- Append-only policy: original answer content should not be mutated.
- Key fields: `answer_json`, `normalized_answer_json`, `answer_hash`, `salt`, `validation_score`, `validation_status`, `completion_nonce`, `completion_signature`.
- Partial unique index prevents duplicate reward-eligible submissions.

### survey_quality_rules
- Optional per-survey quality rules storage.
- Key fields: `survey_id`, `rules_json`, `version`.

### audit_logs
- Lightweight audit trail for admin and system actions.
- Key fields: `actor_wallet`, `action`, `entity_type`, `entity_id`, `details`.

## Storage Policies

- Bucket: `kyc-documents` is private.
- Access pattern: server-side service role only; admins receive short-lived signed URLs.
- Client access is intentionally not granted in storage RLS policies.
