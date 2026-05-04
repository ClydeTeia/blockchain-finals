# Implementation Plan: SurveyChain Rewards

## Harness-Engineering Adapted Edition

This plan is based on the SurveyChain Rewards PRD and adapts agent-first ideas from OpenAI's harness engineering approach into a practical workflow for Codex, Claude Code, Cursor Agent, and similar coding agents.

The purpose of this file is not only to list implementation phases. It also makes the project more legible to AI coding agents by defining repository maps, execution plans, validation loops, guardrails, and phase-scoped review checkpoints.

---

## 1. Context Summary

### Project

SurveyChain Rewards is a blockchain-based escrow and proof-of-completion system for verified survey rewards.

It is a Cryptography & Blockchain final project dApp using:

- Next.js + TypeScript full-stack web app (App Router)
- Next.js Route Handlers deployed on Vercel
- Supabase Postgres and private Supabase Storage
- Hardhat + TypeScript smart contract workspace
- ethers.js v6
- MetaMask
- Ethereum Sepolia Testnet
- Sepolia ETH only, not real money

The web app and backend API live together in `web/`. Browser-facing React code must use only `NEXT_PUBLIC_` environment variables, while Supabase service-role access, session signing, and validator private-key proof signing must stay in Next.js Route Handlers or server-only libraries.

### Requested feature/change

Create a complete implementation plan that an AI coding agent can follow phase by phase without hallucinating unsupported files, APIs, schemas, routes, or libraries.

The implementation should build the system described in the PRD:

- Wallet connection
- Sepolia network guard
- Wallet-signature authentication
- Demo KYC-style verification
- Private KYC image storage
- On-chain Verified Respondent Pass
- Survey creation and escrow funding
- Response Quality Gate
- Backend-signed EIP-712 completion proofs
- On-chain response proof submission
- Claimable rewards
- Admin audit and answer integrity verification
- README, deployment, demo flow, and tests

### Current known architecture

The PRD defines this target structure:

```txt
surveychain-rewards/
  AGENTS.md
  PRD.md
  README.md
  package.json
  pnpm-workspace.yaml

  contracts/
    contracts/
      SurveyReward.sol
    scripts/
      deploy.ts
    test/
      SurveyReward.test.ts
    hardhat.config.ts
    package.json
    .env.example

  web/
    app/
      layout.tsx
      page.tsx
      api/
        auth/
        kyc/
        admin/
        surveys/
        answers/
    components/
    hooks/
    lib/
      supabase/
      auth/
      blockchain/
      quality-gate/
    public/
    package.json
    next.config.ts
    .env.example

  supabase/
    schema.sql
    storage-policies.sql

  docs/
    index.md
    architecture.md
    agent-harness.md
    decisions/
    execution-plans/
      active/
      completed/
    references/
```

### Relevant modules from the PRD

- Smart contract: `SurveyReward.sol`
- Contract tests: `SurveyReward.test.ts`
- Wallet/auth routes:
  - `POST /api/auth/nonce`
  - `POST /api/auth/verify`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- KYC routes:
  - `POST /api/kyc/submit`
  - `GET /api/kyc/status`
  - `GET /api/admin/kyc-requests`
  - `POST /api/admin/kyc/:id/signed-urls`
  - `POST /api/admin/kyc/:id/approve`
  - `POST /api/admin/kyc/:id/reject`
- Survey routes:
  - `POST /api/surveys/:surveyId/start-attempt`
  - `GET /api/surveys`
  - `GET /api/surveys/:id`
  - `GET /api/surveys/:id/quality-rules`
- Answer routes:
  - `POST /api/answers/submit`
  - `POST /api/answers/:id/refresh-proof`
  - `POST /api/answers/:id/mark-onchain-confirmed`
  - `GET /api/answers/my`
  - `GET /api/admin/answers`
  - `POST /api/admin/answers/:id/flag`
  - `POST /api/admin/answers/:id/audit-note`
  - `POST /api/admin/answers/:id/verify-integrity`

### Constraints and non-goals

Do not implement:

- Real-money rewards
- Ethereum mainnet deployment
- Paid production KYC
- AML screening
- Legal compliance certification
- Raw KYC image storage on-chain
- Raw answer storage on-chain
- Zero-knowledge proofs
- Full bot elimination claims
- Guaranteed respondent sincerity detection
- Editing original submitted answers
- Reward clawback after flagging

### Explicit assumptions

Because no existing codebase was provided with the PRD, this plan assumes a new repository or a repository that can be inspected and aligned with the PRD.

If actual files already exist, the AI coding agent must inspect them before editing and update this plan's "Current-State Audit" with discovered evidence.

### Open questions

- Is the repository already created, or should the agent scaffold it from scratch?
- Will Vercel API Routes live inside the Next.js web app project, or should the project use a framework that naturally supports serverless API routes?
- Will the final deployment use one Vercel project for the Next.js app, plus separate Sepolia contract deployment?
- Will CAPTCHA be implemented in MVP, or deferred as optional?
- Will the admin wallet be a single configured wallet or multiple role-based wallets?
- Will Supabase RLS be enabled for all tables, or will all protected operations go through service-role server routes only?

---

## 2. Harness-Engineering Strategy for This Project

### Why this section exists

The project should be built in a way that is easy for AI coding agents to understand, verify, and extend.

The agent should not rely on one giant prompt. Instead, the repository should contain short maps, focused docs, active execution plans, tests, scripts, and checklists that make the system legible.

### Harness principles adapted for SurveyChain

Use these principles throughout the project:

1. **Repository knowledge is the system of record.**  
   Any important decision, assumption, API contract, schema, flow, or limitation must be written into the repo.

2. **AGENTS.md is a map, not a manual.**  
   Keep `AGENTS.md` short. It should point agents to `PRD.md`, architecture docs, phase plans, test commands, and risk areas.

3. **Use progressive disclosure.**  
   Agents should start from:
   - `AGENTS.md`
   - `docs/index.md`
   - the active phase plan
   - relevant source files  
   They should not be forced to read every document for every small task.

4. **Make the app agent-legible.**  
   Add repeatable commands, seed/demo data, scripts, logs, and test fixtures so agents can verify behavior directly.

5. **Encode rules mechanically where possible.**  
   Prefer tests, lint rules, type checks, schema checks, and scripts over prose-only instructions.

6. **Keep phase work small and reviewable.**  
   Each phase should be able to stand as a focused PR or local working checkpoint.

7. **Treat plans as first-class artifacts.**  
   Active implementation plans should live in `docs/execution-plans/active/`. Completed plans should move to `docs/execution-plans/completed/`.

8. **Add cleanup loops.**  
   After MVP, add regular agent tasks for stale docs, duplicate utilities, oversized files, missing tests, and mismatched README/API docs.

### Recommended repository knowledge layout

Create this documentation structure early:

```txt
docs/
  index.md
  architecture.md
  agent-harness.md
  security.md
  api-contracts.md
  smart-contract.md
  supabase-schema.md
  web-map.md
  testing.md
  demo-script.md
  decisions/
    0001-api-hosting.md
    0002-answer-hash-policy.md
    0003-demo-kyc-safety.md
  execution-plans/
    active/
      surveychain-implementation-plan.md
    completed/
  references/
    prd-summary.md
```

### Recommended AGENTS.md structure

`AGENTS.md` should be short and should point agents to the right files.

```md
# AGENTS.md

## Start Here

Before editing, read:

1. `PRD.md`
2. `docs/index.md`
3. `docs/architecture.md`
4. `docs/execution-plans/active/surveychain-implementation-plan.md`
5. The files directly related to your task

## Core Rules

- Inspect before editing.
- Keep changes phase-scoped.
- Do not invent files, routes, schemas, DTOs, contract methods, or dependencies.
- Do not expose secrets.
- Do not store raw KYC images or raw survey answers on-chain.
- Do not claim production KYC or real-money behavior.
- Prefer tests before or alongside implementation.
- Run validation commands before finishing.
- Document mismatches in the active execution plan.

## Validation Commands

Use the commands that exist in the repo. Likely examples:

```powershell
pnpm install
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

For contracts:

```powershell
cd contracts
pnpm test
pnpm hardhat compile
```

For the Next.js web app:

