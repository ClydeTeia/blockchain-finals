export const SURVEY_REWARD_ABI = [
  "function isVerified(address wallet) view returns (bool)",
  "function claimableRewards(address) view returns (uint256)",
  "function totalEarned(address) view returns (uint256)",
  "function getSurvey(uint256 surveyId) view returns (tuple(uint256 id, address creator, string title, string description, string question, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 responseCount, uint256 escrowRemaining, bool active, uint256 createdAt))",
  "function getAllSurveys() view returns (tuple(uint256 id, address creator, string title, string description, string question, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 responseCount, uint256 escrowRemaining, bool active, uint256 createdAt)[])",
  "function hasSubmittedSurveyResponse(uint256, address) view returns (bool)",
  "function claimRewards()",
  "function submitResponseWithProof(uint256 surveyId, bytes32 answerHash, uint256 rewardAmount, uint256 nonce, uint256 deadline, bytes signature)",
  "function requestVerification(bytes32 kycProofHash)",
  "function createSurvey(string title, string description, string question, string[] options, uint256 rewardPerResponse, uint256 maxResponses) payable",
  "event RewardsClaimed(address indexed respondent, uint256 amount)",
  "event ResponseSubmitted(uint256 indexed surveyId, address indexed respondent, bytes32 indexed answerHash, uint256 rewardAmount, uint256 nonce)",
  "event VerificationRequested(address indexed wallet, bytes32 indexed proofHash)",
] as const;

export type SurveyStruct = {
  id: bigint;
  creator: string;
  title: string;
  description: string;
  question: string;
  options: string[];
  rewardPerResponse: bigint;
  maxResponses: bigint;
  responseCount: bigint;
  escrowRemaining: bigint;
  active: boolean;
  createdAt: bigint;
};

export const SEPOLIA_CHAIN_ID = 11155111;

export function getContractAddress(): string | null {
  return process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? null;
}

export function getExpectedChainId(): number {
  const raw = process.env.NEXT_PUBLIC_CHAIN_ID;
  return raw ? parseInt(raw, 10) : SEPOLIA_CHAIN_ID;
}
