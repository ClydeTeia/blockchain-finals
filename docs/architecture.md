# Architecture Overview

SurveyChain Rewards uses a pnpm workspace with three roots:

- `web/`: Next.js + TypeScript App Router and Route Handlers (`web/app/api/**/route.ts`)
- `contracts/`: Hardhat + TypeScript for Sepolia smart contracts
- `supabase/`: SQL schema and storage policy sources

## API Hosting Pattern (Phase 5)

- API logic is hosted in Next.js Route Handlers under `web/app/api/**/route.ts`.
- Wallet auth is server-side only:
  - nonce generation and tracking
  - signature verification
  - signed session cookie issuance
- Identity for protected routes is derived from server-verified session cookies, not from client-provided wallet addresses.

## Implemented API Surface (through Phase 7)

- Auth:
  - `POST /api/auth/nonce`
  - `POST /api/auth/verify`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Attempts and answers:
  - `POST /api/surveys/:surveyId/start-attempt`
  - `POST /api/answers/submit`
  - `POST /api/answers/:id/refresh-proof`
  - `POST /api/answers/:id/mark-onchain-confirmed`
  - `GET /api/answers/my`

## Phase 7 Flow Summary

- Session-authenticated wallet starts an attempt.
- Backend checks duplicate status and on-chain verification status.
- Quality gate evaluates answer quality and completion time.
- Backend stores raw answer, normalized answer, salt, and `answerHash`.
- For passing answers only, backend signs EIP-712 completion proof.
- Client submits proof on-chain, then calls mark-onchain-confirmed route.