```powershell
cd web
pnpm lint
pnpm typecheck
pnpm build
```
```

### Agent-legibility checklist

Add or maintain:

- `.env.example` files
- `README.md`
- `PRD.md`
- `AGENTS.md`
- `docs/index.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/demo-script.md`
- seeded demo data where practical
- scripts for local checks
- clear error messages
- stable test fixtures
- route/API contract docs
- smart contract event/function docs

---

## 3. Planning Principles for the AI Agent

The coding agent must follow these principles:

- Inspect before editing.
- Prefer the smallest safe change.
- Keep changes phase-scoped.
- Write or update tests before or alongside implementation.
- Run validation commands after every phase.
- Avoid context drift by re-reading relevant files at the start of each phase.
- Never invent APIs, DTOs, database fields, routes, contract methods, or components without verifying them.
- Record discovered mismatches in the active execution plan instead of silently changing scope.
- Keep commits or working changes reviewable by phase.
- Use repository-local documentation as the source of truth.
- When a rule matters, prefer a test/script/type/lint check over prose-only instruction.
- If requirements conflict, stop and document the decision point.
- Do not change authentication, authorization, reward behavior, privacy behavior, or schema outside the phase where it is explicitly allowed.

---

## 4. Current-State Audit

Because no existing repository was provided, Phase 0 must fill in this table using actual inspected files.

| Area | Current Evidence | Status | Notes |
| --- | --- | --- | --- |
| Repository structure | PRD proposes `contracts/`, `web/`, `supabase/`, and docs | Needs verification | Agent must inspect actual repo before editing. |
| Agent harness docs | PRD mentions `AGENTS.md`; harness strategy recommends `docs/` map | Missing until created | Add early so future agent runs have stable context. |
| Smart contract | PRD specifies `SurveyReward.sol` | Needs implementation | Must include roles, verification, survey escrow, EIP-712 proof, rewards, close/refund. |
| Contract tests | PRD specifies Hardhat test requirements | Needs implementation | Contract tests should be written before or with contract implementation. |
| Web app | PRD specifies Next.js + TypeScript App Router | Needs verification | Need confirm package setup, `app/` routes, and `app/api/**/route.ts` route handlers. |
| API route handlers | PRD requires Next.js Route Handlers under `web/app/api` | Needs implementation | Use Route Handlers for wallet auth, KYC, quality gate, proof signing, and admin APIs. |
| Supabase schema | PRD provides SQL tables | Needs implementation | Add `supabase/schema.sql` and storage policies. |
| KYC private storage | PRD requires private `kyc-documents` bucket | Needs implementation | Must avoid public URLs and real ID requirements. |
| Wallet auth | PRD requires nonce + verify + session | Needs implementation | Backend must not trust frontend wallet address. |
| Response Quality Gate | PRD defines hard-fail and scoring rules | Needs implementation | Must not sign proofs for failed validation. |
| Completion proof | PRD requires EIP-712 typed data | Needs implementation | Contract/backend fields must match exactly. |
| Answer hashing | PRD requires salted hash | Needs implementation | Normalization must be deterministic. |
| Admin audit | PRD requires KYC, answers, flags, notes, integrity verification | Needs implementation | Keep original answers append-only. |
| Tests | PRD requires contract, API, web/manual coverage | Needs implementation | Prioritize contract and proof tests. |
| Config/env | PRD defines Next.js public env vars and server-only env vars | Needs implementation | Never commit real secrets; expose only `NEXT_PUBLIC_` variables to browser code. |
| Deployment/docs | PRD requires contract address, live URL, README, screenshots | Needs implementation | Final phase. |

---

## 5. Phase Overview

| Phase | Name | Goal | Risk Level | Depends On |
| --- | --- | --- | --- | --- |
| 0 | Repo Audit and Harness Setup | Inspect repo, create agent-legible docs, identify gaps | Medium | PRD |
| 1 | Project Foundation | Scaffold monorepo/workspaces and env examples | Medium | Phase 0 |
| 2 | Contract Test Plan First | Write Hardhat tests for core blockchain behavior | High | Phase 1 |
| 3 | Smart Contract Implementation | Implement `SurveyReward.sol` to satisfy tests | High | Phase 2 |
| 4 | Supabase Schema and Storage | Add schema and private storage policy docs | High | Phase 1 |
| 5 | API Architecture and Wallet Auth | Implement nonce/signature auth and session guard | High | Phases 1, 4 |
| 6 | KYC API and Admin Review | Implement KYC upload, status, signed URLs, approve/reject | High | Phases 3, 5 |
| 7 | Response Quality Gate and Proof API | Implement attempt, answer validation, hashing, proof signing | High | Phases 3, 5 |
| 8 | Web Wallet/Auth/Contract Foundation | Implement MetaMask, Sepolia guard, auth, contract hooks | Medium | Phases 3, 5 |
| 9 | KYC and Admin Review UI | Build respondent KYC and admin KYC review flow | Medium | Phases 6, 8 |
| 10 | Survey Creation and Feed UI | Build creator survey creation and respondent feed | Medium | Phases 3, 8 |
| 11 | Answer and Proof Transaction Flow | Build answer form, backend submit, on-chain proof submit | High | Phases 7, 8, 10 |
| 12 | Rewards and Admin Audit | Build rewards dashboard, claim, audit, flag, integrity verify | High | Phase 11 |
| 13 | Integration, Demo, and Agent Validation | Run full demo flow, fix mismatches, add QA notes | High | Phases 0-12 |
| 14 | Deployment and Documentation | Deploy Sepolia contract/web app and complete README | Medium | Phase 13 |
| 15 | Cleanup and Garbage Collection | Remove drift, stale docs, duplicate utilities, oversized files | Medium | Phase 14 |

---

## 6. Detailed Phases

## Phase 0: Repo Audit and Harness Setup

### Goal

Inspect the actual repository, create a lightweight agent harness, and make the repo legible before implementation.

### Scope

- Inspect repository structure.
- Confirm package manager.
- Confirm whether code already exists.
- Create or update `AGENTS.md`.
- Create `docs/index.md`.
- Create `docs/agent-harness.md`.
- Create active execution plan under `docs/execution-plans/active/`.
- Record open questions and mismatches.

### Out of Scope

- Do not implement product features.
- Do not change smart contract logic.
- Do not add API behavior.
- Do not change database schema yet unless creating docs-only files.

### Files or Areas to Inspect First

- Repo root
- `package.json`
- `pnpm-workspace.yaml`
- `contracts/`
- `web/`
- `supabase/`
- Existing `README.md`
- Existing `AGENTS.md`
- Existing docs

If exact files are unknown, run:

```powershell
Get-ChildItem -Force
Get-ChildItem -Recurse -Depth 2
```

### TDD / Test Plan

No feature tests yet. Add validation scripts only if package scripts already exist.

### Implementation Tasks

- [ ] Inspect repository root and record actual structure.
- [ ] Identify package manager and workspace layout.
- [ ] Create or update short `AGENTS.md` as a map, not a giant manual.
- [ ] Create `docs/index.md` linking to PRD, architecture, testing, security, demo, and active plans.
- [ ] Create `docs/agent-harness.md` explaining agent-first workflow and guardrails.
- [ ] Move or copy this plan to `docs/execution-plans/active/surveychain-implementation-plan.md`.
- [ ] Add a "Repo Audit Results" section to the active plan.
- [ ] Record any mismatch between PRD and actual repo.
- [ ] Do not proceed to feature work until audit is complete.

### Acceptance Criteria

- [ ] `AGENTS.md` exists and is concise.
- [ ] `docs/index.md` exists.
- [ ] Active implementation plan exists under `docs/execution-plans/active/`.
- [ ] Repo structure is documented.
- [ ] Package manager is documented.
- [ ] Open questions are listed.
- [ ] No product behavior was changed.

### Validation Commands

Examples only until repo scripts are verified:

```powershell
Get-ChildItem -Force
pnpm --version
git status --short
```

### Risks and Safeguards

Risk: Creating a giant `AGENTS.md` that crowds out task context.  
Safeguard: Keep it as a table of contents pointing to deeper docs.

Risk: Agent assumes repo structure from PRD.  
Safeguard: Inspect actual files and record evidence before editing.

---

## Phase 1: Project Foundation

### Goal

Create or align the monorepo foundation so contracts, Next.js web app, API route handlers, Supabase, docs, and tests have predictable locations.

### Scope

- Root workspace setup.
- Hardhat workspace.
- Next.js web app.
- Supabase folder.
- Env examples.
- Basic README.
- Basic scripts.
- Architecture map.

### Out of Scope

- No smart contract business logic yet.
- No API implementation yet.
- No web feature implementation yet.
- No deployment yet.

### Files or Areas to Inspect First

- Root `package.json`
- `pnpm-workspace.yaml`
- Existing web package
- Existing contract package
- `.gitignore`
- Existing `.env.example` files

### TDD / Test Plan

- Add smoke validation scripts if practical.
- Ensure empty/default tests can run.
- Ensure TypeScript compiles for scaffolded packages.

### Implementation Tasks

- [ ] Confirm or create root workspace.
- [ ] Confirm or create `contracts/` Hardhat TypeScript project.
- [ ] Confirm or create `web/` Next.js + TypeScript App Router project.
- [ ] Confirm or create `supabase/` folder.
- [ ] Add `.env.example` files for Next.js public and server-only environment variables.
- [ ] Add `.gitignore` entries for `.env`, build outputs, cache folders, and generated artifacts.
- [ ] Add root scripts for common validation if compatible with the workspace.
- [ ] Add `docs/architecture.md` with high-level module map.
- [ ] Add `docs/testing.md` with test strategy and commands.
- [ ] Update active plan with actual commands discovered.

### Acceptance Criteria

- [ ] Repo can install dependencies.
- [ ] Contract package can compile a placeholder/basic contract if scaffolded.
- [ ] Next.js web package can build the default app if scaffolded.
- [ ] Env examples are present and contain no real secrets.
- [ ] Docs link correctly from `docs/index.md`.
- [ ] No unsupported dependencies were added.

### Validation Commands

Examples:

```powershell
pnpm install
pnpm -r lint
pnpm -r typecheck
pnpm -r build
```

If scripts do not exist yet, document that and add only minimal scripts consistent with the repo.

### Risks and Safeguards

Risk: Server-only code leaks into client components.  
Safeguard: Keep Supabase service-role access, session verification, and proof signing inside `web/app/api/**/route.ts` or server-only libraries under `web/lib/`.

Risk: Overengineering the foundation.  
Safeguard: Keep scaffolding minimal and directly tied to the PRD.

---

## Phase 2: Contract Test Plan First

### Goal

Write Hardhat tests that define expected smart contract behavior before or alongside implementation.

### Scope

- Role tests.
- KYC verification tests.
- Survey creation tests.
- EIP-712 proof tests.
- Response submission tests.
- Reward claim tests.
- Close/refund tests.
- Pause/access-control tests.

### Out of Scope

- web tests.
- API tests.
- Supabase integration.
- Deployment scripts beyond test support.

### Files or Areas to Inspect First

- `contracts/package.json`
- `contracts/hardhat.config.ts`
- `contracts/contracts/`
- `contracts/test/`
- Existing test helpers

### TDD / Test Plan

Tests should initially fail if contract is missing or incomplete.

Unit/contract tests:

- Deployer receives roles.
- Admin can grant/revoke creator.
- User can request verification.
- Verifier/admin can approve/reject/revoke.
- Creator can create survey with exact ETH.
- Non-creator cannot create survey.
- Invalid survey params revert.
- Valid EIP-712 proof is accepted.
- Non-validator proof is rejected.
- Expired proof is rejected.
- Reused nonce is rejected.
- Duplicate response reverts.
- Unverified response reverts.
- Claimable reward is credited.
- Claim resets balance before transfer.
- Creator can close and withdraw unused funds.

### Implementation Tasks

- [ ] Inspect existing contract test setup.
- [ ] Add typed test fixtures for deployer, admin, creator, validator, respondent.
- [ ] Add helper for generating EIP-712 completion proof.
- [ ] Add role/access-control tests.
- [ ] Add verification status tests.
- [ ] Add survey creation tests.
- [ ] Add completion proof success/failure tests.
- [ ] Add reward accounting tests.
- [ ] Add close/refund tests.
- [ ] Run tests and confirm expected failures before contract implementation.

### Acceptance Criteria

- [ ] Contract test file exists.
- [ ] Tests cover PRD-required success paths.
- [ ] Tests cover PRD-required failure paths.
- [ ] EIP-712 test helper matches planned proof fields.
- [ ] Tests fail for missing/incomplete behavior before implementation.

### Validation Commands

```powershell
cd contracts
pnpm test
pnpm hardhat test
```

### Risks and Safeguards

Risk: EIP-712 fields mismatch backend later.  
Safeguard: Put exact typed-data fields in contract tests and document them in `docs/smart-contract.md`.

Risk: Reward accounting bug.  
Safeguard: Assert balances, escrow remaining, claimable rewards, total earned, and events.

---

## Phase 3: Smart Contract Implementation

### Goal

Implement `SurveyReward.sol` to satisfy contract tests and PRD blockchain requirements.

### Scope

- AccessControl roles.
- Verification request lifecycle.
- Creator role management.
- Survey creation with escrow.
- EIP-712 proof validation.
- Nonce/deadline replay protection.
- Response recording.
- Claimable reward accounting.
- Reward claim.
- Survey close.
- Unused reward withdrawal.
- Pause/unpause.

### Out of Scope

- Backend APIs.
- Web UI.
- Supabase schema.
- Deployment to Sepolia.

### Files or Areas to Inspect First

- `contracts/contracts/SurveyReward.sol`
- Existing contract files
- `contracts/test/SurveyReward.test.ts`
- `contracts/hardhat.config.ts`

### TDD / Test Plan

Use Phase 2 tests. Implement until tests pass.

### Implementation Tasks

- [ ] Implement OpenZeppelin imports.
- [ ] Implement roles.
- [ ] Implement enums and structs.
- [ ] Implement storage mappings.
- [ ] Implement events.
- [ ] Implement constructor with deployer roles.
- [ ] Implement verification request/approve/reject/revoke.
- [ ] Implement creator role grant/revoke.
- [ ] Implement survey creation and escrow validation.
- [ ] Implement EIP-712 completion proof hashing and signature recovery.
- [ ] Implement `submitResponseWithProof`.
- [ ] Implement claimable reward accounting.
- [ ] Implement `claimRewards`.
- [ ] Implement close and withdraw unused rewards.
- [ ] Implement view helpers.
- [ ] Implement pause/unpause.
- [ ] Run full contract tests.
- [ ] Document final contract interface in `docs/smart-contract.md`.

### Acceptance Criteria

- [ ] All contract tests pass.
- [ ] Invalid proofs cannot credit rewards.
- [ ] Reused nonces cannot credit rewards.
- [ ] Unverified respondents cannot submit.
- [ ] Duplicate submissions cannot happen.
- [ ] Rewards become claimable after valid proof submission.
- [ ] Claim transfers ETH and resets claimable balance.
- [ ] Contract does not store raw KYC or raw answers.
- [ ] Contract behavior matches documented interface.

### Validation Commands

```powershell
cd contracts
pnpm hardhat compile
pnpm hardhat test
```

### Risks and Safeguards

Risk: Contract stores too much sensitive information.  
Safeguard: Store only hashes, wallet addresses, reward state, and statuses.

Risk: Reentrancy in claim/withdraw.  
Safeguard: Use checks-effects-interactions and `nonReentrant`.

---

## Phase 4: Supabase Schema and Storage

### Goal

Create the database schema and storage policy files required by wallet auth, KYC, answer validation, proof tracking, audit logs, and admin review.

### Scope

- `supabase/schema.sql`
- `supabase/storage-policies.sql`
- Tables:
  - `kyc_requests`
  - `survey_attempts`
  - `survey_answers`
  - `survey_quality_rules`
  - `auth_nonces`
  - `audit_logs`
- Private bucket plan for `kyc-documents`.

### Out of Scope

- API route implementation.
- Web implementation.
- Live Supabase setup unless explicitly running deployment commands.

### Files or Areas to Inspect First

- `supabase/`
- Existing migrations
- Existing SQL files
- Existing README setup notes

### TDD / Test Plan

If a local Supabase test environment exists:

- Apply schema.
- Verify tables exist.
- Verify indexes exist.
- Verify duplicate constraints behave as expected.

If no local DB exists:

- Add schema review checklist to docs.

### Implementation Tasks

- [ ] Inspect existing Supabase folder.
- [ ] Add or update `supabase/schema.sql`.
- [ ] Add tables from PRD.
- [ ] Add unique indexes for approved wallet and image hashes.
- [ ] Add unique reward-eligible response index.
- [ ] Add comments for append-only answer policy.
- [ ] Add `supabase/storage-policies.sql`.
- [ ] Document private `kyc-documents` bucket.
- [ ] Document service-role-only access pattern.
- [ ] Update `docs/supabase-schema.md`.

### Acceptance Criteria

- [ ] Schema includes required tables.
- [ ] Indexes enforce duplicate prevention where required.
- [ ] KYC images are intended for private storage only.
- [ ] Service role key is never exposed to browser.
- [ ] Original answers are append-only by policy.
- [ ] Schema docs are updated.

### Validation Commands

Examples:

```powershell
Get-Content .\supabase\schema.sql
Get-Content .\supabase\storage-policies.sql
```

If Supabase CLI is configured:

```powershell
supabase db reset
```

### Risks and Safeguards

Risk: Unique indexes fail on existing duplicate data.  
Safeguard: If existing data exists, use migrations and inspect duplicates first.

Risk: Public KYC image exposure.  
Safeguard: Private bucket only, signed URLs only, short expiration.

---

## Phase 5: API Architecture and Wallet Auth

### Goal

Implement wallet-signature authentication so protected API routes do not trust client-provided wallet addresses.

### Scope

- API architecture decision.
- Auth nonce route.
- Auth verify route.
- Logout route.
- Me route.
- Session/JWT utilities.
- Wallet address validation.
- Nonce expiration and reuse protection.
- Auth middleware/helper.

### Out of Scope

- KYC upload.
- Answer validation.
- Admin dashboards.
- Contract writes from backend.

### Files or Areas to Inspect First

- `web/app/api/`
- Existing API route structure
- `web/`
- Existing auth utilities
- `package.json`
- Env handling

### TDD / Test Plan

- Test nonce creation.
- Test valid signature verification.
- Test invalid signature rejection.
- Test expired nonce rejection.
- Test used nonce rejection.
- Test unauthenticated `me`.

### Implementation Tasks

- [ ] Decide and document API route hosting pattern.
- [ ] Add auth utility for nonce generation.
- [ ] Add message format for wallet login.
- [ ] Add signature verification using ethers.js.
- [ ] Add session/JWT creation using `SESSION_SECRET`.
- [ ] Add session read/verify helper.
- [ ] Implement `POST /api/auth/nonce`.
- [ ] Implement `POST /api/auth/verify`.
- [ ] Implement `POST /api/auth/logout`.
- [ ] Implement `GET /api/auth/me`.
- [ ] Add audit log for login if practical.
- [ ] Update `docs/api-contracts.md`.

### Acceptance Criteria

- [ ] Backend verifies wallet signatures.
- [ ] Used nonce cannot be reused.
- [ ] Expired nonce cannot be used.
- [ ] API routes do not trust wallet address alone.
- [ ] Session wallet is the source of identity.
- [ ] No service role key is exposed to browser code.
- [ ] Auth API docs are updated.

### Validation Commands

Examples:

```powershell
cd web
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

