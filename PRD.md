# PRD: SurveyChain Rewards

**Project Title:** SurveyChain Rewards: A Blockchain-Based Escrow and Proof-of-Completion System for Verified Survey Rewards  
**Project Type:** Cryptography & Blockchain Final Project dApp  
**Target Network:** Ethereum Sepolia Testnet  
**Reward Currency:** Sepolia ETH only, not real money  
**Full-stack App:** Next.js + TypeScript (App Router)  
**Frontend:** React components in Next.js  
**Backend/API:** Next.js Route Handlers deployed on Vercel  
**Storage/Database:** Supabase Storage + Supabase Postgres  
**Smart Contract Framework:** Hardhat + TypeScript  
**Blockchain Library:** ethers.js v6  
**Wallet:** MetaMask  
**Deployment:** Sepolia smart contract + Vercel-hosted Next.js web app  
**Deadline:** May 4, 2026, 11:59 PM  
**Version:** v4 Integrated PRD — Standalone PRD Edition

---

## 1. Executive Summary

SurveyChain Rewards is a hybrid Web3 survey reward platform that demonstrates how rewarded surveys can become more transparent and abuse-resistant through smart contract escrow, verified participation, off-chain response validation, on-chain proof commitments, and automatic claimable rewards.

The application is not trying to prove that blockchain can magically make survey answers truthful. Instead, it solves a more defensible problem:

> Survey creators should not pay obviously fake, duplicate, or low-effort respondents, and respondents should not worry that rewards will be withheld after they complete a valid survey.

To solve this, SurveyChain Rewards combines:

1. **Reward Escrow** — survey creators fund the reward pool through a Sepolia smart contract before respondents answer.
2. **Verified Respondent Pass** — respondents must pass a demo KYC-style verification process before joining reward surveys.
3. **Response Quality Gate** — backend rules validate answers before issuing reward eligibility.
4. **Completion Proof** — the backend signs a cryptographic proof only if the answer passes validation.
5. **Answer Integrity Proof** — raw answers stay private in Supabase, while answer hashes are stored on-chain.
6. **Claimable Rewards** — rewards become claimable only after the smart contract verifies the signed completion proof.
7. **Admin Audit** — admins can review KYC, view response validation results, flag suspicious responses, and revoke future eligibility.

This is a production-like academic prototype. It uses Sepolia ETH only. It does not use real money, real production KYC, Ethereum mainnet, or paid identity verification providers.

---

## 2. Product Direction

SurveyChain Rewards is a blockchain-based escrow and proof-of-completion system for verified survey rewards.

The product uses blockchain where it provides clear academic and technical value:

- **Funded reward escrow** shows that survey reward pools exist before respondents participate.
- **Automatic claimable rewards** reduce the need for manual reward approval after a valid completion.
- **Immutable answer commitments** allow submitted answers to be checked against on-chain hashes.
- **On-chain verification status** controls which wallets can join reward surveys.
- **Backend-signed completion proofs** connect off-chain response validation with on-chain reward crediting.
- **Transparent reward state** lets respondents and admins verify survey funding, response completion, and claimable rewards.

### 2.1 Core defense statement

Use this statement during the final defense:

> SurveyChain Rewards does not claim to perfectly know user sincerity because no survey platform can fully prove respondent intent. Instead, it uses a layered response quality gate before issuing rewards. The backend checks verification status, duplicate submissions, required fields, answer format, attention checks, minimum completion time, and bot signals before signing a completion proof. The smart contract only credits rewards when that signed proof is valid. This reduces bots and low-effort submissions while keeping reward distribution automatic and transparent.

---

## 3. Problem Statement

Rewarded survey platforms suffer from a two-sided trust problem.

### 3.1 Survey creator problem

Survey creators and researchers worry about:

- fake accounts,
- duplicate users,
- bot submissions,
- low-effort answers,
- respondents answering only to get rewards,
- paying for unusable data,
- unclear audit trails,
- platform-controlled reward decisions.

### 3.2 Respondent problem

Respondents worry about:

- answering surveys but not receiving the reward,
- unclear reward rules,
- reward pools that may not actually exist,
- admins manually denying rewards after completion,
- lack of transparency in reward eligibility.

### 3.3 System problem

A normal centralized system can store surveys and answers, but users must trust the platform to:

- actually hold enough funds,
- pay valid respondents,
- not secretly modify reward status,
- not alter submitted answers,
- not change reward rules after participation.

SurveyChain Rewards addresses this trust gap by combining off-chain privacy and validation with on-chain escrow, proof commitments, and reward state.

---

## 4. Product Goals

### 4.1 Primary goals

- Let admins approve survey creators/researchers.
- Let approved creators create surveys.
- Let creators fund survey reward pools with Sepolia ETH.
- Let respondents connect MetaMask.
- Let respondents request a demo KYC-style verification.
- Store KYC images privately in Supabase Storage.
- Store KYC metadata and hashes in Supabase Postgres.
- Store KYC proof hash on-chain.
- Let admins manually review KYC images and approve wallets on-chain.
- Give approved wallets a **Verified Respondent Pass**.
- Let verified respondents answer funded surveys.
- Validate answers through a **Response Quality Gate**.
- Store raw answers privately off-chain.
- Store answer hashes on-chain.
- Sign backend completion proofs only for valid answers.
- Credit claimable rewards automatically after valid on-chain proof submission.
- Let respondents claim earned Sepolia ETH.
- Let admins audit and flag suspicious responses without manually approving rewards.

### 4.2 Academic goals

- Demonstrate MetaMask wallet connection.
- Demonstrate Sepolia network guard.
- Demonstrate smart contract escrow.
- Demonstrate on-chain access control.
- Demonstrate wallet-linked verification status.
- Demonstrate KYC proof hashes.
- Demonstrate answer hash commitments.
- Demonstrate backend-signed completion proofs.
- Demonstrate on-chain state updates.
- Demonstrate event-driven frontend updates.
- Demonstrate Hardhat tests for success and failure cases.
- Demonstrate a complete dApp flow from survey creation to reward claim.

