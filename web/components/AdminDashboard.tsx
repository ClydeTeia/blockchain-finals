"use client";

import { useState, useEffect } from "react";
import AdminAuditPanel from "./AdminAuditPanel";

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
  walletAddress: string;
  initialAnswers?: AnswerItem[];
};

export default function AdminDashboard({ walletAddress, initialAnswers = [] }: Props) {
  const [activeTab, setActiveTab] = useState<"audit" | "kyc" | "surveys" | "creators" | "contract">("audit");
  const [answers, setAnswers] = useState<AnswerItem[]>(initialAnswers);

  const refreshAnswers = async () => {
    try {
      const res = await fetch("/api/admin/answers");
      const data = await res.json();
      if (res.ok) {
        setAnswers(data.answers);
      }
    } catch (err) {
      console.error("Failed to fetch answers:", err);
    }
  };

  // Always refresh on mount to get latest data
  useEffect(() => {
    refreshAnswers();
  }, []);

  const tabs = [
    { id: "audit", label: "Response Audit" },
    { id: "kyc", label: "KYC Requests" },
    { id: "surveys", label: "Surveys" },
    { id: "creators", label: "Creator Roles" },
    { id: "contract", label: "Contract Controls" }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "audit" && (
          <AdminAuditPanel initialAnswers={answers} refresh={refreshAnswers} />
        )}

        {activeTab === "kyc" && (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            KYC management UI pending implementation.
          </div>
        )}

        {activeTab === "surveys" && (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            Survey management UI pending. Use contract directly: closeSurvey(surveyId)
          </div>
        )}

        {activeTab === "creators" && (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            Creator role management UI pending. Use contract directly: grantCreatorRole(address), revokeCreatorRole(address)
          </div>
        )}

        {activeTab === "contract" && (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            Contract controls (pause/unpause) UI pending.
          </div>
        )}
      </div>
    </div>
  );
}
