"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

export type WalletState = {
  account: string | null;
  provider: BrowserProvider | null;
  isConnecting: boolean;
  isMetaMaskInstalled: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletState | null>(null);

function isUserRejectedWalletAction(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as { code?: string | number; message?: string };
  return (
    err.code === "ACTION_REJECTED" ||
    err.code === 4001 ||
    err.message?.toLowerCase().includes("user rejected") === true
  );
}

function useWalletState(): WalletState {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    setIsMetaMaskInstalled(true);
    const eth = window.ethereum;
    (eth.request({ method: "eth_accounts" }) as Promise<string[]>)
      .then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setProvider(new BrowserProvider(eth));
        }
      })
      .catch(() => {});
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        setAccount(null);
        setProvider(null);
      } else {
        setAccount(accounts[0]);
        setProvider(new BrowserProvider(eth));
      }
    };
    eth.on("accountsChanged", handleAccountsChanged);
    return () => eth.removeListener("accountsChanged", handleAccountsChanged);
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask is not installed.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts"
      })) as string[];
      setAccount(accounts[0]);
      setProvider(new BrowserProvider(window.ethereum));
    } catch (e: unknown) {
      if (!isUserRejectedWalletAction(e)) {
        setError(e instanceof Error ? e.message : "Wallet connection failed.");
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
  }, []);

  return { account, provider, isConnecting, isMetaMaskInstalled, error, connect, disconnect };
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWalletState();
  return React.createElement(WalletContext.Provider, { value: wallet }, children);
}

export function useWallet(): WalletState {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider.");
  }
  return context;
}
