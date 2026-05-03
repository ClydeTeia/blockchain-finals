"use client";

import type { ValidationResult } from "@/hooks/useAnswerSubmission";

type ResponseQualityResultProps = {
  result: ValidationResult;
};

export function ResponseQualityResult({ result }: ResponseQualityResultProps) {
  if (result.passed) {
    return (
      <div>
        <p style={{ color: "green" }}>
          <strong>Validation passed</strong> — score: {result.score}
        </p>
        <p>Your response has been accepted. Complete the reward transaction below.</p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ color: "red" }}>
        <strong>Validation failed</strong> — score: {result.score}
      </p>
      {result.reason && <p>{result.reason}</p>}
      <p>
        <small>
          No reward is available for this submission. You may return to the
          survey list.
        </small>
      </p>
    </div>
  );
}
