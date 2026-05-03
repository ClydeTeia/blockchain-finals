"use client";

import { useEffect, useState } from "react";

type AnswerItem = {
  id: string;
  surveyId: string;
  respondentWallet: string;
  status: string;
  validationScore: number;
  validationStatus: "passed" | "failed";
  validationReason: string | null;
  flagged: boolean;
  auditNotes: string | null;
  createdAt: string;
};

type Props = {
  initialAnswers: AnswerItem[];
  refresh: () => Promise<void>;
};

export default function AdminAuditPanel({ initialAnswers, refresh }: Props) {
  const [answers, setAnswers] = useState<AnswerItem[]>(initialAnswers);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/answers");
      const data = await res.json();
      if (res.ok) {
        setAnswers(data.answers);
        setMessage("Refreshed");
      } else {
        setMessage(data.error || "Failed to load");
      }
    } catch (err) {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async (id: string, flagged: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/answers/${id}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagged })
      });
      const data = await res.json();
      if (res.ok) {
        setAnswers((prev) =>
          prev.map((a) => (a.id === id ? { ...a, flagged } : a))
        );
        setMessage(data.ok ? "Flag updated" : data.error);
      }
    } catch {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleAuditNote = async (id: string, note: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/answers/${id}/audit-note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note || null })
      });
      const data = await res.json();
      if (res.ok) {
        setAnswers((prev) =>
          prev.map((a) => (a.id === id ? { ...a, auditNotes: note } : a))
        );
        setMessage("Note saved");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIntegrity = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/answers/${id}/verify-integrity`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(
          data.matches
            ? "Integrity verified: off-chain answer matches on-chain hash."
            : `Integrity MISMATCH! Stored: ${data.storedHash} Computed: ${data.computedHash}`
        );
      } else {
        setMessage(data.error);
      }
    } catch {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">Response Audit (All Answers)</h2>
        <button
          onClick={refresh}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {message && (
        <div className={`px-6 py-3 ${message.includes("MISMATCH") ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
          {message}
        </div>
      )}

      {answers.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No responses found.</div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Survey</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Audit Note</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {answers.map((answer) => (
              <tr key={answer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{answer.id.slice(0, 8)}...</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">#{answer.surveyId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                  {answer.respondentWallet.slice(0, 6)}...{answer.respondentWallet.slice(-4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    answer.status === "completed_onchain" || answer.status === "claimed" ? "bg-green-100 text-green-800" :
                    answer.status === "pending_onchain" ? "bg-yellow-100 text-yellow-800" :
                    answer.status === "failed_validation" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {answer.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {answer.validationStatus === "passed" ? (
                    <span className="text-green-600 font-medium">{answer.validationScore}</span>
                  ) : (
                    <span className="text-red-600 font-medium">{answer.validationScore}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleFlag(answer.id, !answer.flagged)}
                    disabled={loading}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      answer.flagged
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {answer.flagged ? "Flagged" : "Flag"}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm">
                  <input
                    type="text"
                    defaultValue={answer.auditNotes ?? ""}
                    onBlur={(e) => handleAuditNote(answer.id, e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="Add note..."
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleVerifyIntegrity(answer.id)}
                    disabled={loading}
                    className="text-blue-500 hover:underline"
                  >
                    Verify Integrity
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
