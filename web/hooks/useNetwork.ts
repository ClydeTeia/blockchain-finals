"use client";

import { useCallback, useEffect, useState } from "react";
import { getExpectedChainId } from "@/lib/blockchain/contract";

const SEPOLIA_HEX = "0xaa36a7";

export type NetworkState = {
  chainId: number | null;
  isExpectedNetwork: boolean;
  isSwitching: boolean;
  switchToSepolia: () => Promise<void>;
};

export function useNetwork(): NetworkState {
  const [chainId, setChainId] = useState<number | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const eth = window.ethereum;

    (eth.request({ method: "eth_chainId" }) as Promise<string>)
      .then((hex) => setChainId(parseInt(hex, 16)))
      .catch(() => {});

    const handleChainChanged = (...args: unknown[]) => {
      setChainId(parseInt(args[0] as string, 16));
    };

    eth.on("chainChanged", handleChainChanged);
    return () => {
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const switchToSepolia = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    setIsSwitching(true);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_HEX }],
      });
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_HEX,
              chainName: "Sepolia",
              rpcUrls: ["https://rpc.sepolia.org"],
              nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      }
    } finally {
      setIsSwitching(false);
    }
  }, []);

  return {
    chainId,
    isExpectedNetwork: chainId === getExpectedChainId(),
    isSwitching,
    switchToSepolia,
  };
}