### Risks and Safeguards

Risk: Treating wallet address in request body as identity.  
Safeguard: Always derive identity from verified session.

Risk: Auth logic is accidentally implemented in client-side code.  
Safeguard: Implement nonce verification, session creation, and role checks only in Next.js Route Handlers or server-only utilities.

---

## Phase 6: KYC API and Admin Review

### Goal

Implement demo KYC submission, private file upload, signed admin image review URLs, and approval/rejection workflow.

### Scope

- KYC submit API.
- KYC status API.
- Admin KYC list API.
- Admin signed URL API.
- Admin approve/reject API.
- File type/size validation.
- Image hashing.
- KYC proof hash.
- Audit logs.
- Contract status coordination notes.

### Out of Scope

- Production KYC.
- Real government ID validation.
- OCR/liveness/face matching.
- Raw image on-chain storage.
- Public image URLs.

### Files or Areas to Inspect First

- API route folder
- Supabase client utilities
- Auth middleware
- Contract ABI utilities
- Env config

### TDD / Test Plan

- Test unauthenticated KYC rejection.
- Test invalid file type rejection.
- Test KYC row creation.
- Test duplicate exact file hash behavior where practical.
- Test admin-only signed URL access.
- Test non-admin rejection.
- Test approval/rejection status updates.

