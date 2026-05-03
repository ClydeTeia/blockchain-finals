export type SurveyStatus = "active" | "closed";

export type SurveyRecord = {
  id: bigint;
  creator: string;
  title: string;
  description: string;
  question: string;
  options: string[];
  rewardPerResponse: bigint; // wei
  maxResponses: bigint;
  responseCount: bigint;
  escrowRemaining: bigint; // wei
  active: boolean;
  createdAt: Date;
};

export type CreateSurveyInput = {
  title: string;
  description: string;
  question: string;
  options: string[];
  rewardPerResponseWei: string; // wei as string for form
  maxResponses: number;
};

export type CreateSurveyOutput = {
  surveyId: bigint;
  txHash: string;
};
