"use client";

import { useState } from "react";
import { ethers } from "ethers";

type OptionInput = {
  id: number;
  value: string;
};

export default function CreateSurveyForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<OptionInput[]>([
    { id: 1, value: "" },
    { id: 2, value: "" }
  ]);
  const [rewardPerResponse, setRewardPerResponse] = useState("");
  const [maxResponses, setMaxResponses] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [contractData, setContractData] = useState<{
    to: string;
    data: string;
    value: string;
  } | null>(null);

  const addOption = () => {
    setOptions([...options, { id: Date.now(), value: "" }]);
  };

  const removeOption = (id: number) => {
    if (options.length > 2) {
      setOptions(options.filter((opt) => opt.id !== id));
    }
  };

  const updateOption = (id: number, value: string) => {
    setOptions(
      options.map((opt) => (opt.id === id ? { ...opt, value } : opt))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setContractData(null);

    // Validate
    const optionValues = options.map((o) => o.value.trim()).filter(Boolean);
    if (optionValues.length < 2) {
      setError("At least 2 options required.");
      return;
    }

    let rewardWei: bigint;
    try {
      rewardWei = ethers.parseEther(rewardPerResponse || "0");
    } catch {
      setError("Invalid reward amount.");
      return;
    }
    if (rewardWei <= 0n) {
      setError("Reward must be greater than 0 ETH.");
      return;
    }

    let maxResp: bigint;
    try {
      maxResp = BigInt(maxResponses);
    } catch {
      setError("Invalid max responses.");
      return;
    }
    if (maxResp <= 0n) {
      setError("Max responses must be a positive integer.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          question,
          options: optionValues,
          rewardPerResponseWei: rewardWei.toString(),
          maxResponses: maxResp
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create survey.");
      }

      setSuccess("Survey created! Please confirm MetaMask transaction.");

      // Prepare contract call data
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error("Contract address not configured.");
      }

      // Encode the createSurvey function call
      const surveyAbi = [
        "function createSurvey(string title, string description, string question, string[] options, uint256 rewardPerResponse, uint256 maxResponses) payable"
      ];
      const iface = new ethers.Interface(surveyAbi);
      const txData = iface.encodeFunctionData("createSurvey", [
        title,
        description,
        question,
        optionValues,
        rewardWei,
        BigInt(maxResp)
      ]);

      setContractData({
        to: contractAddress,
        data: txData,
        value: (rewardWei * BigInt(maxResp)).toString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTransaction = async () => {
    if (!(window as any).ethereum) {
      setError("MetaMask is not installed. Please install MetaMask to create a survey.");
      return;
    }
    if (!contractData) return;

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to: contractData.to,
        data: contractData.data,
        value: contractData.value
      });

      setSuccess(`Transaction sent! Hash: ${tx.hash}\nWaiting for confirmation...`);

      const receipt = await tx.wait();
      if (!receipt) throw new Error("Transaction receipt is null");
      setSuccess(
        `Survey created on-chain! Block: ${receipt.blockNumber}\nTX: ${tx.hash}`
      );

      // Optionally redirect to feed or created survey page
      // For now, reset form
      setContractData(null);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? `Transaction failed: ${err.message}` : "Transaction failed"
      );
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setQuestion("");
    setOptions([{ id: 1, value: "" }, { id: 2, value: "" }]);
    setRewardPerResponse("");
    setMaxResponses("");
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Create Survey</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 whitespace-pre-line">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Question</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Options</label>
          {options.map((opt) => (
            <div key={opt.id} className="flex gap-2 mb-2">
              <input
                type="text"
                value={opt.value}
                onChange={(e) => updateOption(opt.id, e.target.value)}
                className="flex-1 border rounded px-3 py-2"
                placeholder={`Option ${options.indexOf(opt) + 1}`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="text-red-500 px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="text-blue-500 text-sm mt-1"
          >
            + Add Option
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Reward per response (ETH)
            </label>
            <input
              type="number"
              step="0.000001"
              min="0"
              value={rewardPerResponse}
              onChange={(e) => setRewardPerResponse(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Max Responses
            </label>
            <input
              type="number"
              min="1"
              value={maxResponses}
              onChange={(e) => setMaxResponses(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>

        {rewardPerResponse && maxResponses && (
          <div className="text-sm text-gray-600">
            Total escrow:{" "}
            <strong>
              {(() => {
                try {
                  const wei = ethers.parseEther(rewardPerResponse);
                  const max = BigInt(maxResponses);
                  return ethers.formatEther(wei * max);
                } catch {
                  return "0";
                }
              })()}{" "}
              ETH
            </strong>
          </div>
        )}

        {!contractData && (
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Preparing..." : "Prepare Contract Call"}
          </button>
        )}

        {contractData && (
          <button
            type="button"
            onClick={handleSendTransaction}
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Confirm in MetaMask
          </button>
        )}
      </form>
    </div>
  );
}
