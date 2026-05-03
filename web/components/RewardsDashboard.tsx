"use client";

import { useState } from "react";
import { Contract, BrowserProvider, parseEther } from "ethers";

type AnswerItem = {
  id: string;
  surveyId: string;
  status: string;
  validationScore: number;
  validationStatus: "passed" | "failed";
  validationReason: string | null;
  rewardAmountWei: string;
  onchainTxHash: string | null;
  onchainConfirmedAt: string | null;
  createdAt: string;
};

type Stats = {
  completed: number;
  pending: number;
  failed: number;
  total: number;
};

type Props = {
  walletAddress: string;
  claimableEth: number;
  totalEarnedEth: number;
  stats: Stats;
  initialAnswers: AnswerItem[];
};

export default function RewardsDashboard({
  walletAddress,
  claimableEth,
  totalEarnedEth,
  stats,
  initialAnswers
}: Props) {
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!(window as any).ethereum) {
      setClaimError("MetaMask is not installed.");
      return;
    }

    setClaiming(true);
    setClaimError(null);
    setClaimSuccess(null);

    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error("Contract address not configured");
      }

      const abi = [
        "function claimRewards() external nonReentrant",
        "function claimableRewards(address) view returns (uint256)",
        "function totalEarned(address) view returns (uint256)"
      ];
      const contract = new Contract(contractAddress, abi, signer);

      const tx = await contract.claimRewards({ from: walletAddress });
      setClaimSuccess(`Transaction sent! Hash: ${tx.hash}\nWaiting for confirmation...`);

      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        setClaimSuccess(`Rewards claimed! TX: ${tx.hash}\nCheck your MetaMask wallet.`);
      } else {
        setClaimError("Transaction failed on-chain.");
      }
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Failed to claim");
    } finally {
      setClaiming(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      submitted_offchain: "bg-gray-100 text-gray-700",
      pending_onchain: "bg-yellow-100 text-yellow-800",
      completed_onchain: "bg-blue-100 text-blue-800",
      claimed: "bg-green-100 text-green-800",
      failed_validation: "bg-red-100 text-red-800",
      failed_onchain: "bg-red-200 text-red-900",
      flagged: "bg-orange-100 text-orange-800"
    };
    const labels: Record<string, string> = {
      submitted_offchain: "Submitted",
      pending_onchain: "Pending On-Chain",
      completed_onchain: "Completed",
      claimed: "Claimed",
      failed_validation: "Failed Validation",
      failed_onchain: "Failed On-Chain",
      flagged: "Flagged"
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100"}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Rewards Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500 mb-1">Claimable</p>
            <p className="text-2xl font-bold text-green-600">{claimableEth.toFixed(6)} ETH</p>
            {claimableEth > 0 && (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="mt-3 w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {claiming ? "Claiming..." : "Claim Now"}
              </button>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500 mb-1">Total Earned</p>
            <p className="text-2xl font-bold text-blue-600">{totalEarnedEth.toFixed(6)} ETH</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500 mb-1">Completed</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
        </div>

        {/* Alerts */}
        {claimError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {claimError}
          </div>
        )}
        {claimSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 whitespace-pre-line">
            {claimSuccess}
          </div>
        )}

        {/* Answers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Your Responses</h2>
          </div>
          {initialAnswers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No responses yet. Complete a survey to earn rewards.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Survey ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TX Hash</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {initialAnswers.map((answer) => (
                  <tr key={answer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">#{answer.surveyId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(answer.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {answer.validationStatus === "passed" ? (
                        <span className="text-green-600 font-medium">{answer.validationScore}</span>
                      ) : (
                        <span className="text-red-600 font-medium">{answer.validationScore}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(Number(answer.rewardAmountWei) / 1e18).toFixed(6)} ETH
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {answer.onchainTxHash ? (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${answer.onchainTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline font-mono text-xs"
                        >
                          {answer.onchainTxHash.slice(0, 10)}...
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(answer.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
