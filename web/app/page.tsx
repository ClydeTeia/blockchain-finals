import { NetworkGuard } from "@/components/NetworkGuard";

export default function HomePage() {
  return (
    <NetworkGuard>
      <h1>SurveyChain Rewards</h1>
      <p>Connect your MetaMask wallet and sign in to get started.</p>
    </NetworkGuard>
  );
}
