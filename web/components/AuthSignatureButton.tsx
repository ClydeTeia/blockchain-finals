"use client";

import { useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useNetwork } from "@/hooks/useNetwork";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function AuthSignatureButton() {
  const {
    account,
    provider,
    isConnecting,
    isMetaMaskInstalled,
    error: walletError,
    connect
  } = useWallet();
  const { isExpectedNetwork, isSwitching, switchToSepolia } = useNetwork();
  const { isAuthenticated, walletAddress, isLoading, error: authError, login, logout } =
    useWalletAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!account || !walletAddress) {
      void logout();
      return;
    }

    if (account.toLowerCase() !== walletAddress.toLowerCase()) {
      void logout();
    }
  }, [account, isAuthenticated, logout, walletAddress]);

  if (isLoading) {
    return <span className="text-muted text-sm font-medium flex items-center gap-2">Checking session...</span>;
  }

  if (!isMetaMaskInstalled) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-primary"
      >
        Install MetaMask
      </a>
    );
  }

  if (!account || !provider) {
    return (
      <div className="flex items-center gap-4">
        <button className="btn btn-primary" onClick={connect} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
        {walletError && <p className="text-danger text-sm max-w-md">{walletError}</p>}
      </div>
    );
  }

  if (!isExpectedNetwork) {
    return (
      <div className="flex items-center gap-4">
        <span title={account} className="badge badge-primary font-mono">
          {truncateAddress(account)}
        </span>
        <button className="btn btn-danger" onClick={switchToSepolia} disabled={isSwitching}>
          {isSwitching ? "Switching..." : "Switch to Sepolia"}
        </button>
      </div>
    );
  }

  if (isAuthenticated && walletAddress) {
    return (
      <div className="flex items-center gap-4">
        <span title={walletAddress} className="badge badge-success font-mono">
          {truncateAddress(walletAddress)}
        </span>
        <button className="btn btn-secondary" onClick={logout}>Sign Out</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span title={account} className="badge badge-primary font-mono">
        {truncateAddress(account)}
      </span>
      <button
        className="btn btn-primary"
        onClick={() => login(account, provider)}
        disabled={isLoading}
      >
        Verify Wallet
      </button>
      {authError && <p className="text-danger text-sm max-w-md">{authError}</p>}
    </div>
  );
}