---

## 5. Non-Goals and Honest Limitations

The system will not include:

- real-money rewards,
- Ethereum mainnet deployment,
- paid production KYC services,
- automated government ID validation,
- AML screening,
- legal compliance certification,
- fully decentralized survey storage,
- zero-knowledge identity proofs,
- guaranteed human sincerity detection,
- guaranteed bot elimination,
- editing original submitted answers,
- storing raw KYC images on-chain,
- storing raw survey answers on-chain.

### 5.1 Important honesty statement

The system cannot guarantee that every answer is sincere. It can only reduce common abuse patterns through verification, duplicate prevention, validation rules, and proof-gated rewards.

### 5.2 KYC limitation

The KYC flow is for academic demonstration only. It is a manual visual review process. It does not replace real legal KYC.

### 5.3 Image hash limitation

Exact file hashes can only detect exact duplicate images. They do not reliably detect cropped, compressed, edited, screenshotted, or re-photographed IDs. Production systems would need liveness checks, OCR, face matching, perceptual hashing, or third-party KYC.

### 5.4 Backend trust limitation

The backend is a trusted validator/oracle. The smart contract cannot read Supabase or judge answer quality directly. The contract only verifies that an authorized validator signed the completion proof.

---

## 6. Core Product Concept

### 6.1 Creator protection

The system protects creators by providing:

- verified respondents,
- one response per verified wallet per survey,
- response quality validation,
- attention-check support,
- minimum completion time checks,
- answer hash integrity,
- audit logs,
- ability to close surveys,
- ability to withdraw unused rewards.

### 6.2 Respondent protection

The system protects respondents by providing:

- visible funded reward escrow,
- automatic reward credit after valid completion,
- no manual reward approval after submission,
- transparent claimable reward balance,
- on-chain record of completion,
- proof that their submitted answer hash was recorded.

### 6.3 Platform protection

The system protects the platform by providing:

- private storage for sensitive files,
- service-role-only backend access,
- signed URLs for admin image review,
- wallet signature login for admin APIs,
- rate limiting and bot checks,
- audit logging,
- pause/revoke controls for abuse.

---

## 7. User Roles

## 7.1 Respondent

A respondent is a user who wants to answer surveys and earn Sepolia ETH.

Capabilities:

- Connect MetaMask.
- Switch to Sepolia.
- Sign login/authentication message.
- Request demo KYC verification.
- Upload ID image and selfie.
- Receive a Verified Respondent Pass after approval.
- Answer reward surveys after approval.
- Submit answer for backend validation.
- Submit completion proof on-chain.
- View completed, pending, failed, and claimable reward states.
- Claim earned Sepolia ETH.

## 7.2 Survey Creator / Researcher

A creator is approved by an admin and can create funded surveys.

Capabilities:

- Connect MetaMask.
- Sign login/authentication message.
- Create surveys.
- Configure basic response quality rules.
- Deposit Sepolia ETH reward pool.
- View responses to their own surveys.
- View validation scores and reasons.
- Close surveys.
- Withdraw unused reward pool after survey closure.

## 7.3 Admin / Verifier / Validator

The admin is controlled by the deployer/group wallet.

Capabilities:

- Approve or reject KYC requests.
- Review private ID/selfie images through signed URLs.
- Approve wallets on-chain.
- Revoke verification for future surveys.
- Grant or revoke creator role.
- View all survey responses.
- View response validation details.
- Flag suspicious responses.
- Add audit notes.
- Close abusive surveys.
- Pause/unpause contract.
- Manage trusted validator signer.

---

## 8. High-Level Architecture

```txt
Next.js App Router on Vercel
   │
   ├── React UI pages and components
   │       │
   │       ├── Wallet connection
   │       ├── Survey feed and answer forms
   │       ├── KYC and reward dashboards
   │       └── Admin dashboard
   │
   ├── MetaMask + ethers.js
   │       │
   │       └── SurveyReward.sol on Sepolia
   │
   └── Next.js Route Handlers
           │
           ├── Wallet signature authentication
           ├── Response Quality Gate
           ├── Completion Proof Signer
           ├── Supabase Postgres
           └── Supabase Private Storage
```

---

## 9. Main System Modules

The application should be presented as seven core modules:

```txt
1. Reward Escrow
2. Verified Respondent Pass
3. Response Quality Gate
4. Completion Proof
5. Answer Integrity Check
6. Claimable Rewards
7. Admin Audit
```

### 9.1 Reward Escrow

Creators deposit Sepolia ETH into the smart contract when creating a survey. The contract stores the funded reward pool and releases rewards only through valid completion proofs.

### 9.2 Verified Respondent Pass

The Verified Respondent Pass is an on-chain verification status that allows a wallet to answer reward surveys.

For MVP, the pass is issued after manual demo KYC review. In production, this could be replaced by institutional email verification, real KYC, Human Passport, World ID, or another proof-of-personhood provider.

### 9.3 Response Quality Gate

The backend checks whether a response is complete, valid, and not obviously bot-like before signing a completion proof.

### 9.4 Completion Proof

A backend-signed EIP-712 proof that says:

> This wallet completed this survey with this answer hash and should receive this reward amount before the deadline.

### 9.5 Answer Integrity Check

Raw answers stay private in Supabase. The answer hash is stored on-chain. The app can recompute the hash from the stored answer and compare it with the on-chain hash to prove the answer has not been silently modified.

### 9.6 Claimable Rewards

Rewards are credited to `claimableRewards[user]` after valid proof submission. Users claim rewards through `claimRewards()`.

### 9.7 Admin Audit

Admins can inspect KYC requests, response quality scores, validation reasons, answer hashes, transaction hashes, flagged responses, and audit notes.

---

## 10. Data Storage Strategy

## 10.1 On-chain data

The smart contract stores only blockchain-safe data:

