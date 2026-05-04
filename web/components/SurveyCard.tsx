import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useSurveyContract } from "@/hooks/useSurveyContract";
import { ethers } from "ethers";
import Link from "next/link";

type SurveyCardProps = {
  survey: {
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
  onAnswerClick?: (surveyId: number) => void;
};

export function SurveyCard({ survey, onAnswerClick }: SurveyCardProps) {
  const { account } = useWallet();
  const contract = useSurveyContract(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account || !contract.contractAddress) {
      setLoading(false);
      return;
    }

    async function checkStatus() {
      try {
        setLoading(true);
        const [submitted, verified] = await Promise.all([
          contract.hasSubmitted(survey.id, account as string).catch(() => false),
          contract.isVerified(account as string).catch(() => false),
        ]);
        setHasSubmitted(submitted);
        setIsVerified(verified);
      } catch (err) {
        console.warn("Could not check survey status:", err);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, contract.contractAddress, survey.id]);

  const rewardPerResponseEth = ethers.formatEther(survey.rewardPerResponse);
  const escrowRemainingEth = ethers.formatEther(survey.escrowRemaining);
  const maxResponsesNum = parseInt(survey.maxResponses);
  const responseCountNum = parseInt(survey.responseCount);
  const remainingSlots = maxResponsesNum - responseCountNum;
  const progressPercent = maxResponsesNum > 0 ? (responseCountNum / maxResponsesNum) * 100 : 0;

  const isFull = responseCountNum >= maxResponsesNum;
  const isCreator = account?.toLowerCase() === survey.creator.toLowerCase();

  return (
    <div style={{
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "1.5rem",
      backgroundColor: "white",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    }}>
      <div style={{ marginBottom: "1rem" }}>
        <span style={{
          display: "inline-block",
          padding: "0.25rem 0.75rem",
          fontSize: "0.75rem",
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          backgroundColor: survey.active ? "#d4edda" : "#f8d7da",
          color: survey.active ? "#155724" : "#721c24",
          borderRadius: "4px",
        }}>
          {survey.active ? "Active" : "Closed"}
        </span>
        {isCreator && (
          <span style={{
            display: "inline-block",
            marginLeft: "0.5rem",
            padding: "0.25rem 0.75rem",
            fontSize: "0.75rem",
            fontWeight: "bold",
            backgroundColor: "#cce5ff",
            color: "#004085",
            borderRadius: "4px",
          }}
          >
            Your Survey
          </span>
        )}
      </div>

      <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem", color: "#333" }}>
        {survey.title}
      </h3>
      <p style={{ margin: "0 0 1rem 0", color: "#666", fontSize: "0.95rem" }}>
        {survey.description}
      </p>

      <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
        <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "1rem", color: "#495057" }}>
          Question:
        </h4>
        <p style={{ margin: 0, fontSize: "1rem", color: "#212529" }}>
          {survey.question}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#6c757d", textTransform: "uppercase" }}>Reward per Response</p>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "1.25rem", fontWeight: "bold", color: "#28a745" }}>
            {rewardPerResponseEth} ETH
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#6c757d", textTransform: "uppercase" }}>Responses / Max</p>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "1.25rem", fontWeight: "bold" }}>
            {responseCountNum} / {maxResponsesNum}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#6c757d", textTransform: "uppercase" }}>Escrow Remaining</p>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "1.25rem", fontWeight: "bold", color: "#6f42c1" }}>
            {escrowRemainingEth} ETH
          </p>
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
          <span>Progress</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div style={{
          width: "100%",
          height: "8px",
          backgroundColor: "#e9ecef",
          borderRadius: "4px",
          overflow: "hidden",
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: "100%",
            backgroundColor: progressPercent > 80 ? "#dc3545" : progressPercent > 50 ? "#ffc107" : "#28a745",
            transition: "width 0.3s ease",
          }} />
        </div>
      </div>

      {!contract.contractAddress && (
        <div style={{ padding: "1rem", backgroundColor: "#fff3cd", border: "1px solid #ffeaa7", borderRadius: "4px", marginBottom: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#856404" }}>
            Contract not configured
          </p>
        </div>
      )}

      {isFull && (
        <div style={{ padding: "1rem", backgroundColor: "#f8d7da", border: "1px solid #f5c6cb", borderRadius: "4px", marginBottom: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#721c24" }}>
            This survey is full. No more responses are being accepted.
          </p>
        </div>
      )}

      {loading && (
        <div style={{ padding: "1rem", textAlign: "center" }}>
          <p style={{ margin: 0, color: "#666" }}>Checking your eligibility...</p>
        </div>
      )}

       {!loading && account && !isCreator && !isFull && survey.active && (
        <div style={{ marginBottom: "1rem" }}>
          {isVerified === false && (
            <div style={{ padding: "1rem", backgroundColor: "#fff3cd", border: "1px solid #ffeaa7", borderRadius: "4px", marginBottom: "0.5rem" }}>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#856404" }}>
                ⚠️ You need to complete KYC verification to participate in reward surveys.
              </p>
            </div>
          )}
          {hasSubmitted && (
            <div style={{ padding: "1rem", backgroundColor: "#d1ecf1", border: "1px solid #bee5eb", borderRadius: "4px", marginBottom: "0.5rem" }}>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#0c5460" }}>
                ✅ You have already submitted a response to this survey.
              </p>
            </div>
          )}
          {!hasSubmitted && isVerified && onAnswerClick && (
            <button
              onClick={() => onAnswerClick(survey.id)}
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                fontWeight: "bold",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Answer Survey
            </button>
          )}
          {!hasSubmitted && !isVerified && onAnswerClick && (
            <button
              disabled
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                backgroundColor: "#ccc",
                color: "#666",
                border: "none",
                borderRadius: "4px",
                cursor: "not-allowed",
              }}
            >
              Complete KYC to Answer
            </button>
          )}
        </div>
      )}

      {!account && !isCreator && (
        <div style={{ padding: "1rem", backgroundColor: "#e2e3e5", border: "1px solid #d6d8db", borderRadius: "4px" }}>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#383d41" }}>
            Connect your wallet to participate.
          </p>
        </div>
      )}

      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #eee", fontSize: "0.75rem", color: "#999" }}>
        <p style={{ margin: 0, wordBreak: "break-all" }}>
          Creator: {survey.creator.slice(0, 6)}...{survey.creator.slice(-4)}
        </p>
        <p style={{ margin: "0.25rem 0 0 0" }}>
          Survey ID: {survey.id}
        </p>
      </div>
    </div>
  );
}
