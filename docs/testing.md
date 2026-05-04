# Testing Strategy (Evidence Baseline through 2026-05-04)

## Commands
From repository root:

```powershell
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If RTK wrappers are available, these can be used:

```powershell
rtk pnpm lint
rtk pnpm typecheck
rtk pnpm test
rtk pnpm build
```

Package-level commands:

```powershell
cd web
pnpm lint
pnpm typecheck
pnpm build

cd ..\contracts
pnpm build
pnpm test
```

## Current Coverage Snapshot
- Contract tests: `contracts/test/SurveyReward.test.ts`
  - Roles and access control
  - Verification lifecycle
  - Survey creation validation and escrow checks
  - EIP-712 completion proof success and rejection paths
  - Claim/close/refund/pause paths
- Web/API tests: `web/tests/*.test.ts`
  - Auth routes (`/api/auth/nonce`, `/api/auth/verify`, `/api/auth/logout`, `/api/auth/me`)
  - KYC routes (`/api/kyc/submit`, `/api/kyc/status`, `/api/admin/kyc-requests`, `/api/admin/kyc/[id]/signed-urls`, `/api/admin/kyc/[id]/approve`, `/api/admin/kyc/[id]/reject`)
  - Phase 7 routes (`/api/surveys/:surveyId/start-attempt`, `/api/answers/submit`, `/api/answers/:id/refresh-proof`, `/api/answers/:id/mark-onchain-confirmed`, `/api/answers/my`)
  - Survey UI flow coverage (`tests/phase10-survey-ui.test.ts`)
  - Adapter/UI integration checks (`tests/phase8-9-11-adapters.test.ts`)
  - Error-path and branch coverage tests for route handlers
  - Library unit tests for answer hashing/proof helpers and auth/session helpers

## Latest Validation Run (2026-05-04)
- `pnpm test`: passed
- `pnpm lint`: passed
- `pnpm typecheck`: passed
- `pnpm build`: passed
- Additional coverage added:
  - `web/tests/phase10-survey-routes.test.ts`
  - `web/tests/phase12-admin-rewards.test.ts`
