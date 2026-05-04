"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import { ethers } from "ethers";

type BuilderQuestion = {
  id: string;
  prompt: string;
  type: "multiple_choice" | "text";
  required: boolean;
  options: string[];
};

function newQuestion(index: number): BuilderQuestion {
  return {
    id: `q_${index + 1}`,
    prompt: "",
    type: "multiple_choice",
    required: true,
    options: ["", ""],
  };
}

export function CreateSurveyForm() {
  const { account, provider } = useWallet();
  const { isAuthenticated, isAdmin, isCreator } = useWalletAuth();
  const contract = useSurveyContract(provider);
  const [hasOnChainCreateRole, setHasOnChainCreateRole] = useState<boolean | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<BuilderQuestion[]>([newQuestion(0)]);
  const [totalRewardPool, setTotalRewardPool] = useState("");
  const [maxResponses, setMaxResponses] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalRewardPoolWei = (() => {
    try {
      return totalRewardPool ? ethers.parseEther(totalRewardPool) : 0n;
    } catch {
      return 0n;
    }
  })();

  const maxResponsesWei = (() => {
    try {
      return maxResponses ? BigInt(maxResponses) : 0n;
    } catch {
      return 0n;
    }
  })();

  const isEvenlyDivisible = maxResponsesWei > 0n && totalRewardPoolWei > 0n
    ? totalRewardPoolWei % maxResponsesWei === 0n
    : false;
  const computedRewardPerResponseWei =
    isEvenlyDivisible && maxResponsesWei > 0n ? totalRewardPoolWei / maxResponsesWei : 0n;
  const computedRewardPerResponseEth =
    computedRewardPerResponseWei > 0n ? ethers.formatEther(computedRewardPerResponseWei) : "0";
  const depositEth = totalRewardPoolWei > 0n ? ethers.formatEther(totalRewardPoolWei) : "0";

  useEffect(() => {
    let cancelled = false;

    async function loadOnChainRole() {
      if (!account || !contract.isReady) {
        setHasOnChainCreateRole(null);
        return;
      }
      try {
        const [adminRole, creatorRole] = await Promise.all([
          contract.hasAdminRole(account),
          contract.hasCreatorRole(account)
        ]);
        if (!cancelled) {
          setHasOnChainCreateRole(adminRole || creatorRole);
        }
      } catch {
        if (!cancelled) {
          setHasOnChainCreateRole(null);
        }
      }
    }

    void loadOnChainRole();
    return () => {
      cancelled = true;
    };
  }, [account, contract]);

  function addQuestion() {
    setQuestions((prev) => [...prev, newQuestion(prev.length)]);
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) {
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, patch: Partial<BuilderQuestion>) {
    setQuestions((prev) => prev.map((question, i) => {
      if (i !== index) return question;
      const next = { ...question, ...patch };
      if (patch.type === "text") {
        next.options = [];
      }
      if (patch.type === "multiple_choice" && next.options.length < 2) {
        next.options = ["", ""];
      }
      return next;
    }));
  }

  function addOption(questionIndex: number) {
    setQuestions((prev) => prev.map((question, i) => {
      if (i !== questionIndex) return question;
      return { ...question, options: [...question.options, ""] };
    }));
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setQuestions((prev) => prev.map((question, i) => {
      if (i !== questionIndex || question.options.length <= 2) return question;
      return { ...question, options: question.options.filter((_, idx) => idx !== optionIndex) };
    }));
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    setQuestions((prev) => prev.map((question, i) => {
      if (i !== questionIndex) return question;
      return {
        ...question,
        options: question.options.map((option, idx) => (idx === optionIndex ? value : option)),
      };
    }));
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

    if (!(isCreator || isAdmin)) {
      setError("Only creator or admin wallets can create surveys.");
      return;
    }

    if (hasOnChainCreateRole === false) {
      setError("This wallet is authenticated but missing on-chain creator/admin role.");
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

    if (!totalRewardPool || !maxResponses) {
      setError("Total reward pool and max responses are required.");
      return;
    }

    let rewardPoolWei: bigint;
    try {
      rewardPoolWei = ethers.parseEther(totalRewardPool);
      if (rewardPoolWei <= 0n) {
        setError("Total reward pool must be greater than 0.");
        return;
      }
    } catch {
      setError("Invalid total reward pool.");
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

    if (rewardPoolWei % maxResp !== 0n) {
      setError("Total reward pool must divide evenly by max responses.");
      return;
    }

    const rewardWei = rewardPoolWei / maxResp;
    if (rewardWei <= 0n) {
      setError("Computed reward per response must be greater than 0.");
      return;
    }

    const cleanedQuestions = questions
      .map((question, index) => {
        const prompt = question.prompt.trim();
        const options = question.type === "multiple_choice"
          ? question.options.map((option) => option.trim()).filter(Boolean)
          : [];
        return {
          id: `q_${index + 1}`,
          prompt,
          type: question.type,
          required: question.required,
          options,
        };
      })
      .filter((question) => question.prompt);

    if (cleanedQuestions.length === 0) {
      setError("At least one question is required.");
      return;
    }

    const primaryQuestion = cleanedQuestions[0];
    if (primaryQuestion.type !== "multiple_choice" || primaryQuestion.options.length < 2) {
      setError("Question 1 must be multiple choice with at least 2 options.");
      return;
    }

    setIsSubmitting(true);

    try {
      const tx = await contract.createSurvey(
        title.trim(),
        description.trim(),
        primaryQuestion.prompt,
        primaryQuestion.options,
        rewardWei,
        maxResp,
        rewardPoolWei,
      );

      const receipt = await tx.wait?.();
      let createdSurveyId: bigint | null = null;
      if (receipt?.logs) {
        for (const log of receipt.logs) {
          if ("fragment" in log && log.fragment?.name === "SurveyCreated") {
            createdSurveyId = BigInt(log.args?.surveyId ?? log.args?.[0]);
            break;
          }
        }
      }

      if (!createdSurveyId) {
        throw new Error("Survey created on-chain but surveyId could not be resolved.");
      }

      let metadataWarning: string | null = null;
      try {
        const metadataResponse = await fetch(`/api/surveys/${createdSurveyId.toString()}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: cleanedQuestions }),
        });

        if (!metadataResponse.ok) {
          const payload = (await metadataResponse.json().catch(() => ({}))) as { error?: string };
          metadataWarning = payload.error || "Failed to save question set.";
        }
      } catch {
        metadataWarning = "Failed to save question set.";
      }

      setSuccess(
        metadataWarning
          ? `Survey created on-chain (ID: ${createdSurveyId.toString()}), but ${metadataWarning}`
          : `Survey created successfully. Survey ID: ${createdSurveyId.toString()}.`
      );
      setTitle("");
      setDescription("");
      setQuestions([newQuestion(0)]);
      setTotalRewardPool("");
      setMaxResponses("");
    } catch (err: unknown) {
      console.error("Error creating survey:", err);
      const message = err instanceof Error ? err.message : "Failed to create survey.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!account) {
    return <div className="surface text-sm">Please connect your wallet to create a survey.</div>;
  }

  if (!isAuthenticated) {
    return <div className="surface text-sm">Please sign in with your wallet to create a survey.</div>;
  }

  if (!(isCreator || isAdmin)) {
    return <div className="surface text-sm">This wallet is not authorized to create surveys.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="surface text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {success && (
        <div className="surface text-sm" style={{ borderColor: "var(--success)", color: "#065f46" }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {hasOnChainCreateRole === false && (
          <div className="surface text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
            Wallet is signed in but does not have on-chain creator/admin role. Ask an admin wallet to grant creator role first.
          </div>
        )}

        <div>
          <label className="form-label">Survey Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSubmitting} className="form-input" placeholder="Enter survey title" />
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting} className="form-input" style={{ minHeight: "84px" }} placeholder="Enter survey description (optional)" />
        </div>

        <div className="surface">
          <div className="flex justify-between items-center mb-2">
            <label className="form-label" style={{ marginBottom: 0 }}>Questions *</label>
            <button type="button" onClick={addQuestion} disabled={isSubmitting} className="btn btn-secondary text-sm">
              Add Question
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {questions.map((question, questionIndex) => (
              <div key={`${question.id}-${questionIndex}`} className="card">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold">Question {questionIndex + 1}</p>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(questionIndex)} disabled={isSubmitting} className="btn btn-ghost">
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <label className="form-label">Type</label>
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(questionIndex, { type: e.target.value as BuilderQuestion["type"] })}
                      disabled={isSubmitting || questionIndex === 0}
                      className="form-input"
                    >
                      <option value="multiple_choice">Multiple choice</option>
                      {questionIndex !== 0 && <option value="text">Text</option>}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Required</label>
                    <select
                      value={question.required ? "yes" : "no"}
                      onChange={(e) => updateQuestion(questionIndex, { required: e.target.value === "yes" })}
                      disabled={isSubmitting}
                      className="form-input"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label">Prompt</label>
                  <input
                    type="text"
                    value={question.prompt}
                    onChange={(e) => updateQuestion(questionIndex, { prompt: e.target.value })}
                    disabled={isSubmitting}
                    className="form-input"
                    placeholder="Enter question prompt"
                  />
                </div>

                {question.type === "multiple_choice" && (
                  <div>
                    <label className="form-label">Options</label>
                    {question.options.map((option, optionIndex) => (
                      <div key={`${question.id}-opt-${optionIndex}`} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                          disabled={isSubmitting}
                          className="form-input"
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                        {question.options.length > 2 && (
                          <button type="button" onClick={() => removeOption(questionIndex, optionIndex)} disabled={isSubmitting} className="btn btn-ghost">
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addOption(questionIndex)} disabled={isSubmitting} className="btn btn-secondary mt-2">
                      Add Option
                    </button>
                    {questionIndex === 0 && (
                      <p className="text-sm text-muted mt-2">Question 1 is the anchor for on-chain metadata and must remain multiple choice.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Total Reward Pool (ETH) *</label>
            <input type="number" step="0.0001" min="0.0001" value={totalRewardPool} onChange={(e) => setTotalRewardPool(e.target.value)} disabled={isSubmitting} className="form-input" placeholder="1.0" />
          </div>
          <div>
            <label className="form-label">Max Responses *</label>
            <input type="number" min="1" value={maxResponses} onChange={(e) => setMaxResponses(e.target.value)} disabled={isSubmitting} className="form-input" placeholder="100" />
          </div>
        </div>

        <div className="surface">
          <p className="text-base font-semibold mb-1">Deposit Preview</p>
          <p className="text-sm">Total ETH deposit: <strong>{depositEth} ETH</strong></p>
          <p className="text-sm text-muted mt-2">Auto reward per response: <strong>{computedRewardPerResponseEth} ETH</strong></p>
          <p className="text-sm text-muted mt-2">({totalRewardPool || 0} ETH / {maxResponses || 0} responses)</p>
          {!isEvenlyDivisible && totalRewardPoolWei > 0n && maxResponsesWei > 0n && (
            <p className="text-sm mt-2" style={{ color: "var(--danger)" }}>
              Total reward pool is not evenly divisible by max responses at wei precision.
            </p>
          )}
        </div>

        <div className="surface">
          <p className="text-sm text-muted">Quality rules are configured separately in the dedicated &quot;Quality Rules&quot; panel and saved off-chain.</p>
        </div>

        <button type="submit" disabled={isSubmitting || hasOnChainCreateRole === false} className="btn btn-primary w-full">
          {isSubmitting ? "Creating Survey..." : "Create Survey"}
        </button>
      </form>
    </div>
  );
}