- wallet addresses,
- survey reward logic,
- reward pool balances,
- verification status,
- KYC proof hash,
- answer hash,
- response status,
- claimable rewards,
- total earned,
- used proof nonces,
- events.

## 10.2 Off-chain data

Supabase stores private, sensitive, or larger data:

- KYC image storage paths,
- ID image hash,
- selfie image hash,
- KYC request status,
- survey answer content,
- normalized answer JSON,
- answer salt,
- validation score,
- validation reason,
- validation details,
- completion nonce/signature metadata,
- on-chain transaction hash,
- audit notes,
- audit logs.

## 10.3 Never store on-chain

Never store these on-chain:

- raw ID image,
- raw selfie image,
- public KYC image URL,
- IPFS CID for KYC documents,
- real name,
- home address,
- birthdate,
- raw survey answer text,
- raw survey answer JSON,
- admin private notes.

---

## 11. Wallet Authentication Design

### 11.1 Why wallet authentication is needed

The backend must not trust a wallet address sent from the frontend. Anyone can fake a wallet address in an API request.

Therefore, protected API routes must require wallet-signature authentication.

### 11.2 Wallet login flow

```txt
User connects MetaMask
   ↓
Frontend requests login nonce from backend
   ↓
Backend creates nonce and message
   ↓
User signs message with MetaMask
   ↓
Backend verifies signature
   ↓
Backend creates short-lived session/JWT
   ↓
Protected API routes check session wallet + role
```

### 11.3 Required API routes

```txt
POST /api/auth/nonce
POST /api/auth/verify
POST /api/auth/logout
GET  /api/auth/me
```

### 11.4 Admin route protection

Admin APIs must check:

1. User has a valid session.
2. Session wallet matches the signer.
3. Wallet has admin/verifier/creator role on-chain or is configured in backend allowlist.

---

## 12. KYC / Verified Respondent Pass Design

## 12.1 KYC principle

The KYC flow should look production-like for demo purposes, but the actual approval is manual. The app is not claiming to perform real legal KYC.

The purpose is to demonstrate:

- private file upload,
- wallet-linked identity request,
- image hash generation,
- duplicate exact-file blocking,
- admin review,
- KYC proof hash,
- on-chain verification status,
- access control for reward surveys.

## 12.2 KYC storage flow

```txt
User connects MetaMask
   ↓
User signs wallet login message
   ↓
User uploads ID image + selfie
   ↓
Frontend/API computes file hashes
   ↓
Vercel API uploads files to Supabase private Storage
   ↓
Vercel API creates kyc_requests row in Supabase Postgres
   ↓
Frontend asks user to call requestVerification(kycProofHash)
   ↓
Smart contract stores Pending status + proof hash
   ↓
Admin reviews private images through signed URLs
   ↓
Admin approves or rejects
   ↓
Smart contract updates verification status
   ↓
Approved wallet receives Verified Respondent Pass
```

## 12.3 KYC file storage

Create a private Supabase bucket:

```txt
kyc-documents
```

Recommended path structure:

```txt
kyc-documents/
  {kycRequestId}/
    id-front.{ext}
    selfie.{ext}
```

Do not use wallet address directly in the file path. Use UUIDs to reduce predictable paths.

## 12.4 KYC hashing

The frontend or API computes:

```txt
idImageHash = sha256(id image bytes)
selfieImageHash = sha256(selfie image bytes)
kycProofHash = keccak256(walletAddress + idImageHash + selfieImageHash + timestamp)
```

The `kycProofHash` is submitted on-chain.

## 12.5 Duplicate KYC prevention

Supabase should block:

- duplicate approved wallet,
- duplicate exact ID image hash,
- duplicate exact selfie image hash.

Important limitation:

> Exact file hashes only detect exact duplicate uploads. They do not catch edited, cropped, compressed, or re-photographed images.

## 12.6 Demo safety rule

For the classroom demo, use dummy/sample ID images only. Do not require classmates to upload real government IDs.

---

## 13. Survey Creation Design

## 13.1 Survey creator flow

```txt
Creator connects MetaMask
   ↓
Creator signs login message
   ↓
Creator fills survey form
   ↓
Creator configures response quality rules
   ↓
Creator previews total reward pool
   ↓
Creator calls createSurvey(...) with exact Sepolia ETH deposit
   ↓
Smart contract stores funded survey
   ↓
Survey appears in feed
```

## 13.2 MVP survey fields

For the final project, keep surveys simple enough to finish:

- title,
- description,
- one or more questions,
- answer type: multiple choice, rating, or text,
- options for multiple choice,
- required flag,
- reward per response,
- maximum responses,
- response quality rules.

## 13.3 On-chain vs off-chain survey metadata

### MVP approach

For ease of demo, the contract may store:

- title,
- description,
- question,
- options,
- reward per response,
- max responses.

### Better production approach

A production version should store less text on-chain:

```txt
On-chain:
- surveyId
- creator
- rewardPerResponse
- maxResponses
- responseCount
- escrowRemaining
- metadataHash
- active

Off-chain:
- title
- description
- questions
- options
- validation rules
```

For the final defense, explain that the MVP stores more on-chain for demonstration simplicity.

---

## 14. Response Quality Gate

## 14.1 Core principle

The system cannot guarantee that every answer is sincere. Instead, it estimates response quality using layered checks.

The backend signs a completion proof only when the response passes the quality gate.

```txt
No signed proof = no on-chain reward.
```

## 14.2 Quality gate layers

The Response Quality Gate includes:

1. wallet/session validation,
2. KYC-approved / Verified Respondent Pass check,
3. survey active check,
4. survey capacity check,
5. duplicate response check,
6. required fields check,
7. valid option check,
8. attention-check question,
9. minimum completion time,
10. open-text quality check,
11. straight-lining detection,
12. honeypot field check,
13. CAPTCHA / bot challenge check,
14. rate-limit check.

## 14.3 Hard-fail checks

If any hard-fail check fails, the backend must not sign a completion proof.