### Implementation Tasks

- [ ] Add server-only Supabase service client.
- [ ] Add file validation utility.
- [ ] Add SHA-256 file hashing utility.
- [ ] Add KYC proof hash utility.
- [ ] Implement `POST /api/kyc/submit`.
- [ ] Implement `GET /api/kyc/status`.
- [ ] Implement `GET /api/admin/kyc-requests`.
- [ ] Implement `POST /api/admin/kyc/:id/signed-urls`.
- [ ] Implement `POST /api/admin/kyc/:id/approve`.
- [ ] Implement `POST /api/admin/kyc/:id/reject`.
- [ ] Add audit logs for submit/approve/reject.
- [ ] Document demo-only KYC safety rule.
- [ ] Update API contract docs.

### Acceptance Criteria

- [ ] KYC files upload only to private storage.
- [ ] KYC paths use request UUIDs, not wallet addresses.
- [ ] Signed URLs are admin-only and short-lived.
- [ ] Duplicate exact images are blocked by hash constraints.
- [ ] KYC proof hash is generated and stored.
- [ ] Admin actions are logged.
- [ ] UI/API copy does not ask for real IDs in classroom demo.

### Validation Commands

```powershell
cd web
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

### Risks and Safeguards

Risk: Students upload real IDs.  
Safeguard: Add visible demo-only dummy ID warning in UI and docs.

Risk: KYC images become public.  
Safeguard: Private bucket only and signed URLs only.

---

## Phase 7: Response Quality Gate and Proof API

### Goal

Implement the off-chain validation system that decides whether to sign a completion proof.

### Scope

- Start attempt route.
- Submit answer route.
- Refresh expired proof route.
- Mark on-chain confirmed route.
- My answers route.
- Admin answer list route.
- Flag/audit note routes.
- Verify integrity route.
- Hard-fail checks.
- Score-based checks.
- Answer normalization.
- Salted answer hash.
- EIP-712 proof signing.

### Out of Scope

- Web answer UI.
- Smart contract changes unless tests reveal mismatch.
- CAPTCHA if deferred.
- Production bot detection.

### Files or Areas to Inspect First

- Auth helper
- Supabase client
- Contract ABI/config
- Existing validation utilities
- API route structure
- `docs/smart-contract.md`

### TDD / Test Plan

- Required fields pass/fail.
- Invalid option fails.
- Attention check fails.
- Minimum completion time fails.
- Duplicate submission fails.
- Unverified wallet fails.
- Valid response returns proof.
- Failed response returns no signature.
- Answer hash is deterministic for normalized input + salt.
- Refresh proof keeps same answer hash.
- Integrity verification compares stored and on-chain hash.

### Implementation Tasks

- [ ] Implement answer normalization utility.
- [ ] Implement salted answer hash utility.
- [ ] Implement quality gate hard-fail checks.
- [ ] Implement score-based deductions.
- [ ] Implement EIP-712 typed data builder.
- [ ] Implement validator signing using `VALIDATOR_PRIVATE_KEY`.
- [ ] Implement `POST /api/surveys/:surveyId/start-attempt`.
- [ ] Implement `POST /api/answers/submit`.
- [ ] Implement failed validation storage with no signature.
- [ ] Implement passed validation storage with proof metadata.
- [ ] Implement `POST /api/answers/:id/refresh-proof`.
- [ ] Implement `POST /api/answers/:id/mark-onchain-confirmed`.
- [ ] Implement `GET /api/answers/my`.
- [ ] Implement admin answer/audit routes.
- [ ] Implement integrity verification route.
- [ ] Update docs for response state machine.

### Acceptance Criteria

- [ ] Failed validation never returns a signature.
- [ ] Passed validation returns answerHash, rewardAmount, nonce, deadline, signature.
- [ ] Backend signs only for authenticated session wallet.
- [ ] Duplicate reward-eligible response is blocked.
- [ ] Original answers are append-only.
- [ ] Refresh proof does not create a new answer.
- [ ] EIP-712 fields match contract tests.
- [ ] Admin can flag/note without mutating original answer content.

### Validation Commands

```powershell
cd web
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

### Risks and Safeguards

Risk: Backend signs proof for wrong wallet.  
Safeguard: Use session wallet only, not request body wallet.

Risk: Contract and backend proof mismatch.  
Safeguard: Share documented typed data and add tests.

---

## Phase 8: Web Wallet/Auth/Contract Foundation

### Goal

Build the web app foundation for wallet connection, Sepolia network guard, wallet signature login, contract reads/writes, and transaction status.

### Scope

- Wallet connection.
- Sepolia guard.
- Auth signature flow.
- Contract hook.
- Rewards/verification basic reads.
- Transaction status component.
- Layout.

### Out of Scope

- KYC form.
- Survey form.
- Answer form.
- Admin dashboards.

### Files or Areas to Inspect First

- `web/app/page.tsx`
- `web/app/layout.tsx`
- `web/components/`
- `web/hooks/`
- Existing styles
- Existing env usage

### TDD / Test Plan

- Component tests where practical.
- Manual MetaMask tests for wallet and network.
- Typecheck contract hook inputs/outputs.

### Implementation Tasks

- [ ] Implement `useWallet`.
- [ ] Implement `useNetwork`.
- [ ] Implement `useWalletAuth`.
- [ ] Implement `useSurveyContract`.
- [ ] Implement `ConnectWalletButton`.
- [ ] Implement `NetworkGuard`.
- [ ] Implement `AuthSignatureButton`.
- [ ] Implement `TransactionStatus`.
- [ ] Add basic layout.
- [ ] Add env validation for contract address and chain ID.
- [ ] Update web app map docs.

### Acceptance Criteria

- [ ] User can connect MetaMask.
- [ ] App detects wrong network.
- [ ] User can request nonce and sign login message.
- [ ] Auth session can be checked via `/api/auth/me`.
- [ ] Contract hooks use configured address and Sepolia chain ID.
- [ ] Missing env values fail clearly.

### Validation Commands

```powershell
cd web
pnpm lint
pnpm typecheck
pnpm build
```

### Risks and Safeguards

Risk: Browser code treats connected wallet as authenticated.  
Safeguard: Separate wallet connection from signed auth session.

---

## Phase 9: KYC and Admin Review UI

### Goal

Build UI for respondent KYC request and admin KYC review.

### Scope

- KYC upload form.
- Verification status display.
- On-chain `requestVerification`.
- Admin KYC review panel.
- Signed URL image preview.
- Admin approve/reject.
- Verified Respondent Pass UI.

### Out of Scope

- Response answering.
- Survey creation.
- Rewards dashboard.

### Files or Areas to Inspect First

- KYC API routes
- Contract hook
- Existing component patterns
- Routing/navigation pattern

### TDD / Test Plan

- Manual test KYC submit with dummy images.
- Manual admin signed URL preview.
- Manual approve/reject flow.
- Component tests for status rendering if practical.

