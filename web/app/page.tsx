import { NetworkGuard } from "@/components/NetworkGuard";
import Link from "next/link";

export default function HomePage() {
  return (
    <NetworkGuard>
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚀 SurveyChain Rewards</h1>
        <p style={{ fontSize: "1.2rem", color: "#666", maxWidth: "600px", margin: "0 auto 2rem" }}>
          A blockchain-based escrow and proof-of-completion system for verified survey rewards.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/surveys" style={{
            padding: "1rem 2rem",
            backgroundColor: "#007bff",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "1.1rem",
          }}>
            📋 Browse Surveys
          </Link>
          <Link href="/kyc" style={{
            padding: "1rem 2rem",
            backgroundColor: "#28a745",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "1.1rem",
          }}>
            ✅ Complete KYC
          </Link>
        </div>
        
        <div style={{ marginTop: "4rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem", textAlign: "left" }}>
          <div style={{ padding: "1.5rem", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef" }}>
            <h3 style={{ color: "#007bff", marginTop: 0 }}>💰 Funded Escrow</h3>
            <p style={{ margin: 0, color: "#666" }}>Creators fund reward pools before launching surveys. No payment, no survey.</p>
          </div>
          <div style={{ padding: "1.5rem", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef" }}>
            <h3 style={{ color: "#007bff", marginTop: 0 }}>🔒 Verified Rewards</h3>
            <p style={{ margin: 0, color: "#666" }}>On-chain proofs ensure legitimate respondents get automatically rewarded.</p>
          </div>
          <div style={{ padding: "1.5rem", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef" }}>
            <h3 style={{ color: "#007bff", marginTop: 0 }}>📊 Quality Gates</h3>
            <p style={{ margin: 0, color: "#666" }}>Off-chain validation filters out bots and low-effort responses.</p>
          </div>
        </div>
      </div>
    </NetworkGuard>
  );
}
