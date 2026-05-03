"use client";

import { useCallback, useEffect, useState } from "react";
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

export function useWallet(): WalletState {
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
    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
    };
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
        method: "eth_requestAccounts",
      })) as string[];
      setAccount(accounts[0]);
      setProvider(new BrowserProvider(window.ethereum));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Wallet connection failed.";
      setError(msg);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
  }, []);

  return {
    account,
    provider,
    isConnecting,
    isMetaMaskInstalled,
    error,
    connect,
    disconnect,
  };
}
