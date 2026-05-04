"use client";

import { useCallback, useEffect, useState } from "react";

export type SurveySummary = {
  id: number;
  creator: string;
  title: string;
  description: string;
  question: string;
  rewardPerResponse: string;
  maxResponses: string;
  responseCount: string;
  escrowRemaining: string;
  active: boolean;
  unusedRewardsWithdrawn: boolean;
  options: string[];
  questions?: Array<{
    id: string;
    prompt: string;
    type: "multiple_choice" | "text";
    required: boolean;
    options?: string[];
  }>;
};

type UseSurveysResult = {
  surveys: SurveySummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useSurveys(): UseSurveysResult {
  const [surveys, setSurveys] = useState<SurveySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/surveys");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as { surveys?: SurveySummary[] };
      setSurveys(data.surveys ?? []);
    } catch {
      setError("Failed to load surveys. Please try again later.");
      setSurveys([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { surveys, isLoading, error, refetch };
}
