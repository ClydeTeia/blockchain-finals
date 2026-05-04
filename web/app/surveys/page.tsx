"use client";

import { Suspense } from "react";
import { SurveyFeed } from "@/components/SurveyFeed";
import { CreateSurveyForm } from "@/components/CreateSurveyForm";
import { QualityRulesForm } from "@/components/QualityRulesForm";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useState } from "react";

export default function SurveysPage() {
  const { account } = useWallet();
  const { isAuthenticated } = useWalletAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQualityRulesForm, setShowQualityRulesForm] = useState(false);
  const [createdSurveyId, setCreatedSurveyId] = useState<number | null>(null);

  const canCreateSurvey = account && isAuthenticated;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Survey Feed</h1>
          <p style={{ margin: "0.25rem 0 0 0", color: "#666" }}>
            Browse active funded surveys and participate to earn rewards
          </p>
        </div>
        {canCreateSurvey && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setShowQualityRulesForm(false);
              }}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: showCreateForm ? "#6c757d" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              {showCreateForm ? "Hide Form" : "Create Survey"}
            </button>
            <button
              onClick={() => {
                setShowQualityRulesForm(!showQualityRulesForm);
                setShowCreateForm(false);
              }}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: showQualityRulesForm ? "#6c757d" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Quality Rules
            </button>
          </div>
        )}
      </div>

      {!account && (
        <div style={{
          padding: "1.5rem",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
        >
          <p style={{ margin: 0, color: "#856404", fontSize: "1rem" }}>
            👋 Please connect your wallet to participate in surveys or create new ones.
          </p>
        </div>
      )}

      {account && !isAuthenticated && (
        <div style={{
          padding: "1.5rem",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
        >
          <p style={{ margin: 0, color: "#856404", fontSize: "1rem" }}>
            🔐 Please sign in with your wallet to access full features.
          </p>
        </div>
      )}

      {showCreateForm && (
        <div style={{ marginBottom: "2rem" }}>
          <CreateSurveyForm />
        </div>
      )}

      {showQualityRulesForm && (
        <div style={{ marginBottom: "2rem" }}>
          <QualityRulesForm
            surveyId={createdSurveyId || 1}
            onCancel={() => {
              setShowQualityRulesForm(false);
              setCreatedSurveyId(null);
            }}
          />
        </div>
      )}

      <Suspense fallback={<div>Loading surveys...</div>}>
        <SurveyFeed />
      </Suspense>
    </div>
  );
}
