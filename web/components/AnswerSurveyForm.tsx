"use client";

import { useMemo, useState } from "react";

type SurveyQuestion = {
  id: string;
  prompt: string;
  type: "multiple_choice" | "text";
  required: boolean;
  options?: string[];
};

type AnswerSurveyFormProps = {
  survey: {
    rewardPerResponse: string;
    question: string;
    options: string[];
    questions?: SurveyQuestion[];
  };
  startedAt: Date;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (
    answer: Record<string, string>,
    rewardAmountWei: string,
    completionTimeSeconds: number
  ) => void;
};

export function AnswerSurveyForm({
  survey,
  startedAt,
  isSubmitting,
  error,
  onSubmit,
}: AnswerSurveyFormProps) {
  const questions = useMemo<SurveyQuestion[]>(() => {
    if (survey.questions && survey.questions.length > 0) {
      return survey.questions;
    }

    return [
      {
        id: "q_1",
        prompt: survey.question,
        type: survey.options?.length ? "multiple_choice" : "text",
        required: true,
        options: survey.options?.length ? survey.options : undefined,
      },
    ];
  }, [survey]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const currentQuestion = questions[stepIndex];

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (honeypot) {
      setLocalError("Submission blocked. Please refresh and try again.");
      return;
    }

    for (const question of questions) {
      const value = answers[question.id]?.trim() ?? "";
      if (question.required && !value) {
        setLocalError("Please answer all required questions before submitting.");
        return;
      }
    }

    const completionTimeSeconds = Math.floor(
      (Date.now() - startedAt.getTime()) / 1000
    );

    onSubmit(answers, survey.rewardPerResponse.toString(), completionTimeSeconds);
  }

  const displayError = localError ?? error;
  const canGoNext = (() => {
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;
    return Boolean(answers[currentQuestion.id]?.trim());
  })();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {currentQuestion && (
        <section key={currentQuestion.id} className="surface">
          <h2 className="text-lg font-semibold mb-2">{`Question ${stepIndex + 1} of ${questions.length}`}</h2>
          <p className="text-base mb-3">{currentQuestion.prompt}</p>

          {currentQuestion.type === "multiple_choice" && currentQuestion.options?.length ? (
            <div className="flex flex-col gap-2">
              {currentQuestion.options.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={`answer-${currentQuestion.id}`}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={() => setAnswer(currentQuestion.id, option)}
                    disabled={isSubmitting}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              value={answers[currentQuestion.id] ?? ""}
              onChange={(event) => setAnswer(currentQuestion.id, event.target.value)}
              disabled={isSubmitting}
              rows={4}
              className="form-input"
              placeholder="Type your answer"
            />
          )}
        </section>
      )}

      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
        <label htmlFor="website">Leave blank</label>
        <input
          id="website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {displayError && <p className="text-danger text-sm font-medium">{displayError}</p>}
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={isSubmitting || stepIndex === 0}
          onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
        >
          Previous
        </button>
        {stepIndex < questions.length - 1 ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={isSubmitting || !canGoNext}
            onClick={() => setStepIndex((prev) => Math.min(questions.length - 1, prev + 1))}
          >
            Next
          </button>
        ) : (
          <button 
            type="submit" 
            disabled={isSubmitting || !canGoNext} 
            className="btn btn-primary"
          >
            {isSubmitting ? "Submitting..." : "Submit Answer"}
          </button>
        )}
      </div>
    </form>
  );
}