Hard-fail examples:

- invalid wallet address,
- unauthenticated wallet session,
- wallet not KYC-approved,
- survey does not exist,
- survey is inactive,
- survey is full,
- wallet already submitted,
- required answer missing,
- multiple-choice answer not in allowed options,
- attention check failed,
- completion time below hard minimum,
- CAPTCHA failed,
- honeypot field filled,
- nonce already used.

## 14.4 Score-based checks

Some checks should deduct points but not automatically fail.

Score-based examples:

- text answer too short,
- repetitive text,
- gibberish-like text,
- straight-lining in rating questions,
- completion time suspiciously close to minimum,
- too many previous failed attempts.

## 14.5 Recommended scoring model

```txt
Base score: 100
Passing score: 70
```

Suggested deductions:

```txt
Open text too short: -20
Repeated text: -25
Gibberish-like answer: -40
Straight-lining detected: -20
Completion near minimum time: -10
Too many failed attempts: -30
```

Hard failures immediately block proof signing.

## 14.6 Example passed validation result

```json
{
  "score": 85,
  "status": "passed",
  "reason": "Passed required fields, attention check, valid options, and minimum completion time.",
  "details": {
    "requiredFields": "passed",
    "attentionCheck": "passed",
    "completionTime": "passed",
    "textQuality": "minor_warning"
  }
}
```

## 14.7 Example failed validation result

```json
{
  "score": 0,
  "status": "failed",
  "reason": "Failed attention check and completed below minimum time.",
  "details": {
    "attentionCheck": "failed",
    "completionTime": "failed",
    "requiredFields": "passed"
  }
}
```

---

## 15. Survey Answer and Reward Flow

## 15.1 Response lifecycle

Use this response state machine:

```txt
not_started
   ↓
started
   ↓
submitted_offchain
   ↓
failed_validation
```

or:

```txt
submitted_offchain
   ↓
pending_onchain
   ↓
completed_onchain
   ↓
claimed
```

Full flow:

```txt
User opens survey
   ↓
Backend creates attempt with started_at
   ↓
User submits answer
   ↓
Backend validates response
   ↓
If failed:
   status = failed_validation
   no signature
   no reward

If passed:
   backend stores answer
   backend computes answer hash
   backend signs completion proof
   status = pending_onchain
   ↓
User submits proof to smart contract
   ↓
Contract verifies proof
   ↓
status = completed_onchain
reward = claimable
   ↓
User claims reward
   ↓
status = claimed
```

## 15.2 Start attempt flow

When a user opens a survey, the frontend calls:

```txt
POST /api/surveys/:surveyId/start-attempt
```

Backend stores:

- attempt ID,
- survey ID,
- wallet address,
- started time,
- session metadata.

This allows minimum completion time validation.

## 15.3 Submit answer flow

Frontend calls:

```txt
POST /api/answers/submit
```

Payload:

```json
{
  "attemptId": "uuid",
  "surveyId": 1,
  "walletAddress": "0xUserWallet",
  "answers": {
    "q1": "Option A",
    "q2": "I chose this because...",
    "q3": "Strongly Agree"
  },
  "captchaToken": "optional-token",
  "honeypot": ""
}
```

Backend validates and returns either failure or proof.

## 15.4 Failed validation response

```json
{
  "ok": false,
  "status": "failed_validation",
  "score": 35,
  "reason": "Completed too fast and failed attention check.",
  "canRetry": false
}
```

## 15.5 Passed validation response

```json
{
  "ok": true,
  "status": "pending_onchain",
  "surveyId": 1,
  "answerHash": "0xabc...",
  "rewardAmount": "10000000000000000",
  "nonce": "123456789",
  "deadline": 1770000000,
  "signature": "0xsigned..."
}
```

Then the frontend calls:

```solidity
submitResponseWithProof(
  surveyId,
  answerHash,
  rewardAmount,
  nonce,
  deadline,
  signature
)
```

---

## 16. Answer Hash and Integrity Design

## 16.1 Answer hash input

Recommended hash input:

```txt
answerHash = keccak256(
  surveyId,
  respondentWallet,
  normalizedAnswerJson,
  randomSalt,
  submittedAt
)
```

Store the same values off-chain:

- survey ID,
- respondent wallet,
- raw answer JSON,
- normalized answer JSON,
- random salt,
- submitted timestamp,
- answer hash.

## 16.2 Why salt is needed

For simple multiple-choice questions, hashes can be brute-forced if the attacker knows the possible options. Adding a random salt makes the answer hash harder to guess.

The salt must stay off-chain in Supabase.

## 16.3 Answer immutability policy

Original answers must be append-only.

Admins cannot edit:

- raw answer JSON,
- normalized answer JSON,
- answer hash,
- salt,
- submitted timestamp,
- validation result at submission time.

Admins can edit only:

- `flagged`,
- `audit_notes`,
- future eligibility or revocation status.

## 16.4 Verify Answer Integrity feature

Add a UI button:

```txt
Verify Answer Integrity
```

When clicked, the app should:

1. Fetch the stored answer from Supabase.
2. Normalize the answer JSON.
3. Combine it with survey ID, wallet, salt, and submitted timestamp.
4. Recompute the answer hash.
5. Fetch the on-chain answer hash.
6. Compare both values.
7. Display result.

Success message:

```txt
Answer integrity verified. The off-chain answer matches the on-chain proof.
```

Failure message:

```txt
Integrity mismatch. The off-chain answer no longer matches the on-chain proof.
```

This feature makes the blockchain value easier to demonstrate during defense.

---

## 17. Completion Proof Design

## 17.1 Why completion proofs are needed

The smart contract cannot read private Supabase answers. Frontend-only validation can be bypassed by calling the contract directly.

Therefore, the backend must sign a completion proof after validation passes.

The contract only rewards responses with a valid trusted signature.

## 17.2 Proof fields

Use EIP-712 typed data.

