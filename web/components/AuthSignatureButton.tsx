"use client";

import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";

export function AuthSignatureButton() {
  const { account, provider } = useWallet();
  const { isAuthenticated, walletAddress, isLoading, error, login, logout } =
    useWalletAuth();

  if (isLoading) {
    return <span>Checking session...</span>;
  }

  if (!account || !provider) {
    return null;
  }

  if (isAuthenticated && walletAddress) {
    return (
      <div>
        <span>Signed in</span>
        <button onClick={logout}>Sign Out</button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => login(account, provider)}
        disabled={isLoading}
      >
        Sign In
      </button>
      {error && <p style={{ color: "red", fontSize: "0.8rem" }}>{error}</p>}
    </div>
  );
}
