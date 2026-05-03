"use client";

import { useNetwork } from "@/hooks/useNetwork";
import { useWallet } from "@/hooks/useWallet";
import { getExpectedChainId } from "@/lib/blockchain/contract";

type NetworkGuardProps = {
  children: React.ReactNode;
};

export function NetworkGuard({ children }: NetworkGuardProps) {
  const { account } = useWallet();
  const { isExpectedNetwork, isSwitching, switchToSepolia } = useNetwork();

  if (!account) {
    return <>{children}</>;
  }

  if (!isExpectedNetwork) {
    return (
      <div role="alert">
        <p>
          Wrong network. This app requires Sepolia (chain ID{" "}
          {getExpectedChainId()}).
        </p>
        <button onClick={switchToSepolia} disabled={isSwitching}>
          {isSwitching ? "Switching..." : "Switch to Sepolia"}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