```txt
CompletionProof(
  uint256 surveyId,
  address respondent,
  bytes32 answerHash,
  uint256 rewardAmount,
  uint256 nonce,
  uint256 deadline
)
```

The EIP-712 domain includes:

```txt
name: SurveyChainRewards
version: 1
chainId: 11155111
verifyingContract: CONTRACT_ADDRESS
```

## 17.3 Replay protection

Each proof must include:

- nonce,
- deadline,
- respondent wallet,
- survey ID,
- answer hash,
- reward amount,
- contract address via EIP-712 domain,
- chain ID via EIP-712 domain.

The contract must reject:

- expired proofs,
- reused nonces,
- proofs for another wallet,
- proofs for another survey,
- proofs with changed answer hash,
- proofs with changed reward amount,
- signatures not produced by `VALIDATOR_ROLE`.

---

## 18. Reward Logic

## 18.1 Key rule

Rewards become claimable automatically after a verified respondent submits a valid backend-signed completion proof on-chain.

There is no manual response approval step for the MVP.

## 18.2 Reward state machine

```txt
No Response
   ↓ submitResponseWithProof
Completed / Claimable
   ↓ claimRewards
Claimed
```

Invalid path:

```txt
Failed validation
   ↓
No signed proof
   ↓
No on-chain reward
```

## 18.3 Why claimable rewards instead of instant transfer

Rewards are credited automatically after completion, but ETH should still be withdrawn through `claimRewards()` because:

- ETH transfer logic is isolated in one function,
- `claimRewards()` can be protected with `nonReentrant`,
- failed ETH transfer does not break response submission,
- the UI can show earned vs claimed rewards,
- testing is easier.

## 18.4 Claim rule

The contract must:

1. Check claimable reward is greater than 0.
2. Set claimable amount to 0 before transfer.
3. Transfer Sepolia ETH using `.call`.
4. Revert safely if transfer fails.
5. Emit `RewardsClaimed`.

---

## 19. Edge Cases

## 19.1 User passes validation but cancels MetaMask

Flow:

```txt
Backend stores answer as pending_onchain
Backend returns proof
User cancels MetaMask transaction
No on-chain reward is credited
Supabase remains pending_onchain
```

Frontend should show:

```txt
Your answer was saved, but the blockchain transaction was not completed. Click Complete Reward Transaction to continue.
```

## 19.2 Proof expires before user submits transaction

Best MVP behavior:

```txt
If pending_onchain and proof is expired:
  generate a new nonce, deadline, and signature for the same answerHash
```

Do not create a new answer unless needed.

## 19.3 Survey becomes full after validation

Possible race condition:

1. Backend signs proof.
2. Another user submits first.
3. Survey becomes full.
4. Current user's transaction fails.

The UI should mark the attempt as:

```txt
failed_onchain
```

Reason:

```txt
Survey became full before the blockchain transaction was confirmed.
```

## 19.4 Admin flags response after reward

Flagging does not claw back rewards in the MVP.

Rule:

```txt
Flagging affects future trust, not already credited rewards.
```

Admins may revoke a respondent for future surveys if abuse is detected.

---

## 20. Smart Contract Specification

## 20.1 Contract name

```txt
SurveyReward.sol
```

## 20.2 Recommended OpenZeppelin modules

Use:

- `AccessControl`,
- `Pausable`,
- `ReentrancyGuard`,
- `EIP712`,
- `ECDSA`.

## 20.3 Roles

```solidity
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
```

The deployer receives all roles during deployment.

## 20.4 Enums

```solidity
enum VerificationStatus {
    None,
    Pending,
    Approved,
    Rejected,
    Revoked
}

enum ResponseStatus {
    None,
    Completed,
    Claimed
}
```

## 20.5 Structs

```solidity
struct Survey {
    uint256 id;
    address creator;
    string title;
    string description;
    string question;
    string[] options;
    uint256 rewardPerResponse;
    uint256 maxResponses;
    uint256 responseCount;
    uint256 escrowRemaining;
    bool active;
    uint256 createdAt;
}

struct VerificationRequest {
    address user;
    bytes32 kycProofHash;
    VerificationStatus status;
    uint256 requestedAt;
    uint256 reviewedAt;
}

struct ResponseRecord {
    uint256 surveyId;
    address respondent;
    bytes32 answerHash;
    ResponseStatus status;
    uint256 submittedAt;
    uint256 rewardAmount;
}
```

## 20.6 State variables

```solidity
uint256 public surveyCount;

mapping(uint256 => Survey) public surveys;
mapping(address => VerificationStatus) public verificationStatus;
mapping(address => VerificationRequest) public verificationRequests;
mapping(uint256 => mapping(address => bool)) public hasSubmitted;
mapping(uint256 => mapping(address => ResponseRecord)) public responses;
mapping(address => uint256) public claimableRewards;
mapping(address => uint256) public totalEarned;
mapping(uint256 => bool) public usedNonces;
```

## 20.7 Events

```solidity
event VerificationRequested(address indexed user, bytes32 indexed kycProofHash);
event VerificationApproved(address indexed user, address indexed admin);
event VerificationRejected(address indexed user, address indexed admin, string reason);
event VerificationRevoked(address indexed user, address indexed admin);

event CreatorRoleGranted(address indexed creator, address indexed admin);
event CreatorRoleRevoked(address indexed creator, address indexed admin);

event SurveyCreated(
    uint256 indexed surveyId,
    address indexed creator,
    string title,
    uint256 rewardPerResponse,
    uint256 maxResponses,
    uint256 escrowAmount
);

event ResponseSubmitted(
    uint256 indexed surveyId,
    address indexed respondent,
    bytes32 indexed answerHash,
    uint256 rewardAmount
);

event RewardsClaimed(address indexed user, uint256 amount);
event SurveyClosed(uint256 indexed surveyId, address indexed creator);
event UnusedRewardsWithdrawn(uint256 indexed surveyId, address indexed creator, uint256 amount);
```

## 20.8 Required functions

