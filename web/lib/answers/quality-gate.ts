type QualityGateResult = {
  passed: boolean;
  score: number;
  reason: string | null;
  details: Record<string, unknown>;
};

function getRuleNumber(envName: string, fallback: number): number {
  const raw = process.env[envName];
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

export function evaluateQualityGate(input: {
  answerJson: unknown;
  completionTimeSeconds: number;
}): QualityGateResult {
  const minCompletionSeconds = getRuleNumber(
    "QUALITY_MIN_COMPLETION_SECONDS",
    30
  );
  const minTextLength = getRuleNumber("QUALITY_MIN_TEXT_LENGTH", 20);
  const passingScore = getRuleNumber("QUALITY_PASSING_SCORE", 70);

  let score = 100;
  const details: Record<string, unknown> = {
    minCompletionSeconds,
    minTextLength,
    passingScore
  };

  if (input.completionTimeSeconds < minCompletionSeconds) {
    score -= 50;
    details.failedCompletionTime = true;
  }

  const textLength = JSON.stringify(input.answerJson ?? "").length;
  details.answerTextLength = textLength;
  if (textLength < minTextLength) {
    score -= 30;
    details.failedTextLength = true;
  }

  if (typeof input.answerJson !== "object" || input.answerJson === null) {
    score -= 40;
    details.failedAnswerShape = true;
  }

  if (score < 0) {
    score = 0;
  }

  if (score < passingScore) {
    return {
      passed: false,
      score,
      reason: "Response failed quality gate.",
      details
    };
  }

  return {
    passed: true,
    score,
    reason: null,
    details
  };
}

