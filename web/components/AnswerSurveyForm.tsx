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

const ATTENTION_CHECK_QUESTION = "Which color is the sky on a clear day?";
const ATTENTION_CHECK_OPTIONS = ["Red", "Green", "Blue", "Yellow"];
const ATTENTION_CHECK_CORRECT = "Blue";

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
  const [attentionAnswer, setAttentionAnswer] = useState<string>("");
  const [honeypot, setHoneypot] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);

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

    if (attentionAnswer !== ATTENTION_CHECK_CORRECT) {
      setLocalError("Attention check failed. Please read each question carefully.");
      return;
    }

    const completionTimeSeconds = Math.floor(
      (Date.now() - startedAt.getTime()) / 1000
    );

    onSubmit(answers, survey.rewardPerResponse.toString(), completionTimeSeconds);
  }

  const displayError = localError ?? error;
  const hasRequiredAnswers = questions.every(
    (question) => !question.required || Boolean(answers[question.id]?.trim())
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {questions.map((question, index) => (
        <section key={question.id} className="surface">
          <h2 className="text-lg font-semibold mb-2">{`Question ${index + 1}`}</h2>
          <p className="text-base mb-3">{question.prompt}</p>

          {question.type === "multiple_choice" && question.options?.length ? (
            <div className="flex flex-col gap-2">
              {question.options.map((option) => (
                <label key={option} className="text-sm" style={{ display: "block" }}>
                  <input
                    type="radio"
                    name={`answer-${question.id}`}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={() => setAnswer(question.id, option)}
                    disabled={isSubmitting}
                  />{" "}
                  {option}
                </label>
              ))}
            </div>
          ) : (
            <textarea
              value={answers[question.id] ?? ""}
              onChange={(event) => setAnswer(question.id, event.target.value)}
              disabled={isSubmitting}
              rows={4}
              className="form-input"
              placeholder="Type your answer"
            />
          )}
        </section>
      ))}

      <section className="surface">
        <h3 className="text-base font-semibold mb-2">{ATTENTION_CHECK_QUESTION}</h3>
        <div className="flex flex-col gap-2">
          {ATTENTION_CHECK_OPTIONS.map((opt) => (
            <label key={opt} className="text-sm" style={{ display: "block" }}>
              <input
                type="radio"
                name="attention"
                value={opt}
                checked={attentionAnswer === opt}
                onChange={() => setAttentionAnswer(opt)}
                disabled={isSubmitting}
              />{" "}
              {opt}
            </label>
          ))}
        </div>
      </section>

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

      {displayError && <p style={{ color: "red" }}>{displayError}</p>}

      <button type="submit" disabled={isSubmitting || !hasRequiredAnswers} className="btn btn-primary">
        {isSubmitting ? "Submitting..." : "Submit Answer"}
      </button>
    </form>
  );
}
