# Testing Strategy (Progress through Phases 0/1/2/3/5/7)

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
  - Phase 7 routes (`/api/surveys/:surveyId/start-attempt`, `/api/answers/submit`, `/api/answers/:id/refresh-proof`, `/api/answers/:id/mark-onchain-confirmed`, `/api/answers/my`)
  - Error-path and branch coverage tests for route handlers
  - Library unit tests for answer hashing/proof helpers and auth/session helpers

## Latest Validation Run (2026-05-02)
- `rtk pnpm lint`: passed
- `rtk pnpm test`: passed
- `rtk pnpm build`: passed
- `rtk pnpm typecheck`: returned non-zero despite `TypeScript: No errors found`; rerun with plain `pnpm typecheck` passed
