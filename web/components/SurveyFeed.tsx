"use client";

import { useState, useEffect } from "react";
import { SurveyCard } from "@/components/SurveyCard";
import { useWallet } from "@/hooks/useWallet";

type SurveyData = {
  id: number;
  creator: string;
  title: string;
  description: string;
  question: string;
  rewardPerResponse: string;
  maxResponses: string;
  responseCount: string;
  escrowRemaining: string;
  active: boolean;
  unusedRewardsWithdrawn: boolean;
  options: string[];
};

export function SurveyFeed() {
  const { account } = useWallet();
  const [surveys, setSurveys] = useState<SurveyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchSurveys();
  }, []);

  async function fetchSurveys() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/surveys");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setSurveys(data.surveys || []);
    } catch (err: any) {
      console.error("Error fetching surveys:", err);
      setError("Failed to load surveys. Please try again later.");
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredSurveys = surveys.filter((survey) => {
    if (filter === "active") return survey.active;
    if (filter === "creator") return account && survey.creator.toLowerCase() === account.toLowerCase();
    return true;
  });

  const mySurveys = account
    ? surveys.filter((s) => s.creator.toLowerCase() === account.toLowerCase())
    : [];

  if (error) {
    return (
      <div style={{
        padding: "2rem",
        textAlign: "center",
        border: "1px solid #f5c6cb",
        borderRadius: "8px",
        backgroundColor: "#f8d7da",
        color: "#721c24",
      }}
      >
        <p>{error}</p>
        <button
          onClick={() => fetchSurveys()}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>⏳</div>
        <p style={{ color: "#666" }}>Loading surveys...</p>
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "3rem",
        border: "1px dashed #ccc",
        borderRadius: "8px",
        backgroundColor: "#fafafa",
      }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
        <h3 style={{ color: "#666", margin: "0 0 0.5rem 0" }}>No surveys yet</h3>
        <p style={{ color: "#999", margin: 0 }}>
          Be the first to create a funded survey or check back later.
        </p>
      </div>
    );
  }

  return (
    <div>
      {mySurveys.length > 0 && account && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", margin: "0 0 1rem 0", color: "#495057" }}>
            📝 Your Surveys
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "1.5rem",
          }}
          >
            {mySurveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
              />
            ))}
          </div>
          <hr style={{ margin: "2rem 0", border: "none", borderTop: "1px solid #dee2e6" }} />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", margin: 0, color: "#495057" }}>
          {filter === "creator" && account
            ? "Your Participations"
            : filter === "active"
            ? "Active Surveys"
            : "All Surveys"
          }
          <span style={{ fontSize: "1rem", color: "#666", fontWeight: "normal", marginLeft: "0.5rem" }}>
            ({filteredSurveys.length})
          </span>
        </h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              backgroundColor: filter === "all" ? "#007bff" : "#e9ecef",
              color: filter === "all" ? "white" : "#495057",
              border: "1px solid #007bff",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            All
          </button>
          <button
            onClick={() => setFilter("active")}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              backgroundColor: filter === "active" ? "#28a745" : "#e9ecef",
              color: filter === "active" ? "white" : "#495057",
              border: "1px solid #28a745",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Active
          </button>
          {account && (
            <button
              onClick={() => setFilter("creator")}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                backgroundColor: filter === "creator" ? "#6f42c1" : "#e9ecef",
                color: filter === "creator" ? "white" : "#495057",
                border: "1px solid #6f42c1",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Mine
            </button>
          )}
        </div>
      </div>

      {filteredSurveys.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "3rem",
          border: "1px dashed #ccc",
          borderRadius: "8px",
          backgroundColor: "#fafafa",
        }}
        >
          <p style={{ color: "#666", margin: 0 }}>
            No surveys match the current filter.
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "1.5rem",
        }}
        >
          {filteredSurveys.map((survey) => (
            <SurveyCard key={survey.id} survey={survey} />
          ))}
        </div>
      )}

      <div style={{ marginTop: "3rem", padding: "2rem", textAlign: "center", color: "#666", fontSize: "0.875rem", borderTop: "1px solid #dee2e6" }}>
        <p style={{ margin: 0 }}>
          Showing {filteredSurveys.length} of {surveys.length} total surveys
        </p>
      </div>
    </div>
  );
}
