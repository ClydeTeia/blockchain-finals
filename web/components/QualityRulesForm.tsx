"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { supabaseInsert } from "@/lib/storage/supabase-rest";

type QualityRule = {
  type: "required" | "minLength" | "maxLength" | "pattern" | "minTime" | "attentionCheck";
  field: string;
  value: string;
  message: string;
};

type QualityRulesFormProps = {
  surveyId: number | bigint;
  onSuccess?: (rules: any[]) => void;
  onCancel?: () => void;
};

export function QualityRulesForm({ surveyId, onSuccess, onCancel }: QualityRulesFormProps) {
  const { account } = useWallet();
  const { isAuthenticated } = useWalletAuth();

  const [rules, setRules] = useState<QualityRule[]>([
    {
      type: "required",
      field: "answer",
      value: "true",
      message: "Answer is required.",
    },
    {
      type: "minTime",
      field: "completionTime",
      value: "10",
      message: "Please spend at least 10 seconds on this survey.",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function addRule() {
    const newRule: QualityRule = {
      type: "required",
      field: "answer",
      value: "true",
      message: "",
    };
    setRules([...rules, newRule]);
  }

  function removeRule(index: number) {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index));
    }
  }

  function updateRule(index: number, field: keyof QualityRule, value: string) {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  }

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
    if (isNaN(surveyIdNum) || surveyIdNum <= 0) {
      setError("Invalid survey ID.");
      return;
    }

    const validRules = rules.filter((rule) => rule.message.trim());
    if (validRules.length === 0) {
      setError("At least one quality rule with a message is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const rulesJson = validRules.map((rule) => ({
        type: rule.type,
        field: rule.field,
        value: rule.value,
        message: rule.message,
      }));

      const rulesData = {
        survey_id: surveyIdNum,
        rules_json: rulesJson,
        version: 1,
      };

      const result = await supabaseInsert("survey_quality_rules", rulesData);

      if (result) {
        setSuccess("Quality rules saved successfully!");
        onSuccess?.(validRules);
      } else {
        setError("Failed to save quality rules. Please try again.");
      }
    } catch (err: any) {
      console.error("Error saving quality rules:", err);
      setError("Failed to save quality rules: " + (err?.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!account) {
    return (
      <div style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
        <p>Please connect your wallet to configure quality rules.</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
        <p>Please sign in with your wallet to configure quality rules.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h3>Configure Quality Rules for Survey</h3>
      <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "1rem" }}>
        Quality rules are evaluated off-chain and determine whether a response qualifies for rewards.
      </p>

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#fee", border: "1px solid #fcc", borderRadius: "4px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: "1rem", backgroundColor: "#efe", border: "1px solid #cfc", borderRadius: "4px", marginBottom: "1rem" }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {rules.map((rule, index) => (
          <div key={index} style={{ border: "1px solid #ddd", borderRadius: "4px", padding: "1rem", marginBottom: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>Rule Type</label>
                <select
                  value={rule.type}
                  onChange={(e) => updateRule(index, "type", e.target.value as QualityRule["type"])}
                  disabled={isSubmitting}
                  style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem" }}
                >
                  <option value="required">Required Field</option>
                  <option value="minLength">Minimum Length</option>
                  <option value="maxLength">Maximum Length</option>
                  <option value="pattern">Pattern Match</option>
                  <option value="minTime">Minimum Time (seconds)</option>
                  <option value="attentionCheck">Attention Check</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>Field</label>
                <input
                  type="text"
                  value={rule.field}
                  onChange={(e) => updateRule(index, "field", e.target.value)}
                  disabled={isSubmitting}
                  style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem" }}
                  placeholder="e.g., answer, completionTime"
                />
              </div>
            </div>

            <div style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>Expected Value</label>
              <input
                type="text"
                value={rule.value}
                onChange={(e) => updateRule(index, "value", e.target.value)}
                disabled={isSubmitting}
                style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem" }}
                placeholder={rule.type === "minLength" ? "e.g., 10" : "e.g., true"}
              />
            </div>

            <div style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>Validation Message</label>
              <input
                type="text"
                value={rule.message}
                onChange={(e) => updateRule(index, "message", e.target.value)}
                disabled={isSubmitting}
                style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem" }}
                placeholder="Message shown when validation fails"
              />
            </div>

            {rules.length > 1 && (
              <button
                type="button"
                onClick={() => removeRule(index)}
                disabled={isSubmitting}
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", backgroundColor: "#fee", border: "1px solid #fcc", borderRadius: "4px" }}
              >
                Remove Rule
              </button>
            )}
          </div>
        ))}

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button
            type="button"
            onClick={addRule}
            disabled={isSubmitting}
            style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", backgroundColor: "#e0e0e0", border: "1px solid #ccc", borderRadius: "4px" }}
          >
            + Add Rule
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: "0.75rem",
              fontSize: "0.875rem",
              fontWeight: "bold",
              backgroundColor: isSubmitting ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Saving..." : "Save Quality Rules"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                padding: "0.75rem",
                fontSize: "0.875rem",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
