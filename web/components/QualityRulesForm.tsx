"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";

type RuleType = "required" | "minLength" | "maxLength" | "pattern" | "minTime" | "attentionCheck";
type RuleField = "answer" | "completionTimeSeconds" | "attentionCheck";

type QualityRule = {
  type: RuleType;
  field: RuleField;
  value: string;
  message: string;
};

type RulePreset = {
  id: "lenient" | "balanced" | "strict";
  name: string;
  description: string;
  rules: QualityRule[];
};

const PRESETS: RulePreset[] = [
  {
    id: "lenient",
    name: "Lenient",
    description: "Fast participation with basic protection against empty answers.",
    rules: [
      { type: "required", field: "answer", value: "true", message: "Answer is required." },
      { type: "minTime", field: "completionTimeSeconds", value: "5", message: "Please spend at least 5 seconds." },
    ],
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Recommended default. Better quality checks with minimal friction.",
    rules: [
      { type: "required", field: "answer", value: "true", message: "Answer is required." },
      { type: "minLength", field: "answer", value: "20", message: "Please provide a more complete answer." },
      { type: "minTime", field: "completionTimeSeconds", value: "10", message: "Please spend at least 10 seconds." },
      { type: "attentionCheck", field: "attentionCheck", value: "true", message: "Attention check failed." },
    ],
  },
  {
    id: "strict",
    name: "Strict",
    description: "Highest filtering for data quality and anti-rush responses.",
    rules: [
      { type: "required", field: "answer", value: "true", message: "Answer is required." },
      { type: "minLength", field: "answer", value: "40", message: "Please provide a detailed answer." },
      { type: "minTime", field: "completionTimeSeconds", value: "20", message: "Please spend at least 20 seconds." },
      { type: "attentionCheck", field: "attentionCheck", value: "true", message: "Attention check failed." },
    ],
  },
];

type QualityRulesFormProps = {
  surveyId: number | bigint;
  onSuccess?: (rules: any[]) => void;
  onCancel?: () => void;
};

export function QualityRulesForm({ surveyId, onSuccess, onCancel }: QualityRulesFormProps) {
  const { account } = useWallet();
  const { isAuthenticated } = useWalletAuth();

  const [selectedPresetId, setSelectedPresetId] = useState<RulePreset["id"]>("balanced");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedPreset = useMemo(
    () => PRESETS.find((preset) => preset.id === selectedPresetId) ?? PRESETS[1],
    [selectedPresetId],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!account) {
      setError("Please connect your wallet first.");
      return;
    }

    if (!isAuthenticated) {
      setError("Please sign in with your wallet first.");
      return;
    }

    const surveyIdNum = Number(surveyId);
    if (!Number.isInteger(surveyIdNum) || surveyIdNum <= 0) {
      setError("Invalid survey ID.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/surveys/${surveyIdNum}/quality-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: selectedPreset.rules,
          version: 1
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error || "Failed to save quality rules preset. Please try again.");
        return;
      }

      setSuccess(`${selectedPreset.name} preset saved successfully.`);
      onSuccess?.(selectedPreset.rules);
    } catch (err: unknown) {
      console.error("Error saving quality rules:", err);
      setError("Failed to save quality rules preset.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!account) {
    return <div className="surface text-sm">Please connect your wallet to configure quality rules.</div>;
  }

  if (!isAuthenticated) {
    return <div className="surface text-sm">Please sign in with your wallet to configure quality rules.</div>;
  }

  return (
    <div className="max-w-xl mx-auto">
      <h3 className="text-xl font-semibold mb-2">Configure Quality Rules</h3>
      <p className="text-sm text-muted mb-4">
        Pick one preset profile. The system applies proven defaults automatically.
      </p>

      {error && (
        <div className="surface text-sm mb-4" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {success && (
        <div className="surface text-sm mb-4" style={{ borderColor: "var(--success)", color: "#065f46" }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-3">
          {PRESETS.map((preset) => {
            const selected = preset.id === selectedPresetId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPresetId(preset.id)}
                disabled={isSubmitting}
                className="surface"
                style={{
                  textAlign: "left",
                  borderColor: selected ? "var(--border-focus)" : "var(--border)",
                  boxShadow: selected ? "0 0 0 1px var(--border-focus)" : "none",
                  cursor: "pointer",
                }}
              >
                <p className="text-base font-semibold mb-1">{preset.name}</p>
                <p className="text-sm text-muted">{preset.description}</p>
              </button>
            );
          })}
        </div>

        <div className="surface">
          <p className="text-sm font-semibold mb-2">Selected preset rules</p>
          <div className="flex flex-col gap-2">
            {selectedPreset.rules.map((rule, idx) => (
              <p key={`${rule.type}-${rule.field}-${idx}`} className="text-sm text-muted">
                {rule.type} • {rule.field} = {rule.value}
              </p>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
            {isSubmitting ? "Saving..." : `Apply ${selectedPreset.name} Preset`}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} disabled={isSubmitting} className="btn btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

