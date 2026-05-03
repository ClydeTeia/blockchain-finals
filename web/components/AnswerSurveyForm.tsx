"use client";

import { useState } from "react";
import type { SurveyStruct } from "@/lib/blockchain/contract";

const ATTENTION_CHECK_QUESTION = "Which color is the sky on a clear day?";
const ATTENTION_CHECK_OPTIONS = ["Red", "Green", "Blue", "Yellow"];
const ATTENTION_CHECK_CORRECT = "Blue";

type AnswerSurveyFormProps = {
  survey: SurveyStruct;
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
  const [selected, setSelected] = useState<string>("");
  const [attentionAnswer, setAttentionAnswer] = useState<string>("");
  // Hidden honeypot — must stay empty; bots tend to fill all visible fields
  const [honeypot, setHoneypot] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (honeypot) {
      // Silent fail — don't reveal honeypot to potential bot
      setLocalError("Submission blocked. Please refresh and try again.");
      return;
    }

    if (!selected) {
      setLocalError("Select an answer before submitting.");
      return;
    }

    if (attentionAnswer !== ATTENTION_CHECK_CORRECT) {
      setLocalError(
        `Attention check failed. Please read each question carefully.`
      );
      return;
    }

    const completionTimeSeconds = Math.floor(
      (Date.now() - startedAt.getTime()) / 1000
    );

    onSubmit(
      { answer: selected },
      survey.rewardPerResponse.toString(),
      completionTimeSeconds
    );
  }

  const displayError = localError ?? error;

  return (
    <form onSubmit={handleSubmit}>
      <section>
        <h2>{survey.question}</h2>
        {survey.options.map((opt) => (
          <label key={opt} style={{ display: "block", marginBottom: "0.5rem" }}>
            <input
              type="radio"
              name="answer"
              value={opt}
              checked={selected === opt}
              onChange={() => setSelected(opt)}
              disabled={isSubmitting}
            />{" "}
            {opt}
          </label>
        ))}
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h3>{ATTENTION_CHECK_QUESTION}</h3>
        {ATTENTION_CHECK_OPTIONS.map((opt) => (
          <label key={opt} style={{ display: "block", marginBottom: "0.5rem" }}>
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
      </section>

      {/* Honeypot — hidden via inline style, not display:none (more convincing to bots) */}
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

      {displayError && (
        <p style={{ color: "red", marginTop: "1rem" }}>{displayError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !selected}
        style={{ marginTop: "1.5rem" }}
      >
        {isSubmitting ? "Submitting..." : "Submit Answer"}
      </button>
    </form>
  );
}