```solidity
function requestVerification(bytes32 kycProofHash) external;
function approveVerification(address user) external;
function rejectVerification(address user, string calldata reason) external;
function revokeVerification(address user) external;

function grantCreatorRole(address creator) external;
function revokeCreatorRole(address creator) external;

function createSurvey(
    string calldata title,
    string calldata description,
    string calldata question,
    string[] calldata options,
    uint256 rewardPerResponse,
    uint256 maxResponses
) external payable;

function submitResponseWithProof(
    uint256 surveyId,
    bytes32 answerHash,
    uint256 rewardAmount,
    uint256 nonce,
    uint256 deadline,
    bytes calldata signature
) external;

function claimRewards() external nonReentrant;
function closeSurvey(uint256 surveyId) external;
function withdrawUnusedRewards(uint256 surveyId) external nonReentrant;

function getSurvey(uint256 surveyId) external view returns (Survey memory);
function getAllSurveys() external view returns (Survey[] memory);
function checkSubmitted(uint256 surveyId, address user) external view returns (bool);
function isVerified(address user) external view returns (bool);
function pause() external;
function unpause() external;
```

---

## 21. Smart Contract Rules

## 21.1 Survey creation rules

- Caller must have `CREATOR_ROLE` or `ADMIN_ROLE`.
- Contract must not be paused.
- Title must not be empty.
- Question must not be empty.
- Must have at least 2 options.
- Reward per response must be greater than 0.
- Max responses must be greater than 0.
- `msg.value` must equal `rewardPerResponse * maxResponses`.

## 21.2 Response submission rules

- Contract must not be paused.
- User must be verified.
- Survey must exist.
- Survey must be active.
- Survey must not be full.
- User must not have already submitted a response for that survey.
- Answer hash must not be zero.
- Completion proof signature must be valid.
- Proof must not be expired.
- Nonce must not have been used before.
- Reward amount must match survey reward per response.
- Survey must have enough escrow remaining.
- Signer must have `VALIDATOR_ROLE`.
- Response is recorded as `Completed`.
- Contract credits `claimableRewards[respondent]`.
- Contract updates `totalEarned[respondent]`.
- Contract emits `ResponseSubmitted`.

## 21.3 Invalid/low-quality response rules

- Invalid answers are blocked before the on-chain call.
- If backend validation fails, backend must not sign a completion proof.
- Without a valid proof, the smart contract rejects the response.
- Admins can flag suspicious responses later, but MVP does not claw back already credited rewards.

---

## 22. Supabase Database Design

## 22.1 `kyc_requests`

```sql
create table kyc_requests (
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

create unique index unique_approved_wallet
on kyc_requests (lower(wallet_address))
where status = 'approved';

create unique index unique_id_image_hash
on kyc_requests (id_image_hash);

create unique index unique_selfie_image_hash
on kyc_requests (selfie_image_hash);
```

## 22.2 `survey_attempts`

```sql
create table survey_attempts (
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
```

## 22.3 `survey_answers`

```sql
create table survey_answers (
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

create unique index unique_reward_eligible_response_per_wallet
on survey_answers (survey_id, lower(respondent_wallet))
where status in ('pending_onchain', 'completed_onchain', 'claimed');
```

## 22.4 `survey_quality_rules`

```sql
create table survey_quality_rules (
  survey_id bigint primary key,
  min_completion_seconds integer not null default 30,
  min_text_answer_length integer not null default 20,
  require_attention_check boolean not null default true,
  attention_check_question_id text,
  attention_check_expected_answer text,
  passing_score integer not null default 70,
  created_at timestamptz not null default now()
);
```

## 22.5 `auth_nonces`

```sql
create table auth_nonces (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  nonce text not null unique,
  message text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
```

## 22.6 `audit_logs`

```sql
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_wallet text,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
```

---

## 23. Next.js API Route Handlers

The application uses Next.js Route Handlers under `web/app/api/**/route.ts`. Frontend pages call these endpoints with normal relative URLs such as `/api/answers/submit`. Server-only logic, Supabase service-role access, wallet session verification, and completion proof signing must stay inside route handlers or server-only libraries.

## 23.1 Authentication route handlers

```txt
POST /api/auth/nonce
POST /api/auth/verify
POST /api/auth/logout
GET  /api/auth/me
```

## 23.2 KYC route handlers

```txt
POST /api/kyc/submit
GET  /api/kyc/status
GET  /api/admin/kyc-requests
POST /api/admin/kyc/:id/signed-urls
POST /api/admin/kyc/:id/approve
POST /api/admin/kyc/:id/reject
```

## 23.3 Survey route handlers

```txt
POST /api/surveys/:surveyId/start-attempt
GET  /api/surveys
GET  /api/surveys/:id
GET  /api/surveys/:id/quality-rules
```

## 23.4 Answer route handlers

```txt
POST /api/answers/submit
POST /api/answers/:id/refresh-proof
POST /api/answers/:id/mark-onchain-confirmed
GET  /api/answers/my
GET  /api/admin/answers
POST /api/admin/answers/:id/flag
POST /api/admin/answers/:id/audit-note
POST /api/admin/answers/:id/verify-integrity
```

## 23.5 API security rules

- Do not expose Supabase service role key to the browser.
- Admin APIs must require wallet-signature session.
- Admin APIs must check on-chain/admin role.
- Creator APIs must check creator role.
- File access must use signed URLs with short expiration.
- Validate file type and file size.
- Validate wallet address format.
- Validate hash format.
- Validate answer schema on backend.
- Rate limit KYC submission and answer submission.
- Log KYC approval/rejection, answer submission, failed validation, answer flagging, and audit note actions.

---

## 24. Web Pages

## 24.1 Home / Survey Feed

- Wallet connection.
- Sepolia network guard.
- Survey list.
- Verification status.
- Claimable reward summary.
- Funded reward pool display.

## 24.2 Create Survey

Visible to admins and approved creators.

Fields:

