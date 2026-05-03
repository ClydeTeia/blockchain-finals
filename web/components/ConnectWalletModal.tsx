"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";

export default function ConnectWalletModal() {
  const router = useRouter();
  const { connect } = useWallet();
  const { loginWithWallet, connected, loading: authLoading } = useWalletAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show modal if not authenticated
    if (!authLoading && !connected) {
      setShow(true);
    }
  }, [authLoading, connected]);

  const handleConnect = async () => {
    try {
      await connect();
      await loginWithWallet();
      setShow(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Connection failed");
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4">Welcome to SurveyChain Rewards</h2>
        <p className="text-gray-600 mb-6">
          Connect your wallet to start completing surveys and earning Sepolia ETH.
        </p>
        <button
          onClick={handleConnect}
          className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 font-medium"
        >
          Connect Wallet
        </button>
        <p className="text-xs text-gray-500 mt-4">
          Requires MetaMask. Ensure you are on Sepolia network.
        </p>
      </div>
    </div>
  );
}
