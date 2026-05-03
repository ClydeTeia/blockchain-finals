# SurveyChain Rewards - Demo Guide

## Quick Start Demo (5-minute flow)

### Prerequisites
- Node.js 18+ installed
- MetaMask browser extension installed
- Sepolia ETH in your wallet (get from faucet)

### 1. Start the Application

```powershell
# Install dependencies
pnpm install

# Start development server
cd web
pnpm dev
```

Open http://localhost:3000

### 2. Demo Flow

**Step 1: Wallet Connection**
- Click "Connect Wallet" modal that appears
- MetaMask prompts to connect
- After connecting, ensure you're on Sepolia network (prompt appears if not)
- Header shows connected wallet address

**Step 2: Get Verified (KYC)**
- Click "Get Verified" in header
- (Demo: verification status shows as "Not verified")
- In a full deployment, user would upload ID/selfie here
- For demo purposes, admin manually approves on-chain

**Step 3: Admin Approval (Open in new window with admin wallet)**
- Switch MetaMask to admin/deployer account
- Navigate to http://localhost:3000/admin
- Admin dashboard loads with Response Audit tab
- (In full flow: admin would approve KYC requests via contract)

**Step 4: Create a Survey (as Creator)**
- Switch to a creator account (must have CREATOR_ROLE)
- If using deployer wallet, you already have CREATOR_ROLE
- Click "Create Survey" in header
- Fill in:
  - Title: "User Satisfaction Survey"
  - Description: "How do you like our app?"
  - Question: "Rate your experience (1-5)"
  - Options: "1", "2", "3", "4", "5"
  - Reward per response: `0.001` ETH
  - Max responses: `3`
- Total escrow shows: `0.003 ETH`
- Click "Prepare Contract Call"
- MetaMask transaction window opens
- Confirm the transaction
- Wait for confirmation
- Survey appears on home page feed

**Step 5: Answer a Survey (as Respondent)**
- Switch to a verified respondent wallet
- On home page, click "Answer Survey" on the created survey
- Read question, select an option
- Click "Submit Answer"
- Validation runs (quality gate)
- If passed: "Validation Passed!" message
- Click through MetaMask transaction to submit proof
- Transaction confirms on Sepolia
- Redirect to Rewards Dashboard

**Step 6: View Rewards**
- Click "My Rewards" in header
- See claimable ETH amount
- Click "Claim Now"
- MetaMask transaction executes
- Rewards transferred to wallet
- History table shows completed responses

### 3. Test Data Setup

If you don't have a creator/respondent account:

```powershell
# Grant creator role to any wallet from admin console:
npx hardhat console --network sepolia

# In console:
const contract = await ethers.getContractAt("SurveyReward", "0xCONTRACT_ADDRESS");
await contract.grantCreatorRole("0xUSER_WALLET");
```

### 4. Environment Variables for Full Integration

```env
# web/.env.local
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=11155111
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
CONTRACT_ADDRESS=0x...
SESSION_SECRET=random_string_here
```

### 5. Key Routes

| Route | Purpose |
|-------|---------|
| `/` | Survey feed (all active surveys) |
| `/surveys/create` | Create new survey (creator only) |
| `/surveys/:id` | Answer a specific survey |
| `/rewards` | Claimable/earned rewards dashboard |
| `/admin` | Admin audit panel (admin only) |
| `/kyc` | KYC verification page |

## Integration Checklist

### Frontend ✅
- [x] Wallet connection modal
- [x] Network guard for Sepolia
- [x] Survey feed from blockchain
- [x] Survey creation with MetaMask tx
- [x] Survey answering with quality gate
- [x] Completion proof submission
- [x] Rewards dashboard with claim
- [x] Admin audit panel with flag/note/integrity verify

### Backend ✅
- [x] Auth routes: nonce, verify, me, logout
- [x] Survey routes: list, get, create (role-checked)
- [x] Attempt start route
- [x] Answer submit route with proof generation
- [x] Answer confirm on-chain route
- [x] Rewards read route (claimable/total)
- [x] Admin audit routes (all answers, flag, note, verify)

### Smart Contract ✅
- [x] Role-based access (ADMIN, CREATOR, VERIFIER, VALIDATOR)
- [x] Survey creation with escrow
- [x] Verification status mapping
- [x] Response submission with EIP-712 proof validation
- [x] Nonce and deadline replay protection
- [x] Claimable rewards tracking
- [x] Claim function with reentrancy guard
- [x] Events for all key actions

### Database Schema ✅
- [x] `surveys` table
- [x] `survey_answers` table
- [x] `survey_attempts` table
- [x] `kyc_requests` table
- [x] `survey_quality_rules` table
- [x] `auth_nonces` table
- [x] `audit_logs` table

## Demo Validation Points

For defense presentation, demonstrate:

1. **Escrow**: Survey creator deposits ETH, contract holds it
2. **Verified Respondent Pass**: Only verified wallets can answer
3. **Quality Gate**: Backend validates before signing proof
4. **Completion Proof**: Backend signs EIP-712, contract verifies
5. **Answer Integrity**: Off-chain answer hash matches on-chain
6. **Claimable Rewards**: Auto-credited, user withdraws via `claimRewards()`
7. **Admin Audit**: Flag responses, add notes, verify integrity

## Troubleshooting

**Wallet not connecting**: Ensure MetaMask is installed and `http://localhost:3000` is allowed.

**Wrong network error**: Switch MetaMask to Sepolia (chain ID 11155111).

**Survey creation fails**: Wallet needs CREATOR_ROLE. Use deployer wallet or grant role via contract.

**Answer submission fails**: Wallet must be verified on-chain (status = Approved).

**Claim fails**: Must have `claimableRewards > 0` in contract.

**RPC errors**: Check `SEPOLIA_RPC_URL` is valid and not rate-limited.

**Session errors**: Set `SESSION_SECRET` in `.env.local`.

## Agent Validation

Run automated checks:

```powershell
# Type checking
cd web && npm run typecheck

# Linting
cd web && npm run lint

# All tests
pnpm test

# Build check
cd web && npm run build
```
