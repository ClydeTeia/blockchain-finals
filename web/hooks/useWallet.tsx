"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { BrowserProvider } from "ethers";

type WalletContextType = {
  address: string | null;
  chainId: number | null;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToSepolia: () => Promise<void>;
};

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const connect = async () => {
    if (!(window as any).ethereum) throw new Error("MetaMask not installed");
    const provider = new BrowserProvider((window as any).ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();
    setAddress(accounts[0]);
    setChainId(Number(network.chainId));
  };

  const disconnect = () => {
    setAddress(null);
    setChainId(null);
  };

  const switchToSepolia = async () => {
    if (!(window as any).ethereum) return;
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      await provider.send("wallet_switchEthereumChain", [
        { chainId: "0xaa36a7" } // 11155111 in hex
      ]);
    } catch (err) {
      // Chain not added, prompt to add
      console.warn("Sepolia network not added");
    }
  };

  return (
    <WalletContext.Provider value={{ address, chainId, connected: !!address, connect, disconnect, switchToSepolia }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be within WalletProvider");
  return ctx;
}
