"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "./useWallet";

export function NetworkGuard() {
  const { chainId, switchToSepolia } = useWallet();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (chainId !== null && chainId !== 11155111) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [chainId]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h3 className="text-lg font-bold mb-2">Wrong Network</h3>
        <p className="text-gray-600 mb-4">
          Please switch to the Sepolia testnet to use this app.
        </p>
        <button
          onClick={() => {
            switchToSepolia();
            setShowWarning(false);
          }}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Switch to Sepolia
        </button>
        <button
          onClick={() => setShowWarning(false)}
          className="w-full mt-2 border border-gray-300 py-2 px-4 rounded hover:bg-gray-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function useEnforceSepolia() {
  const { chainId } = useWallet();
  const isCorrect = chainId === 11155111;
  return isCorrect;
}