- title,
- description,
- questions,
- options,
- reward per response,
- max responses,
- total deposit preview,
- minimum completion time,
- attention-check configuration,
- passing score.

## 24.3 KYC / Verified Respondent Pass

- Upload ID image.
- Upload selfie.
- Submit KYC request.
- Request on-chain verification status.
- Show status: none, pending, approved, rejected, revoked.
- Explain that demo KYC uses sample/dummy IDs only.

## 24.4 Answer Survey

- Start attempt.
- Display survey questions.
- Include attention-check question.
- Include hidden honeypot field.
- Submit answer to backend.
- Show validation result.
- If passed, show MetaMask transaction step.
- Submit answer hash and completion proof on-chain.
- Show pending/completed/claimable reward state.

## 24.5 Rewards Dashboard

- Claimable rewards.
- Total earned.
- Completed responses.
- Pending on-chain responses.
- Failed validation responses.
- Claim button.

## 24.6 Admin Dashboard

Tabs:

1. KYC Requests.
2. Survey Management.
3. Response Quality Audit.
4. Creator Role Management.
5. Contract Controls.

Admin response audit should show:

- wallet,
- survey,
- answer hash,
- validation score,
- validation reason,
- validation details,
- on-chain transaction hash,
- integrity verification result,
- flagged status,
- audit notes.

---

## 25. Web Components

```txt
web/components/ConnectWalletButton.tsx
web/components/NetworkGuard.tsx
web/components/AuthSignatureButton.tsx
web/components/SurveyCard.tsx
web/components/CreateSurveyForm.tsx
web/components/QualityRulesForm.tsx
web/components/KycUploadForm.tsx
web/components/VerifiedRespondentPassStatus.tsx
web/components/KycReviewPanel.tsx
web/components/AnswerSurveyForm.tsx
web/components/ResponseQualityResult.tsx
web/components/CompletionProofSubmitter.tsx
web/components/AnswerIntegrityVerifier.tsx
web/components/ResponseAuditPanel.tsx
web/components/AdminPanel.tsx
web/components/RewardDashboard.tsx
web/components/TransactionStatus.tsx
web/components/Layout.tsx
```

## 25.1 Hooks

```txt
web/hooks/useWallet.ts
web/hooks/useNetwork.ts
web/hooks/useWalletAuth.ts
web/hooks/useSurveyContract.ts
web/hooks/useSurveys.ts
web/hooks/useVerification.ts
web/hooks/useRewards.ts
web/hooks/useAdmin.ts
web/hooks/useAnswerSubmission.ts
web/hooks/useResponseQuality.ts
```

---

## 26. Environment Variables

## 26.1 Next.js web `.env.example`

Only variables prefixed with `NEXT_PUBLIC_` may be exposed to browser code.

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 26.2 Server-only environment variables

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_WALLET_ADDRESS=
CONTRACT_ADDRESS=
SEPOLIA_RPC_URL=
VALIDATOR_PRIVATE_KEY=
SESSION_SECRET=
CAPTCHA_SECRET_KEY=
```

Never commit real `.env` files.

---

## 27. Repository Structure

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
      admin/
        page.tsx
      kyc/
        page.tsx
      rewards/
        page.tsx
      surveys/
        [id]/
          page.tsx
      api/
        auth/
          nonce/route.ts
          verify/route.ts
          logout/route.ts
          me/route.ts
        kyc/
          submit/route.ts
          status/route.ts
        admin/
          kyc-requests/route.ts
          kyc/[id]/signed-urls/route.ts
          kyc/[id]/approve/route.ts
          kyc/[id]/reject/route.ts
          answers/route.ts
          answers/[id]/flag/route.ts
          answers/[id]/audit-note/route.ts
          answers/[id]/verify-integrity/route.ts
        surveys/
          route.ts
          [id]/route.ts
          [id]/quality-rules/route.ts
          [id]/start-attempt/route.ts
        answers/
          submit/route.ts
          my/route.ts
          [id]/refresh-proof/route.ts
          [id]/mark-onchain-confirmed/route.ts
    components/
    hooks/
    lib/
    public/
    package.json
    next.config.ts
    .env.example

  supabase/
    schema.sql
    storage-policies.sql
```

---

## 28. Hardhat Test Requirements

## 28.1 Roles

- Deployer receives admin, creator, verifier, and validator roles.
- Admin can grant creator role.
- Non-admin cannot grant creator role.
- Admin can revoke creator role.
- Non-admin cannot pause contract.

## 28.2 KYC / Verified Respondent Pass

- User can request verification.
- Verifier/admin can approve verification.
- Non-verifier cannot approve verification.
- Rejected user cannot answer.
- Revoked user cannot answer.

## 28.3 Survey creation

- Creator can create survey with exact ETH deposit.
- Survey creation emits event.
- Non-creator cannot create survey.
- Insufficient deposit reverts.
- Empty title/question reverts.
- Invalid max responses reverts.

## 28.4 Completion proof validation

- Authorized validator signature is accepted.
- Non-validator signature is rejected.
- Proof for another wallet is rejected.
- Proof for another survey is rejected.
- Proof with changed answer hash is rejected.
- Proof with changed reward amount is rejected.
- Expired proof is rejected.
- Reused nonce is rejected.

## 28.5 Response submission and automatic reward credit

- Verified user can submit answer hash with valid completion proof.
- Unverified user cannot submit.
- Duplicate submission reverts.
- Full survey reverts.
- Submission emits event.
- Submission immediately credits claimable reward.
- Submission decrements escrow correctly.

## 28.6 Rewards

- User can claim earned reward.
- Claim emits event.
- Claim resets claimable balance.
- Claim fails when reward is zero.
- ETH transfer uses reentrancy-safe pattern.

## 28.7 Survey close/refund

- Creator can close survey.
- Non-creator cannot close survey.
- Closed survey rejects new responses.
- Creator can withdraw unused funds.
- Withdraw cannot happen twice.

---