### Implementation Tasks

- [ ] Implement `KycUploadForm`.
- [ ] Add dummy-ID-only warning.
- [ ] Call KYC submit API.
- [ ] Trigger on-chain `requestVerification(kycProofHash)` if required by flow.
- [ ] Implement `VerifiedRespondentPassStatus`.
- [ ] Implement `KycReviewPanel`.
- [ ] Implement signed URL preview.
- [ ] Implement admin approve/reject actions.
- [ ] Update demo script with KYC flow.

### Acceptance Criteria

- [ ] Respondent can submit dummy ID/selfie.
- [ ] KYC status displays pending/approved/rejected/revoked.
- [ ] Admin can view images only via signed URLs.
- [ ] Admin can approve/reject.
- [ ] Approved wallet shows verified pass.
- [ ] UI does not imply real production KYC.

### Validation Commands

```powershell
cd web
pnpm lint
pnpm typecheck
pnpm build
```

### Risks and Safeguards

Risk: Admin UI exposes images permanently.  
Safeguard: Use signed URLs and avoid logging URLs.

---

## Phase 10: Survey Creation and Feed UI

### Goal

Build creator survey creation and respondent survey feed.

### Scope

- Create survey form.
- Quality rules form.
- Survey feed.
- Survey card.
- Funded reward pool display.
- Creator role guard.

### Out of Scope

- Answer submission.
- Proof transaction.
- Reward claiming.

### Files or Areas to Inspect First

- Contract createSurvey function
- Survey API routes
- Web contract hook
- Existing form patterns

### TDD / Test Plan

- Manual create survey with exact ETH.
- Manual reject insufficient deposit.
- Manual feed shows active surveys.
- Component tests for deposit preview if practical.

### Implementation Tasks

- [ ] Implement `CreateSurveyForm`.
- [ ] Implement `QualityRulesForm`.
- [ ] Implement deposit preview.
- [ ] Call contract `createSurvey`.
- [ ] Store or fetch quality rules depending on API design.
- [ ] Implement `SurveyCard`.
- [ ] Implement survey feed.
- [ ] Show reward per response, max responses, response count, escrow state.
- [ ] Update docs with survey creation flow.

### Acceptance Criteria

- [ ] Creator/admin can create funded survey.
- [ ] Non-creator is blocked or shown clear message.
- [ ] Deposit equals reward per response times max responses.
- [ ] Survey appears in feed.
- [ ] Quality rules are stored or clearly deferred.

### Validation Commands

```powershell
cd web
pnpm lint
pnpm typecheck
pnpm build
```

### Risks and Safeguards

Risk: Contract stores too much text and gas is high.  
Safeguard: MVP may store text on-chain as PRD allows, but document production alternative.

---

## Phase 11: Answer and Proof Transaction Flow

### Goal

Build the respondent flow from survey attempt to backend validation to on-chain proof submission.

### Scope

- Start attempt.
- Answer survey form.
- Attention check.
- Honeypot field.
- Submit answer to backend.
- Show validation result.
- Submit proof on-chain.
- Handle MetaMask cancellation.
- Handle expired proof.
- Handle failed on-chain transaction.
- Mark confirmed.

### Out of Scope

- Full admin audit.
- Reward dashboard claim UI.
- CAPTCHA if deferred.

### Files or Areas to Inspect First

- Answer API routes
- Contract submit function
- Response state machine docs
- Existing transaction status component

### TDD / Test Plan

- Manual valid answer flow.
- Manual failed attention check.
- Manual too-fast completion.
- Manual duplicate submission.
- Manual cancel MetaMask transaction.
- Manual refresh expired proof if implemented.

### Implementation Tasks

- [ ] Implement `AnswerSurveyForm`.
- [ ] Call start-attempt route when opening survey.
- [ ] Render questions and attention check.
- [ ] Include hidden honeypot field.
- [ ] Submit answer to backend.
- [ ] Implement `ResponseQualityResult`.
- [ ] Implement `CompletionProofSubmitter`.
- [ ] Call `submitResponseWithProof`.
- [ ] Mark answer on-chain confirmed after transaction.
- [ ] Display failed validation without reward path.
- [ ] Display pending-onchain recovery if transaction is canceled.
- [ ] Update demo script.

### Acceptance Criteria

- [ ] Valid answer receives proof.
- [ ] Failed answer receives no proof.
- [ ] Valid proof transaction credits claimable reward.
- [ ] User cancellation leaves answer pending on-chain.
- [ ] Duplicate submission is blocked.
- [ ] UI clearly explains each state.

### Validation Commands

```powershell
cd web
pnpm lint
pnpm typecheck
pnpm build
```

### Risks and Safeguards

Risk: User thinks off-chain submission equals reward.  
Safeguard: UI must clearly show "Complete Reward Transaction" before reward is claimable.

---

## Phase 12: Rewards and Admin Audit

### Goal

Build final respondent reward dashboard and admin audit tools.

### Scope

- Reward dashboard.
- Claim rewards button.
- Completed/pending/failed responses.
- Admin response audit panel.
- Flag response.
- Add audit notes.
- Verify Answer Integrity button.
- Creator/admin management if feasible.

### Out of Scope

- Reward clawback.
- Editing original answers.
- Real-money support.
- Production analytics.

### Files or Areas to Inspect First

- Answer API routes
- Contract read functions
- Contract claim function
- Admin API routes
- Existing dashboard components

### TDD / Test Plan

- Manual claim reward.
- Manual zero-claim error.
- Manual admin flag.
- Manual audit note.
- Manual verify integrity success.
- Simulated integrity mismatch if practical.

### Implementation Tasks

- [ ] Implement `RewardDashboard`.
- [ ] Show claimable rewards and total earned.
- [ ] Implement claim button.
- [ ] Show pending/completed/failed answers.
- [ ] Implement `ResponseAuditPanel`.
- [ ] Implement flag response action.
- [ ] Implement audit note action.
- [ ] Implement `AnswerIntegrityVerifier`.
- [ ] Compare off-chain recomputed hash with on-chain hash.
- [ ] Update README/demo docs.

### Acceptance Criteria

- [ ] Respondent can claim reward.
- [ ] Claimable balance resets after claim.
- [ ] Admin can view validation score/reason/details.
- [ ] Admin can flag without clawing back MVP rewards.
- [ ] Admin can add audit notes.
- [ ] Integrity verification works.
- [ ] Original answer content is not editable.

### Validation Commands

```powershell
cd web
pnpm lint
pnpm typecheck
pnpm build
```

### Risks and Safeguards

Risk: Admin flag implies reward reversal.  
Safeguard: UI copy must state flagging affects future trust only in MVP.

---

## Phase 13: Integration, Demo, and Agent Validation

### Goal

Validate the full dApp flow end-to-end and make failures visible to agents and humans.

### Scope

- End-to-end demo flow.
- Manual QA notes.
- Contract tests.
- web build.
- API route smoke checks.
- README setup verification.
- Screenshots if required.

### Out of Scope

- New features.
- Broad refactors.
- Mainnet deployment.

### Files or Areas to Inspect First

- `README.md`
- `docs/demo-script.md`
- Active plan
- Test files
- Env examples

### TDD / Test Plan

Full manual test:

1. Connect MetaMask.
2. Switch to Sepolia.
3. Sign wallet login.
4. Admin grants creator role or uses admin wallet.
5. Creator creates funded survey.
6. Respondent submits dummy KYC.
7. Admin reviews signed URLs.
8. Admin approves respondent on-chain.
9. Respondent answers survey.
10. Backend validates response.
11. Backend signs proof.
12. Respondent submits proof on-chain.
13. Contract credits claimable reward.
14. Respondent claims reward.
15. Duplicate answer is blocked.
16. Failed validation example is shown.
17. Admin audit panel works.
18. Answer integrity verification works.

### Implementation Tasks

- [ ] Run all contract tests.
- [ ] Run web lint/typecheck/build.
- [ ] Run API tests if available.
- [ ] Complete manual demo flow.
- [ ] Record QA notes in `docs/demo-script.md`.
- [ ] Fix only phase-relevant bugs.
- [ ] Document any known limitation.
- [ ] Update active plan with final status.

### Acceptance Criteria

- [ ] Full minimum defensible MVP works.
- [ ] Contract tests pass.
- [ ] web build passes.
- [ ] Demo script is verified.
- [ ] Known limitations are documented honestly.
- [ ] No unrelated changes are present.

### Validation Commands

```powershell
pnpm -r lint
pnpm -r typecheck
pnpm -r build

cd contracts
pnpm hardhat test
```

### Risks and Safeguards

Risk: Demo fails due to missing Sepolia ETH or env.  
Safeguard: README must include faucet/setup steps and env checklist.

---

## Phase 14: Deployment and Documentation

### Goal

Deploy the contract and Next.js web app, then update documentation for final submission.

### Scope

- Sepolia contract deployment.
- Contract address recording.
- Etherscan link.
- Next.js web app deployment.
- Supabase setup notes.
- README completion.
- Screenshots.
- Group contribution section.
- Final demo flow.

