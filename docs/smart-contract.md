# SurveyReward Contract Interface

## Contract
- `contracts/contracts/SurveyReward.sol`
- Network target: Sepolia (project policy)

## Roles
- `ADMIN_ROLE`
- `CREATOR_ROLE`
- `VERIFIER_ROLE`
- `VALIDATOR_ROLE`

Deployer is assigned all roles in constructor.

## Core Data and State
- `surveyCount`
- `surveys[surveyId]` with escrow, capacity, active/closed, and withdrawal status
- `verificationStatus[wallet]`
- `verificationProofHash[wallet]`
- `hasSubmittedSurveyResponse[surveyId][wallet]`
- `usedProofNonces[nonce]`
- `claimableRewards[wallet]`
- `totalEarned[wallet]`

## EIP-712 Completion Proof
- Domain:
  - `name: "SurveyChainRewards"`
  - `version: "1"`
  - `chainId: block.chainid`
  - `verifyingContract: address(this)`
- Type:
  - `CompletionProof(address respondent,uint256 surveyId,bytes32 answerHash,uint256 rewardAmount,uint256 nonce,uint256 deadline)`

## Key Functions
- `grantCreatorRole(address account)`
- `revokeCreatorRole(address account)`
- `requestVerification(bytes32 kycProofHash)`
- `approveVerification(address wallet)`
- `rejectVerification(address wallet, string reason)`
- `revokeVerification(address wallet)`
- `createSurvey(string title, string description, string question, string[] options, uint256 rewardPerResponse, uint256 maxResponses)`
- `submitResponseWithProof(uint256 surveyId, bytes32 answerHash, uint256 rewardAmount, uint256 nonce, uint256 deadline, bytes signature)`
- `claimRewards()`
- `closeSurvey(uint256 surveyId)`
- `withdrawUnusedRewards(uint256 surveyId)`
- `pause()`
- `unpause()`
- `isVerified(address wallet) returns (bool)`
- `getCompletionProofDigest((address,uint256,bytes32,uint256,uint256,uint256) proof) returns (bytes32)`

## Storage/Data Safety
- Stores wallet addresses, verification status, survey reward state, answer hash, and reward accounting.
- Does not store raw KYC images or raw survey answers.

## Proof and Reward Validation Rules
- `submitResponseWithProof` rejects:
  - unverified respondent
  - missing/nonexistent/inactive/full survey
  - duplicate respondent submission for the same survey
  - zero `answerHash`
  - expired proof
  - reused proof nonce
  - reward amount mismatch against survey reward
  - insufficient escrow
  - signature not from `VALIDATOR_ROLE`
- `claimRewards` is non-reentrant, rejects zero claimable balance, and resets claimable before transfer.
