"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { ethers } from "ethers";

type Survey = {
  id: string;
  title: string;
  description: string;
  question: string;
  options: string[];
  rewardPerResponse: string;
  maxResponses: string;
  responseCount: string;
  active: boolean;
};

type AnswerFormProps = {
  survey: Survey;
  onSuccess: (data: { answerId: string; proof: any }) => void;
  onError: (msg: string) => void;
};

export default function AnswerSurveyForm({ survey, onSuccess, onError }: AnswerFormProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [validation, setValidation] = useState<{ passed: boolean; score: number; reason: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) {
      onError("Please select an option");
      return;
    }

    setSubmitting(true);
    const completionTime = Math.floor((Date.now() - startTime) / 1000);

    try {
      const attemptRes = await fetch(`/api/surveys/${survey.id}/start-attempt`, {
        method: "POST"
      });
      if (!attemptRes.ok) {
        const err = await attemptRes.json();
        throw new Error(err.error || "Failed to start attempt");
      }
      const { attemptId } = await attemptRes.json();

      const answerPayload = {
        attemptId,
        surveyId: survey.id,
        rewardAmountWei: survey.rewardPerResponse,
        answer: { selectedOption, text: "" },
        completionTimeSeconds: completionTime
      };

      const res = await fetch("/api/answers/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answerPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setValidation({
        passed: data.validation.passed,
        score: data.validation.score,
        reason: data.validation.reason
      });

      if (data.validation.passed && data.proof) {
        onSuccess({ answerId: data.answerId, proof: data.proof });
      } else {
        onError(data.validation.reason || "Validation failed");
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Submission error");
    } finally {
      setSubmitting(false);
    }
  };

  if (validation) {
    return (
      <div className={`p-6 rounded-lg ${validation.passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
        <h3 className="text-lg font-semibold mb-2">
          {validation.passed ? "Validation Passed!" : "Validation Failed"}
        </h3>
        <p className="text-sm mb-2">Score: {validation.score}</p>
        <p className="text-sm mb-4">{validation.reason}</p>
        {validation.passed && (
          <p className="text-sm text-blue-600">
            Please proceed to the next step to submit your proof on-chain.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3">{survey.question}</h3>
        <div className="space-y-3">
          {survey.options.map((opt) => (
            <label key={opt} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="option"
                value={opt}
                checked={selectedOption === opt}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="mr-3"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || !selectedOption}
        className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
      >
        {submitting ? "Submitting..." : "Submit Answer"}
      </button>

      <p className="text-xs text-gray-500 text-center">
        By submitting, you confirm this is your original response.
      </p>
    </form>
  );
}