### Out of Scope

- Mainnet.
- Real-money configuration.
- Production KYC claims.

### Files or Areas to Inspect First

- Deployment scripts
- `.env.example`
- README
- Vercel project settings
- Supabase docs

### TDD / Test Plan

- Verify deployed contract address.
- Verify the web app points to the correct contract.
- Verify live app can connect wallet.
- Verify at least one demo flow on deployed environment if feasible.

### Implementation Tasks

- [ ] Deploy contract to Sepolia.
- [ ] Save contract address.
- [ ] Save Etherscan link.
- [ ] Update web env.
- [ ] Deploy the Next.js web app.
- [ ] Save live URL.
- [ ] Update README sections.
- [ ] Add screenshots.
- [ ] Add known limitations.
- [ ] Add final defense positioning.
- [ ] Move completed plan to `docs/execution-plans/completed/` after completion.

### Acceptance Criteria

- [ ] Sepolia contract is deployed.
- [ ] Live web app URL is documented.
- [ ] README includes setup, test, deploy, demo, KYC privacy, proof, integrity, and limitations sections.
- [ ] No real secrets are committed.
- [ ] Final demo instructions are clear.

### Validation Commands

Examples:

```powershell
cd contracts
pnpm hardhat run .\scripts\deploy.ts --network sepolia

cd ..\web
pnpm build
```

### Risks and Safeguards

Risk: Wrong contract address in the web app.  
Safeguard: Display chain ID and contract address in a debug/admin section during demo.

---

## Phase 15: Cleanup and Garbage Collection

### Goal

Reduce drift, stale docs, duplicated code, missing tests, and agent-unfriendly structure after MVP.

### Scope

- Stale documentation scan.
- Duplicate utility scan.
- Oversized file scan.
- Missing tests list.
- TODO/FIXME audit.
- Security checklist.
- Agent review prompt updates.

### Out of Scope

- New major features.
- Broad rewrites.
- New dependencies unless justified.

### Files or Areas to Inspect First

- `docs/`
- `AGENTS.md`
- `README.md`
- `web/`
- `contracts/`
- `supabase/`

### TDD / Test Plan

- Ensure cleanup does not change behavior.
- Run full validation after cleanup.

### Implementation Tasks

- [ ] Search for stale references and outdated route names.
- [ ] Search for duplicate utilities.
- [ ] Search for TODO/FIXME comments.
- [ ] Check large files that should be split.
- [ ] Check missing docs for APIs/contracts.
- [ ] Check docs match current code behavior.
- [ ] Add or update tests for discovered gaps.
- [ ] Move completed plan to completed folder.
- [ ] Add follow-up tech debt list if necessary.

### Acceptance Criteria

- [ ] Docs match implemented behavior.
- [ ] No obvious duplicate utilities remain.
- [ ] No stale route names remain.
- [ ] Remaining TODOs are documented.
- [ ] Validation commands pass.
- [ ] Future agents have clear repo map.

### Validation Commands

```powershell
Select-String -Path .\**\* -Pattern "TODO","FIXME" -ErrorAction SilentlyContinue
pnpm -r lint
pnpm -r typecheck
pnpm -r build
```

### Risks and Safeguards

Risk: Cleanup becomes a broad rewrite.  
Safeguard: Make small, targeted changes only.

---

## 7. Cross-Phase Testing Strategy

### Unit tests

Prioritize unit tests for:

- Contract role permissions
- Contract proof verification
- Contract reward accounting
- Contract claim behavior
- Answer normalization
- Answer hashing
- Response Quality Gate hard-fail checks
- Completion Proof typed data generation
- Wallet signature verification
- KYC proof hash generation

### Integration tests

Add integration tests when practical for:

- Auth nonce + verify flow
- Start attempt + submit answer flow
- Passed validation + signed proof generation
- Failed validation returns no signature
- Refresh proof for pending answer
- Mark on-chain confirmed
- Admin KYC signed URL flow
- Admin audit actions

### E2E or manual tests

At minimum, manually verify:

- Wallet connect
- Sepolia guard
- Wallet signature login
- Creator creates funded survey
- Respondent submits KYC
- Admin approves KYC
- Respondent answers survey
- Backend validates answer
- Backend signs proof
- Respondent submits proof on-chain
- Claimable reward appears
- Respondent claims reward
- Duplicate answer is blocked
- Failed validation case is shown
- Admin audit panel works
- Answer Integrity verification works

### Regression tests

Add regression tests for any fixed bugs involving:

- EIP-712 field mismatch
- Replay protection
- Duplicate submission
- Survey full race
- Claim reset before transfer
- Expired proof refresh
- Answer hash normalization
- Auth nonce reuse

### Error-path tests

Cover these errors:

- Missing MetaMask
- Wrong network
- Signature rejected
- Expired auth nonce
- Used auth nonce
- Invalid wallet address
- Unauthenticated API request
- Non-admin admin route access
- Unverified respondent
- Failed attention check
- Too-fast completion
- Invalid option
- Duplicate response
- Expired completion proof
- Reused proof nonce
- Non-validator proof signature
- Zero claimable reward
- Failed on-chain transaction

### Data migration and backward compatibility checks

If the schema is already deployed or has existing data:

- Do not drop tables without explicit approval.
- Add migrations rather than replacing schema.
- Preserve existing KYC and answer records.
- Verify indexes do not fail due to existing duplicate data.
- Document migration risks and rollback steps.

If this is a new project:

- `supabase/schema.sql` can be treated as the initial schema.

---

## 8. Definition of Done

- [x] Phase 0 repo audit completed.
- [x] Phase 1 project foundation completed.
- [x] Phase 2 contract tests completed.
- [x] Phase 3 smart contract implementation completed.
- [x] Phase 4 Supabase schema/storage completed.
- [x] Phase 5 wallet auth API completed.
- [x] Phase 6 KYC API completed.
- [x] Phase 7 Response Quality Gate and proof API completed.
- [ ] Phase 8 web wallet/auth/contract foundation completed.
- [ ] Phase 9 KYC/admin review UI completed.
- [ ] Phase 10 survey creation/feed UI completed.
- [ ] Phase 11 answer/proof transaction flow completed.
- [ ] Phase 12 rewards/admin audit completed.
- [ ] Phase 13 integration testing completed.
- [ ] Phase 14 deployment/documentation completed.
- [ ] Phase 15 cleanup completed or deferred with documented tech debt.
- [ ] All phase acceptance criteria are met.
- [x] Hardhat contract tests pass.
- [x] API tests pass where available.
- [x] Web lint passes.
- [x] Web typecheck passes.
- [x] web build passes.
- [ ] No unrelated changes were introduced.
- [ ] No real secrets are committed.
- [ ] `.env.example` files are complete.
- [x] README is updated.
- [ ] Demo script is verified.
- [ ] Manual QA notes are added for behavior not covered by automation.
- [ ] No unsupported assumptions remain unresolved.

---

## 9. AI Agent Guardrails

The AI coding agent must follow these guardrails:

- Do not edit files before inspecting them.
- Do not make broad rewrites.
- Do not introduce new dependencies without explicit approval or verified project need.
- Do not modify generated files unless the project workflow requires it.
- Do not change database schema outside schema-specific phases.
- Do not change smart contract reward behavior outside smart contract phases.
- Do not change auth, authorization, payment/reward, privacy, or compliance behavior unless in scope.
- Do not store raw KYC images or raw survey answers on-chain.
- Do not expose Supabase service role keys to browser code.
- Do not trust client-provided wallet addresses without wallet-signature session verification.
- Do not create public KYC image URLs.
- Do not claim production KYC, AML, or legal compliance.
- Do not implement real-money or mainnet behavior.
- Do not silently invent APIs, DTOs, database fields, routes, contract methods, or UI pages.
- If implementation requires a decision not covered by this plan, pause and document the decision point.
- If actual code contradicts this plan, document the mismatch before changing scope.
- Keep each phase independently reviewable.
- After each phase, summarize:
  - What changed
  - What was verified
  - What remains
  - Any risks or open questions

---

## 10. Suggested Agent Workflow Per Phase

For every phase, follow this repeatable workflow:

1. Re-read this phase.
2. Re-read the relevant PRD sections.
3. Inspect the referenced files.
4. Confirm current behavior.
5. Identify existing patterns and naming conventions.
6. Write or update tests.
7. Run tests and confirm expected failures when practical.
8. Implement the smallest safe change.
9. Re-run tests.
10. Run lint.
11. Run typecheck.
12. Run build.
13. Update documentation or implementation notes.
14. Summarize completed work before moving to the next phase.

Use this short checklist at the start of each phase:

```txt
Before editing:
- What files did I inspect?
- What behavior is already implemented?
- What behavior is missing?
- What assumptions am I making?
- Is this phase allowed to touch this file?
- What tests will protect the change?
```

Use this short checklist at the end of each phase:

```txt
Before moving on:
- What changed?
- What tests were added or updated?
- What commands passed?
- What commands failed?
- What assumptions were resolved?
- What risks remain?
- Are there any unrelated changes to revert?
```

