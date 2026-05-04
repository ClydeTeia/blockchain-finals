"use client";

import type { ValidationResult } from "@/hooks/useAnswerSubmission";

type UseResponseQualityResult = {
  passed: boolean;
  score: number;
  reason: string | null;
  statusLabel: "passed" | "failed";
};

export function useResponseQuality(result: ValidationResult | null): UseResponseQualityResult | null {
  if (!result) {
    return null;
  }

  return {
    passed: result.passed,
    score: result.score,
    reason: result.reason ?? null,
    statusLabel: result.passed ? "passed" : "failed"
  };
}

