# API Contracts

## Auth Routes (Phase 5)

### `POST /api/auth/nonce`
- Request JSON:
  - `walletAddress: string`
- Behavior:
  - Validates `walletAddress` format.
  - Generates nonce with expiration.
  - Returns signed-message text to be signed by wallet owner.
- Response JSON:
  - `walletAddress: string`
  - `nonce: string`
  - `message: string`
  - `expiresAt: string` (ISO-8601)

### `POST /api/auth/verify`
- Request JSON:
  - `walletAddress: string`
  - `nonce: string`
  - `signature: string`
- Behavior:
  - Validates wallet format.
  - Loads nonce record and rejects missing, expired, used, or wallet-mismatched nonce.
  - Verifies signature recovery matches normalized wallet address.
  - Marks nonce as used.
  - Sets `surveychain_session` httpOnly cookie.
- Response JSON:
  - `walletAddress: string`
  - `authenticated: true`
  - `expiresAt: string` (ISO-8601)

### `POST /api/auth/logout`
- Behavior:
  - Clears `surveychain_session` cookie.
- Response JSON:
  - `success: true`

### `GET /api/auth/me`
- Behavior:
  - Reads and verifies `surveychain_session` cookie.
  - Returns `401` if missing or invalid.
- Response JSON (success):
  - `authenticated: true`
  - `walletAddress: string`
  - `expiresAt: string` (ISO-8601)

## Response Quality Gate and Proof Routes (Phase 7)

### `POST /api/surveys/:surveyId/start-attempt`
- Auth:
  - Requires valid session cookie.
- Behavior:
  - Validates numeric `surveyId`.
  - Creates survey attempt bound to session wallet.
  - Stores request metadata (`user-agent`, hashed forwarded IP when present).
- Response JSON:
  - `attemptId: string`
  - `surveyId: string`
  - `walletAddress: string`
  - `status: "started"`
  - `startedAt: string` (ISO-8601)

### `POST /api/answers/submit`
- Auth:
  - Requires valid session cookie.
- Request JSON:
  - `surveyId: string` (numeric string)
  - `attemptId: string`
  - `rewardAmountWei: string` (integer string)
  - `answer: unknown`
  - `completionTimeSeconds: number`
- Behavior:
  - Validates attempt ownership and survey match.
  - Rejects duplicate reward-eligible submissions per wallet/survey.
  - Requires on-chain verification status for session wallet.
  - Runs quality gate scoring.
  - Stores raw and normalized answer plus salt and `answerHash`.
  - Signs EIP-712 completion proof only when validation passes.
- Response JSON:
  - `answerId: string`
  - `surveyId: string`
  - `status: "pending_onchain" | "failed_validation" | "completed_onchain"`
  - `validation: { passed, score, reason, details }`
  - `answerHash: string`
  - `salt: string`
  - `proof: object | null`

### `POST /api/answers/:id/refresh-proof`
- Auth:
  - Requires valid session cookie.
- Behavior:
  - Allows only answer owner to refresh proof.
  - Rejects refresh on failed-validation answers.
  - Re-signs completion proof with new nonce/deadline.
- Response JSON:
  - `answerId: string`
  - `proof: { nonce: string, deadline: string, signature: string }`

### `POST /api/answers/:id/mark-onchain-confirmed`
- Auth:
  - Requires valid session cookie.
- Request JSON:
  - `txHash: string` (`0x` + 64 hex chars)
- Behavior:
  - Allows only answer owner to mark as on-chain confirmed.
- Response JSON:
  - `answerId: string`
  - `status: "completed_onchain"`
  - `txHash: string`

### `GET /api/answers/my`
- Auth:
  - Requires valid session cookie.
- Behavior:
  - Returns only answers for session wallet.
- Response JSON:
  - `walletAddress: string`
  - `answers: AnswerSummary[]`

## Security Notes
- Session identity source is server-verified session cookie, not request body wallet address.
- Nonces are one-time and expire.
- Session signing uses `SESSION_SECRET` on server only.
- No service-role key is exposed in browser code.