---

## 11. Final Notes

This implementation plan is grounded in the SurveyChain Rewards PRD. It does not verify an existing repository because no codebase was provided with the PRD. Therefore, Phase 0 is mandatory before making changes.

The harness-engineering adaptation means this project should not depend on one giant prompt. Instead, the repo should contain:

- A short `AGENTS.md` map
- A structured `docs/` folder
- Active and completed execution plans
- Architecture and API docs
- Test and validation commands
- Demo scripts
- Clear guardrails for security, privacy, and reward logic

The most important technical risks are:

- EIP-712 proof mismatch between backend and smart contract
- Reward accounting bugs
- Replay protection bugs
- Exposing Supabase service role keys
- Exposing private KYC images
- Treating client-provided wallet address as authenticated identity
- Allowing duplicate submissions
- Mutating original answer records
- Claiming production KYC or real-money behavior

The minimum defensible MVP should prioritize this flow:

```txt
Admin/creator creates a funded survey.
Respondent completes demo KYC.
Admin approves respondent on-chain.
Respondent answers survey.
Backend checks:
  - KYC-approved wallet
  - not duplicate
  - required fields
  - valid options
  - attention check
  - minimum completion time
Backend stores answer and signs completion proof.
Respondent submits proof on-chain.
Contract credits claimable Sepolia ETH.
Respondent claims reward.
Admin can view validation result and answer hash.
```

Optional but strong additions after MVP:

```txt
- CAPTCHA
- Honeypot field
- Text quality scoring
- Straight-lining detection
- Refresh expired proof
- Verify Answer Integrity button
- Admin audit notes
```


---

## 12. Repo Audit Results

- Workspace inspected: `D:\projects\blockchain-finals`
- Initial root listing count: `0` items (empty directory)
- Required files (`AGENTS.md`, `PRD.md`, active plan) were not initially present in repo
- Phase 0 actions completed:
  - Copied `PRD.md` into repository root
  - Added `AGENTS.md`
  - Added `docs/index.md`
  - Added `docs/agent-harness.md`
  - Added `docs/execution-plans/active/surveychain-implementation-plan.md`
  - Added `docs/execution-plans/completed/`
- Product code directories are still missing and intentionally not scaffolded in Phase 0:
  - `web/`
  - `contracts/`
  - `supabase/`
  - root `package.json`
  - `pnpm-workspace.yaml`

### Open Questions Carried Forward

- Should project scaffold be created in Phase 1 from scratch in this repository?
- Is there an existing codebase to import that already contains `web/`, `contracts/`, and `supabase/`?

## 13. Phase 1 Results

- Phase 1 scaffold was created in this repository from scratch.
- Workspace and packages added:
  - root `package.json`
  - `pnpm-workspace.yaml`
  - `web/` Next.js + TypeScript scaffold
  - `contracts/` Hardhat + TypeScript scaffold
  - `supabase/` placeholders
- Environment examples added:
  - `web/.env.example`
  - `contracts/.env.example`
- Phase 1 docs added or updated:
  - `README.md`
  - `docs/architecture.md`
  - `docs/testing.md`
  - `docs/index.md`
- Scope guard:
  - No product features, APIs, schema logic, or contract business logic were implemented.

### Phase 1 Validation Commands (Actual)

From repo root:

```powershell
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Package-level checks:

```powershell
cd web
pnpm lint
pnpm typecheck
pnpm build

cd ..\contracts
pnpm build
pnpm test
```

### Open Questions Updated

- The scaffold question is resolved: project foundation is now created in this repository.
- Remaining: confirm whether any upstream starter code should be imported before Phase 2.

## 14. Phase 2 Results

- Contract-first test plan is implemented in:
  - `contracts/test/SurveyReward.test.ts`
- Coverage includes:
  - role/access checks
  - verification lifecycle
  - survey creation validation and escrow checks
  - EIP-712 completion proof success/rejection paths
  - claim/close/refund/pause flows
- Validation evidence:
  - `pnpm test` passes for contract suite (`11 passing`).

## 15. Phase 3 Results

- Smart contract implementation completed at:
  - `contracts/contracts/SurveyReward.sol`
- Implemented features include:
  - role-based access (`ADMIN_ROLE`, `CREATOR_ROLE`, `VERIFIER_ROLE`, `VALIDATOR_ROLE`)
  - verification request/approve/reject/revoke
  - survey escrow creation and accounting
  - EIP-712 completion proof verification
  - replay protection via used proof nonce tracking
  - duplicate response protection
  - reward accrual and `claimRewards()`
  - close survey and withdraw unused escrow
  - pause/unpause controls
- Validation evidence:
  - `pnpm build` and `pnpm test` pass in workspace.

## 16. Phase 5 Results

- Wallet-auth API architecture implemented under `web/app/api/auth/`:
  - `POST /api/auth/nonce`
  - `POST /api/auth/verify`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Server-only auth utilities implemented under `web/lib/auth/`:
  - nonce store, wallet signature verification, session token creation/verification, session guard
- Security posture implemented:
  - APIs derive identity from signed session cookie
  - nonce reuse blocked
  - invalid wallet/nonce/signature rejected
- Validation evidence:
  - web route and auth tests pass under `web/tests/`.

## 17. Phase 7 Results

- Response quality gate and proof routes implemented:
  - `POST /api/surveys/[surveyId]/start-attempt`
  - `POST /api/answers/submit`
  - `POST /api/answers/[id]/refresh-proof`
  - `POST /api/answers/[id]/mark-onchain-confirmed`
  - `GET /api/answers/my`
- Supporting server libraries implemented:
  - `web/lib/answers/quality-gate.ts`
  - `web/lib/answers/proof.ts`
  - `web/lib/answers/data-store.ts`
  - `web/lib/blockchain/verification.ts`
- Behavior implemented:
  - attempt ownership checks
  - duplicate submission blocking
  - verified-wallet requirement before reward-eligible submit
  - quality gate scoring and fail/pass branching
  - answer normalization + salted hash
  - EIP-712 proof signing only for passed validation
  - proof refresh and manual on-chain confirmation marker
- Validation evidence:
  - Phase 7 test suites pass (`phase7-routes*.test.ts`).

## 18. Drift Audit and Current Gaps

- Completed phases recorded in code: `0`, `1`, `2`, `3`, `5`, `7`.
- Documented but not yet completed in this run:
  - Phase 4 (Supabase schema/storage implementation)
  - Phase 6 (KYC API and admin review)
  - UI and integration/deployment phases (8+)
- Documentation sync completed in this audit:
  - `docs/index.md`
  - `docs/testing.md`
  - `docs/api-contracts.md`
  - `docs/smart-contract.md`
  - `docs/architecture.md`
  - `README.md`

## 19. Phase 8 Results

- Web wallet/auth/contract foundation implemented:
  - `web/types/ethereum.d.ts` — Window.ethereum type augmentation
  - `web/lib/blockchain/contract.ts` — minimal ABI, SurveyStruct type, config helpers
  - `web/hooks/useWallet.ts` — MetaMask connection + accountsChanged listener
  - `web/hooks/useNetwork.ts` — chainId detection + switchToSepolia
  - `web/hooks/useWalletAuth.ts` — nonce → sign → verify login flow
  - `web/hooks/useSurveyContract.ts` — contract reads + writes via ethers v6
  - `web/components/ConnectWalletButton.tsx`
  - `web/components/NetworkGuard.tsx`
  - `web/components/AuthSignatureButton.tsx`
  - `web/components/TransactionStatus.tsx`
  - `web/app/layout.tsx` — nav header with wallet + auth buttons
  - `web/app/page.tsx` — home page wrapped in NetworkGuard
- Validation: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` (30/30) all pass.
- Open risk: hooks each hold independent state; a WalletProvider context wrapper is needed before Phase 11 answer flow so components share the same wallet/auth instance.

## 20. Phase 9 Results

- KYC and Admin Review UI implemented.
- Mismatch noted: Phase 6 (KYC API routes) is not yet implemented. Phase 9 UI calls the planned Phase 6 API routes. At runtime, calls return 404 until Phase 6 is completed. The hooks handle 404 silently (empty state) to avoid crashing the build.
- Files created:
  - `web/lib/kyc/types.ts` — TypeScript types for KYC API responses
  - `web/hooks/useVerification.ts` — KYC status, submit, on-chain requestVerification
  - `web/hooks/useAdmin.ts` — admin KYC list, signed URLs, approve, reject
  - `web/components/KycUploadForm.tsx` — two-step form (upload + on-chain request) with dummy-ID warning
  - `web/components/VerifiedRespondentPassStatus.tsx` — verification status display
  - `web/components/KycReviewPanel.tsx` — admin review table with signed URL image preview and approve/reject
  - `web/app/kyc/page.tsx` — respondent KYC page
  - `web/app/admin/page.tsx` — admin page
