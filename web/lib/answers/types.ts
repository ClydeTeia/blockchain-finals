export type SurveyAttemptStatus = "started" | "submitted";

export type SurveyAttemptRecord = {
  id: string;
  surveyId: bigint;
  respondentWallet: string;
  status: SurveyAttemptStatus;
  startedAt: Date;
  submittedAt: Date | null;
  userAgent: string | null;
  ipHash: string | null;
  createdAt: Date;
};

export type AnswerStatus =
  | "submitted_offchain"
  | "failed_validation"
  | "pending_onchain"
  | "completed_onchain"
  | "claimed"
  | "failed_onchain"
  | "flagged";

export type SurveyAnswerRecord = {
  id: string;
  attemptId: string;
  surveyId: bigint;
  respondentWallet: string;
  answerJson: unknown;
  normalizedAnswerJson: unknown;
  answerHash: string;
  salt: string;
  status: AnswerStatus;
  validationScore: number;
  validationStatus: "passed" | "failed";
  validationReason: string | null;
  validationDetails: Record<string, unknown>;
  startedAt: Date;
  submittedAt: Date;
  completionTimeSeconds: number;
  rewardAmountWei: string;
  completionNonce: string;
  completionDeadline: Date | null;
  completionSignature: string | null;
  onchainTxHash: string | null;
  onchainConfirmedAt: Date | null;
  flagged: boolean;
  auditNotes: string | null;
  createdAt: Date;
};

export type SubmitAnswerPayload = {
  surveyId: bigint;
  respondentWallet: string;
  attemptId: string;
  answerJson: unknown;
  normalizedAnswerJson: unknown;
  answerHash: string;
  salt: string;
  validationScore: number;
  validationStatus: "passed" | "failed";
  validationReason: string | null;
  validationDetails: Record<string, unknown>;
  completionTimeSeconds: number;
  rewardAmountWei: string;
  completionNonce: string;
  completionDeadline: Date | null;
  completionSignature: string | null;
};
