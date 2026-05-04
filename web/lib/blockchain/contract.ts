export const SURVEY_REWARD_ABI = [
  "function ADMIN_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function surveyCount() view returns (uint256)",
  "function isVerified(address wallet) view returns (bool)",
  "function claimableRewards(address) view returns (uint256)",
  "function totalEarned(address) view returns (uint256)",
  "function surveys(uint256) view returns (address creator, string title, string description, string question, uint256 rewardPerResponse, uint256 maxResponses, uint256 responseCount, uint256 escrowRemaining, bool active, bool unusedRewardsWithdrawn)",
  "function hasSubmittedSurveyResponse(uint256, address) view returns (bool)",
  "function claimRewards()",
  "function submitResponseWithProof(uint256 surveyId, bytes32 answerHash, uint256 rewardAmount, uint256 nonce, uint256 deadline, bytes signature)",
  "function requestVerification(bytes32 kycProofHash)",
  "function createSurvey(string title, string description, string question, string[] options, uint256 rewardPerResponse, uint256 maxResponses) payable",
  "event RewardsClaimed(address indexed respondent, uint256 amount)",
  "event ResponseSubmitted(uint256 indexed surveyId, address indexed respondent, bytes32 indexed answerHash, uint256 rewardAmount, uint256 nonce)",
  "event VerificationRequested(address indexed wallet, bytes32 indexed proofHash)",
  "event SurveyCreated(uint256 indexed surveyId, address indexed creator, uint256 rewardPerResponse, uint256 maxResponses, uint256 escrowAmount)"
] as const;

export type SurveyStruct = {
  creator: string;
  title: string;
  description: string;
  question: string;
  rewardPerResponse: bigint;
  maxResponses: bigint;
  responseCount: bigint;
  escrowRemaining: bigint;
  active: boolean;
  unusedRewardsWithdrawn: boolean;
};

export type SurveySummary = SurveyStruct & {
  id: bigint;
  options: string[] | null;
};

export function toSurveySummary(
  surveyId: bigint | number,
  survey: SurveyStruct
): SurveySummary {
  return { ...survey, id: BigInt(surveyId), options: null };
}

export const SEPOLIA_CHAIN_ID = 11155111;

export function getContractAddress(): string | null {
  return process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? process.env.CONTRACT_ADDRESS ?? null;
}

export function getExpectedChainId(): number {
  const raw = process.env.NEXT_PUBLIC_CHAIN_ID;
  return raw ? parseInt(raw, 10) : SEPOLIA_CHAIN_ID;
}