- Validation: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` (30/30) all pass.
- Open risks:
  - Phase 6 API routes missing: `POST /api/kyc/submit`, `GET /api/kyc/status`, `GET /api/admin/kyc-requests`, `POST /api/admin/kyc/[id]/signed-urls`, `POST /api/admin/kyc/[id]/approve`, `POST /api/admin/kyc/[id]/reject`.
  - Admin authorization is API-enforced only. UI does not gate by on-chain role (would require Phase 6 + reading ADMIN_ROLE from contract).
  - WalletProvider context still missing — hooks in kyc/page.tsx and admin/page.tsx each call useWallet/useWalletAuth independently.

## 21. Phase 11 Results

- Answer and Proof Transaction Flow implemented.
- Files created:
  - `web/hooks/useAnswerSubmission.ts` — state machine hook (idle → starting → answering → submitting → validation_failed | pending_onchain → submitting_onchain → completed); manages attempt, off-chain submit, on-chain proof submit, proof refresh, reset
  - `web/components/AnswerSurveyForm.tsx` — survey question with radio buttons, attention check ("Which color is the sky?", correct answer "Blue"), hidden honeypot field (positioned off-screen, tabIndex=-1)
  - `web/components/ResponseQualityResult.tsx` — shows passed/failed validation with score and reason; failed state explicitly says no reward path
  - `web/components/CompletionProofSubmitter.tsx` — on-chain TX submission; shows proof deadline, handles expired proof with Refresh button, handles cancelled TX with retry message
  - `web/app/surveys/[id]/page.tsx` — survey answer page using useParams(); loads survey + checks duplicate via contract reads; auto-starts attempt; renders phase-appropriate UI
- Validation: `pnpm lint`, `pnpm typecheck`, `pnpm build` all pass. 12/12 static pages generated.
- Open risks:
  - Phase 6 (KYC API) and Phase 10 (survey feed) still unimplemented. Surveys/[id] page reachable by direct URL only until Phase 10 feed links to it.
  - WalletProvider context still missing — each page calls useWallet independently; shared state requires a context wrapper or URL-based handoff.
  - attention check is hardcoded ("Blue"); PRD does not define the check — this is a placeholder that matches PRD spirit (detect inattentive respondents).

## 22. Phase Status Matrix (Source of Truth, 2026-05-04)

This matrix supersedes older status statements in Sections 18-21 when they conflict.
Allowed statuses: `completed`, `partially_completed`, `pending`, `blocked`.

| Phase | Status | Evidence | Blocking Gaps | Next Action |
| --- | --- | --- | --- | --- |
| 0 | completed | `AGENTS.md`, `docs/index.md`, active plan created | none | none |
| 1 | completed | root `package.json`, `pnpm-workspace.yaml`, `web/`, `contracts/`, `supabase/` | none | none |
| 2 | completed | `contracts/test/SurveyReward.test.ts` | none | maintain test coverage |
| 3 | completed | `contracts/contracts/SurveyReward.sol`, passing contract tests | none | keep regression coverage for proof logic |
| 4 | completed | `supabase/schema.sql`, `supabase/storage-policies.sql` | no applied migration evidence in repo | add migration/execution notes in future deployment docs |
| 5 | completed | `web/app/api/auth/*/route.ts`, `web/lib/auth/*`, auth tests | none | none |
| 6 | completed | `web/app/api/kyc/*`, `web/app/api/admin/kyc*`, `web/tests/phase6-routes.test.ts` | none | none |
| 7 | completed | `web/app/api/answers/*`, `web/lib/answers/*`, `web/tests/phase7-routes*.test.ts` | none | none |
| 8 | partially_completed | wallet/network/auth hooks and components in `web/hooks/*`, `web/components/*`, `web/tests/phase8-9-11-adapters.test.ts` | shared wallet/auth state still per-hook; no provider | add wallet/auth provider and migrate pages to shared context |
| 9 | partially_completed | `web/app/kyc/page.tsx`, `web/app/admin/page.tsx`, KYC components/hooks | UI role gating still API-only | add explicit UI role/read checks for admin-only surfaces |
| 10 | partially_completed | `web/app/surveys/page.tsx`, `web/components/SurveyFeed.tsx`, `CreateSurveyForm.tsx`, `QualityRulesForm.tsx`, `web/tests/phase10-survey-ui.test.ts` | PRD routes `GET /api/surveys/:id` and `GET /api/surveys/:id/quality-rules` not present | implement missing survey detail/quality-rules handlers or document divergence |
| 11 | partially_completed | `web/app/surveys/[id]/page.tsx`, `useAnswerSubmission`, answer/proof components | depends on phase 8 shared-state gap; hardcoded attention check behavior | wire shared wallet context; align attention-check config with backend rules |
| 12 | partially_completed | `web/app/rewards/page.tsx`, `RewardDashboard`, admin answer routes/components | no dedicated phase-12 test suite; completeness relies on mixed route/UI tests | add targeted rewards/admin-audit integration tests |
| 13 | pending | no repo evidence of full integration/demo QA artifact | integration runbook and result log missing | add end-to-end checklist execution notes in docs |
| 14 | pending | no committed Sepolia deployment address or Vercel URL evidence | deployment proof missing | add deployed contract address, explorer link, live URL, and release notes |
| 15 | pending | no cleanup/tech-debt audit artifact | stale docs/code cleanup audit not recorded | add cleanup checklist output and unresolved debt list |

## 23. Validation Evidence (2026-05-04)

- `rtk pnpm test`: passed
- `rtk pnpm lint`: passed
- `rtk pnpm typecheck`: non-zero exit with "TypeScript: No errors found" (wrapper anomaly)
- `pnpm typecheck`: passed (authoritative typecheck result)
- `rtk pnpm build`: passed

## 24. Unresolved Work Classification

### Missing implementation
- Phase 10: `GET /api/surveys/:id` route handler not present.
- Phase 10: `GET /api/surveys/:id/quality-rules` route handler not present.
- Phase 13-15 deliverables not present (integration report, deployment proof, cleanup audit).

### Implemented but undocumented
- KYC/admin routes and tests (Phase 6) were implemented but older sections still claimed missing status.
- Survey/rewards/admin UI artifacts (Phases 10-12) exist but were underreported in some summary docs.

### Documented but unverified
- Deployment readiness claims remain unverified until contract address + live URL are committed to docs.
- Full end-to-end demo completion remains unverified without a recorded integration run artifact.

## 25. Known Drift

- `docs/index.md`, `docs/testing.md`, `README.md`, and this file are reconciled to the same status vocabulary and phase rollup as of 2026-05-04.
- Older narrative sections (especially 18-21) may contain historical statements that are now stale; treat Section 22 as authoritative until those historical sections are fully rewritten.

## 26. Latest Phase Status Matrix (Source of Truth, 2026-05-04)

This section supersedes earlier historical status notes and checklists when conflicts exist.
Allowed statuses: `completed`, `partially_completed`, `pending`, `blocked`.

| Phase | Status | Evidence | Blocking Gaps | Next Action |
| --- | --- | --- | --- | --- |
| 0 | completed | repo audit + docs scaffold committed | none | none |
| 1 | completed | workspace + package scaffolds in root/web/contracts/supabase | none | none |
| 2 | completed | `contracts/test/SurveyReward.test.ts` | none | none |
| 3 | completed | `contracts/contracts/SurveyReward.sol` + passing contract tests | none | none |
| 4 | completed | `supabase/schema.sql`, `supabase/storage-policies.sql` | none | none |
| 5 | completed | auth routes + `web/lib/auth/*` + auth tests | none | none |
| 6 | completed | KYC/admin-KYC routes + `phase6-routes.test.ts` | none | none |
| 7 | completed | answer/proof routes + `phase7-routes*.test.ts` | none | none |
| 8 | completed | shared providers in layout (`WalletProvider`, `WalletAuthProvider`) + wallet/network hooks | none | none |
| 9 | completed | `web/app/kyc/page.tsx`, `web/app/admin/page.tsx`, KYC/admin components + tests | none | none |
| 10 | completed | survey feed/UI + `GET /api/surveys`, `GET /api/surveys/:id`, `GET /api/surveys/:id/quality-rules`, phase10 tests | none | none |
| 11 | completed | answer/proof UI flow + proof refresh/mark-onchain routes + tests | none | none |
| 12 | completed | rewards dashboard + admin answer APIs + `phase12-admin-rewards.test.ts` | none | none |
| 13 | completed | `docs/integration-validation-report.md` + full validation pass | none | none |
| 14 | blocked | deployment artifacts not executable without external credentials | requires Sepolia/Vercel access | provide deploy credentials/access, then publish URLs |
| 15 | completed | `docs/cleanup-audit.md` + drift reconciliation and cleanup checklist | none | none |

## 27. Definition of Done Snapshot (2026-05-04)

- Completed phases: `0` through `13`, plus `15`
- Blocked phase: `14` (external deployment access)
- Validation commands all passing locally:
  - `pnpm test`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`

## 28. Deployment Blocker Reference

- See `docs/deployment-blockers.md` for explicit inputs required to complete Phase 14 and publish final contract/live URLs.
