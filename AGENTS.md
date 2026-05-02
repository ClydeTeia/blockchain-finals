# AGENTS.md

## Project

SurveyChain Rewards is a blockchain-based escrow and proof-of-completion dApp for verified survey rewards.

This project uses:

- Next.js + TypeScript App Router in `web/`
- Next.js Route Handlers in `web/app/api/**/route.ts`
- Hardhat + TypeScript in `contracts/`
- Supabase schema and storage policies in `supabase/`
- ethers.js v6
- MetaMask
- Ethereum Sepolia Testnet only
- Sepolia ETH only, not real money

## Start Here

Before editing, read:

1. `PRD.md`
2. `docs/index.md`
3. `docs/architecture.md`
4. `docs/execution-plans/active/surveychain-implementation-plan.md`
5. The files directly related to the assigned phase

## Core Rules

- Inspect before editing.
- Work only on the assigned phase.
- Keep changes small, focused, and reviewable.
- Do not invent files, routes, schemas, DTOs, contract methods, or APIs.
- Do not use the old Vite/frontend structure unless the repo already has it and the active plan explicitly says to migrate it.
- Use `web/` for the Next.js app.
- Use `web/app/api/**/route.ts` for backend route handlers.
- Use `contracts/` for Hardhat smart contract work.
- Use `supabase/` for SQL schema and storage policies.
- Prefer PowerShell-friendly commands in docs and instructions.
- Prefer tests before or alongside implementation where practical.
- Run validation commands before finishing a phase.
- Document mismatches in the active implementation plan instead of silently changing scope.

## Security and Privacy Rules

- Do not commit real `.env` files or secrets.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to browser/client code.
- Do not expose `VALIDATOR_PRIVATE_KEY` to browser/client code.
- Do not expose `SESSION_SECRET` to browser/client code.
- Server-only secrets must stay in Next.js Route Handlers or server-only libraries.
- Do not store raw KYC images on-chain.
- Do not store raw survey answers on-chain.
- Do not create public KYC image URLs.
- Use private Supabase Storage and short-lived signed URLs for KYC review.
- Do not claim production KYC, AML, legal compliance, real-money rewards, or mainnet behavior.

## Blockchain Rules

- Use Sepolia only.
- Do not add Ethereum mainnet support.
- Use Sepolia ETH only.
- Completion rewards must require a valid backend-signed EIP-712 proof.
- Failed response validation must never produce a completion signature.
- The backend must sign proofs only for the authenticated session wallet.
- The contract must reject reused nonces, expired proofs, invalid signatures, duplicate responses, and unverified respondents.
- Rewards become claimable after valid proof submission.
- Users withdraw rewards through `claimRewards()`.

## Auth Rules

- Do not trust wallet addresses sent from the frontend.
- Protected APIs must use wallet-signature authentication.
- Use nonce-based login:
  - `POST /api/auth/nonce`
  - `POST /api/auth/verify`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Admin APIs must verify a valid session and admin/verifier/creator authority.

## Data Rules

- Raw KYC images live only in private Supabase Storage.
- KYC metadata and hashes live in Supabase Postgres.
- Raw survey answers live off-chain in Supabase.
- Answer hashes are stored on-chain.
- Original submitted answers must be append-only.
- Admins may flag responses and add audit notes.
- Admins must not edit original answer JSON, normalized answer JSON, salt, answer hash, or submitted timestamp.

## Validation Commands

Use commands that actually exist in the repo. Likely commands:

```powershell
pnpm install
pnpm lint
pnpm typecheck
pnpm build