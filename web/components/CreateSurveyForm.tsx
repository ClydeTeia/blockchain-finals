"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import { ethers } from "ethers";

type QualityRule = {
  id: string;
  type: "required" | "minLength" | "maxLength" | "pattern";
  field: string;
  value: string;
  message: string;
};

export function CreateSurveyForm() {
  const { account, provider } = useWallet();
  const { isAuthenticated } = useWalletAuth();
  const contract = useSurveyContract(provider);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [rewardPerResponse, setRewardPerResponse] = useState("");
  const [maxResponses, setMaxResponses] = useState("");
  const [qualityRules, setQualityRules] = useState<QualityRule[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate total deposit
  const depositWei = (() => {
    try {
      const reward = rewardPerResponse ? ethers.parseEther(rewardPerResponse) : 0n;
      const max = maxResponses ? BigInt(maxResponses) : 0n;
      return reward * max;
    } catch {
      return 0n;
    }
  })();

  const depositEth = depositWei > 0n ? ethers.formatEther(depositWei) : "0";

  function addOption() {
    setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  }

  function updateOption(index: number, value: string) {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  }

  function addQualityRule() {
    const newRule: QualityRule = {
      id: Date.now().toString(),
      type: "required",
      field: "answer",
      value: "",
      message: "",
    };
    setQualityRules([...qualityRules, newRule]);
  }

  function removeQualityRule(id: string) {
    setQualityRules(qualityRules.filter((rule) => rule.id !== id));
  }

  function updateQualityRule(id: string, field: keyof QualityRule, value: string) {
    setQualityRules(
      qualityRules.map((rule) =>
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
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

    if (!contract.isReady) {
      setError("Contract not ready. Please check your connection.");
      return;
    }

    if (!title.trim()) {
      setError("Survey title is required.");
      return;
    }

    if (!question.trim()) {
      setError("Survey question is required.");
      return;
    }

    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      setError("At least 2 options are required.");
      return;
    }

    if (!rewardPerResponse || !maxResponses) {
      setError("Reward per response and max responses are required.");
      return;
    }

    let rewardWei: bigint;
    try {
      rewardWei = ethers.parseEther(rewardPerResponse);
      if (rewardWei <= 0n) {
        setError("Reward per response must be greater than 0.");
        return;
      }
    } catch {
      setError("Invalid reward amount.");
      return;
    }

    let maxResp: bigint;
    try {
      maxResp = BigInt(maxResponses);
      if (maxResp <= 0n) {
        setError("Max responses must be greater than 0.");
        return;
      }
    } catch {
      setError("Invalid max responses.");
      return;
    }

    if (depositWei <= 0n) {
      setError("Deposit calculation error.");
      return;
    }

    setIsSubmitting(true);

      try {
        // Create survey on-chain
        const tx = await contract.createSurvey(
          title.trim(),
          description.trim(),
          question.trim(),
          validOptions,
          rewardWei,
          maxResp,
          depositWei
        );

        setSuccess(`Survey created! Transaction: ${tx.hash}`);
        
        // Reset form
        setTitle("");
        setDescription("");
        setQuestion("");
        setOptions(["", ""]);
        setRewardPerResponse("");
        setMaxResponses("");
        setQualityRules([]);

        // Wait for transaction to be mined
        await tx.wait?.();
        setSuccess(`Survey created successfully! Survey ID will be available shortly.`);
      } catch (err: any) {
        console.error("Error creating survey:", err);
        let message = "Failed to create survey.";
        if (err?.message?.includes("Incorrect escrow amount")) {
          message = "Incorrect deposit amount.";
        } else if (err?.message?.includes("Creator or admin required")) {
          message = "Only creators or admins can create surveys.";
        } else if (err?.message?.includes("rewardPerResponse must be > 0")) {
          message = "Reward per response must be greater than 0.";
        } else if (err?.message?.includes("maxResponses must be > 0")) {
          message = "Max responses must be greater than 0.";
        } else if (err?.rejection) {
          message = "Transaction rejected.";
        }
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
  }

  if (!account) {
    return (
      <div style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
        <p>Please connect your wallet to create a survey.</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
        <p>Please sign in with your wallet to create a survey.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h2>Create Survey</h2>
      
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
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Survey Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
            placeholder="Enter survey title"
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            style={{ width: "100%", padding: "0.5rem", fontSize: "1rem", minHeight: "80px" }}
            placeholder="Enter survey description (optional)"
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Question *
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isSubmitting}
            style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
            placeholder="Enter survey question"
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Answer Options *
          </label>
          {options.map((option, index) => (
            <div key={index} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                disabled={isSubmitting}
                style={{ flex: 1, padding: "0.5rem", fontSize: "1rem" }}
                placeholder={`Option ${index + 1}`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  disabled={isSubmitting}
                  style={{ padding: "0.5rem 1rem", backgroundColor: "#fee", border: "1px solid #fcc", borderRadius: "4px" }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            disabled={isSubmitting}
            style={{ padding: "0.5rem 1rem", backgroundColor: "#f0f0f0", border: "1px solid #ccc", borderRadius: "4px", marginTop: "0.5rem" }}
          >
            + Add Option
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Reward per Response (ETH) *
            </label>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              value={rewardPerResponse}
              onChange={(e) => setRewardPerResponse(e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
              placeholder="0.01"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Max Responses *
            </label>
            <input
              type="number"
              min="1"
              value={maxResponses}
              onChange={(e) => setMaxResponses(e.target.value)}
              disabled={isSubmitting}
              style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
              placeholder="100"
            />
          </div>
        </div>

        <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
          <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>Deposit Preview</h4>
          <p style={{ margin: 0 }}>
            Total ETH Deposit: <strong>{depositEth} ETH</strong>
          </p>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#666" }}>
            ({rewardPerResponse || 0} ETH × {maxResponses || 0} responses)
          </p>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Quality Rules</label>
            <button
              type="button"
              onClick={addQualityRule}
              disabled={isSubmitting}
              style={{ padding: "0.25rem 0.75rem", fontSize: "0.875rem", backgroundColor: "#e0e0e0", border: "1px solid #ccc", borderRadius: "4px" }}
            >
              + Add Rule
            </button>
          </div>
          <p style={{ margin: "0 0 1rem 0", fontSize: "0.875rem", color: "#666" }}>
            Quality rules help validate responses. Rules are stored separately and do not affect on-chain data.
          </p>
          {qualityRules.map((rule) => (
            <div key={rule.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <select
                value={rule.type}
                onChange={(e) => updateQualityRule(rule.id, "type", e.target.value)}
                disabled={isSubmitting}
                style={{ padding: "0.5rem", fontSize: "0.875rem" }}
              >
                <option value="required">Required</option>
                <option value="minLength">Min Length</option>
                <option value="maxLength">Max Length</option>
                <option value="pattern">Pattern</option>
              </select>
              <input
                type="text"
                value={rule.field}
                onChange={(e) => updateQualityRule(rule.id, "field", e.target.value)}
                disabled={isSubmitting}
                style={{ padding: "0.5rem", fontSize: "0.875rem" }}
                placeholder="Field"
              />
              <input
                type="text"
                value={rule.value}
                onChange={(e) => updateQualityRule(rule.id, "value", e.target.value)}
                disabled={isSubmitting}
                style={{ padding: "0.5rem", fontSize: "0.875rem" }}
                placeholder="Value"
              />
              <button
                type="button"
                onClick={() => removeQualityRule(rule.id)}
                disabled={isSubmitting}
                style={{ padding: "0.5rem", backgroundColor: "#fee", border: "1px solid #fcc", borderRadius: "4px", fontSize: "0.875rem" }}
              >
                Remove
              </button>
            </div>
          ))}
          {qualityRules.length === 0 && (
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#999", fontStyle: "italic" }}>
              No quality rules defined. Surveys will accept any response that passes basic requirements.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1.1rem",
            fontWeight: "bold",
            backgroundColor: isSubmitting ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Creating Survey..." : "Create Survey (Deposit Required)"}
        </button>
      </form>
    </div>
  );
}