## 29. Deployment Requirements

## 29.1 Smart contract

Deploy to Sepolia.

README must include:

```txt
Network: Sepolia
Contract Address: 0x...
Etherscan Link: https://sepolia.etherscan.io/address/0x...
```

## 29.2 Next.js Web App

Deploy the Next.js web app to Vercel.

README must include:

```txt
Live URL: https://...
```

## 29.3 Supabase

Create:

- Supabase project,
- private storage bucket `kyc-documents`,
- tables from `supabase/schema.sql`,
- RLS policies or server-only service-role access for admin routes.

---

## 30. README Requirements

README must include:

1. Project name and description.
2. Group members and roles.
3. Tech stack.
4. Architecture diagram or text flow.
5. Smart contract address on Sepolia.
6. Live web app URL.
7. Setup instructions.
8. How to run Hardhat tests.
9. How to deploy contract.
10. How to run the Next.js web app locally.
11. How to configure Supabase.
12. How to get Sepolia ETH.
13. Screenshots.
14. Demo flow.
15. KYC privacy explanation.
16. Verified Respondent Pass explanation.
17. Response Quality Gate explanation.
18. Completion Proof explanation.
19. Answer Integrity explanation.
20. Known limitations.
21. Credits and references.

---

## 31. Demo Script

1. Open deployed app.
2. Connect MetaMask.
3. Switch to Sepolia.
4. Sign wallet login message.
5. Admin grants creator role or uses admin wallet.
6. Creator creates a survey and deposits Sepolia ETH.
7. Respondent connects wallet.
8. Respondent signs login message.
9. Respondent uploads dummy ID + selfie for demo KYC.
10. Admin reviews KYC images through signed URLs.
11. Admin approves KYC on-chain.
12. UI shows Verified Respondent Pass.
13. Respondent opens a survey and starts an attempt.
14. Respondent answers required questions and attention check.
15. Backend runs Response Quality Gate.
16. Backend stores answer in Supabase.
17. Backend computes answer hash.
18. Backend signs completion proof.
19. Respondent submits proof on-chain through MetaMask.
20. Contract verifies proof and credits claimable reward.
21. Respondent claims Sepolia ETH.
22. Show duplicate answer is blocked.
23. Show failed validation example.
24. Show admin response audit panel.
25. Click Verify Answer Integrity.
26. Show Hardhat tests passing.

---

## 32. Grading Alignment

## 32.1 Correctness and functionality — 30 pts

- Wallet connection works.
- Wallet signature authentication works.
- Sepolia guard works.
- KYC flow works.
- Verified Respondent Pass works.
- Survey creation works.
- Reward escrow works.
- Answer submission works.
- Response Quality Gate works.
- Completion Proof reward credit works.
- Reward claim works.

## 32.2 Cryptography and blockchain depth — 25 pts

- KYC proof hash.
- Answer hash commitment.
- Salted answer hash.
- EIP-712 completion proof.
- On-chain verification status.
- Smart contract escrow.
- Role-based access control.
- Nonce and deadline replay protection.
- Event-driven updates.
- Claimable reward transfer.

## 32.3 Code quality — 15 pts

- Clean structure.
- TypeScript types.
- Hooks/components separation.
- No secrets committed.
- Contract tests pass.
- Next.js web build passes.

## 32.4 Documentation — 10 pts

- README complete.
- Setup instructions complete.
- Contract address and live URL included.
- Privacy and limitation sections included.
- Credits and references included.

## 32.5 Presentation and demo — 15 pts

- Demo shows wallet, KYC, survey creation, answer validation, proof submission, automatic reward credit, claim, duplicate block, and integrity verification.

## 32.6 Teamwork and contribution — 5 pts

- Each member has individual contribution statement.
- Commits/PRs are linked.

---

## 33. Minimum Defensible MVP

If time is limited, the minimum defensible MVP is:

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

Optional but strong:

```txt
- CAPTCHA
- honeypot field
- text quality scoring
- straight-lining detection
- refresh expired proof
- Verify Answer Integrity button
- admin audit notes
```

---

## 34. Final Defense Positioning

Use this answer if asked what the system contributes:

> SurveyChain Rewards contributes a trust layer for rewarded surveys. It does not claim to fully solve human sincerity or replace real KYC. Instead, it combines smart contract escrow, verified participation, off-chain response quality validation, signed completion proofs, and on-chain answer commitments. This gives creators more confidence that they are paying validated respondents, while giving respondents confidence that rewards are funded and automatically claimable after valid completion.

Use this answer if asked why blockchain is needed:

> Blockchain is used for the parts where public trust matters: funded reward escrow, verification status, answer hash commitments, completion records, and claimable rewards. Private data such as KYC images and raw answers remain off-chain in Supabase.

Use this answer if asked whether it stops bots:

> It does not guarantee all bots are stopped. Instead, it reduces bot and low-effort submissions using verification, duplicate prevention, required fields, answer format checks, attention checks, minimum completion time, and optional bot challenges. Most importantly, the backend does not sign a completion proof for responses that fail these checks, so the smart contract will not credit rewards.

---

## 35. Final Recommendation

The final project should not be marketed as a generic survey app. It should be marketed as:

> A blockchain-based escrow and proof-of-completion system for verified survey rewards.

The strongest final version is:

```txt
Admin/approved creator creates funded surveys.
Users complete demo KYC to receive a Verified Respondent Pass.
KYC images are stored privately in Supabase.
KYC proof hash is stored on-chain.
Verified users submit survey answers.
The Response Quality Gate validates answers off-chain.
Raw answers are stored in Supabase.
Answer hashes are stored on-chain.
The backend signs a completion proof only for valid responses.
The smart contract verifies the proof and credits claimable rewards.
Users claim Sepolia ETH through the smart contract.
Admins can audit, flag, and revoke future eligibility.
```

This version is production-like enough to defend, blockchain-heavy enough for a cryptography/blockchain final project, and still feasible if scoped carefully.
