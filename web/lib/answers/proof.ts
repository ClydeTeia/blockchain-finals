import { Wallet, isHexString, keccak256, toUtf8Bytes } from "ethers";

export type CompletionProofPayload = {
  respondent: string;
  surveyId: bigint;
  answerHash: string;
  rewardAmount: bigint;
  nonce: bigint;
  deadline: bigint;
};

function getValidatorWallet(): Wallet {
  const privateKey = process.env.VALIDATOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("VALIDATOR_PRIVATE_KEY is required.");
  }
  return new Wallet(privateKey);
}

function getDomain() {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "11155111");
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS is required.");
  }

  return {
    name: "SurveyChainRewards",
    version: "1",
    chainId,
    verifyingContract: contractAddress
  };
}

export function normalizeAnswer(answerJson: unknown): string {
  if (typeof answerJson === "string") {
    return answerJson.trim();
  }
  return JSON.stringify(answerJson);
}

export function hashAnswer(normalizedAnswer: string, salt: string): string {
  return keccak256(toUtf8Bytes(`${normalizedAnswer}:${salt}`));
}

export function buildProofNonce(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export async function signCompletionProof(
  payload: CompletionProofPayload
): Promise<string> {
  if (!isHexString(payload.answerHash, 32)) {
    throw new Error("answerHash must be bytes32 hex.");
  }

  const wallet = getValidatorWallet();
  const domain = getDomain();
  const types = {
    CompletionProof: [
      { name: "respondent", type: "address" },
      { name: "surveyId", type: "uint256" },
      { name: "answerHash", type: "bytes32" },
      { name: "rewardAmount", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  };

  return wallet.signTypedData(domain, types, {
    respondent: payload.respondent,
    surveyId: payload.surveyId,
    answerHash: payload.answerHash,
    rewardAmount: payload.rewardAmount,
    nonce: payload.nonce,
    deadline: payload.deadline
  });
}

