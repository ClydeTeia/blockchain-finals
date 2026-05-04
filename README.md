# SurveyChain Rewards

Sepolia-only academic dApp for survey rewards with wallet auth, quality-gated responses, and EIP-712 completion proofs.

## Progress
- Source of truth: `docs/execution-plans/active/surveychain-implementation-plan.md` (Section 26).
- Status vocabulary: `completed`, `partially_completed`, `pending`, `blocked`.
- Current rollup (2026-05-04):
  - `completed`: `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`, `13`, `15`
  - `pending`: none
  - `blocked`: `14` (see `docs/deployment-blockers.md`)

## Structure
- `web/` Next.js + TypeScript App Router scaffold
- `contracts/` Hardhat + TypeScript with `SurveyReward.sol` and tests
- `supabase/` SQL and storage policy placeholders
- `docs/` PRD and execution-plan-driven documentation

## Implemented Backend/API (current)
- Wallet auth APIs:
  - `POST /api/auth/nonce`
  - `POST /api/auth/verify`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Response flow APIs:
  - `GET /api/surveys`
  - `GET /api/surveys/:id`
  - `GET /api/surveys/:id/quality-rules`
  - `POST /api/surveys/:surveyId/start-attempt`
  - `POST /api/answers/submit`
  - `POST /api/answers/:id/refresh-proof`
  - `POST /api/answers/:id/mark-onchain-confirmed`
  - `GET /api/answers/my`
- KYC and admin KYC APIs:
  - `POST /api/kyc/submit`
  - `GET /api/kyc/status`
  - `GET /api/admin/kyc-requests`
  - `POST /api/admin/kyc/:id/signed-urls`
  - `POST /api/admin/kyc/:id/approve`
  - `POST /api/admin/kyc/:id/reject`
- Admin answer APIs:
  - `GET /api/admin/answers`
  - `POST /api/admin/answers/:id/flag`
  - `POST /api/admin/answers/:id/audit-note`
  - `POST /api/admin/answers/:id/verify-integrity`

## Validation
Run from repository root:

```powershell
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
