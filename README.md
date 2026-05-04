# SurveyChain Rewards

Sepolia-only academic dApp for survey rewards with wallet auth, quality-gated responses, and EIP-712 completion proofs.

## Progress
- Completed phases: `0`, `1`, `2`, `3`, `5`, `7`, `8`, `9`, `10`, `11`, `12`
- In progress / pending: `4`, `6`, and integration/deployment phases (`13+`)

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
  - `POST /api/surveys/:surveyId/start-attempt`
  - `POST /api/answers/submit`
  - `POST /api/answers/:id/refresh-proof`
  - `POST /api/answers/:id/mark-onchain-confirmed`
  - `GET /api/answers/my`
- Admin answer APIs:
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
