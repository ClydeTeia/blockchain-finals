"use client";

import { useWallet } from "@/hooks/useWallet";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { account, isConnecting, isMetaMaskInstalled, error, connect } =
    useWallet();

  if (!isMetaMaskInstalled) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Install MetaMask
      </a>
    );
  }

  if (account) {
    return <span title={account}>{truncateAddress(account)}</span>;
  }

  return (
    <div>
      <button onClick={connect} disabled={isConnecting}>
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
      {error && <p style={{ color: "red", fontSize: "0.8rem" }}>{error}</p>}
    </div>
  );
}
