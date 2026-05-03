"use client";

import { WalletProvider } from "@/hooks/useWallet";
import Header from "@/components/Header";
import { NetworkGuard } from "@/hooks/useNetwork";
import ConnectWalletModal from "@/components/ConnectWalletModal";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <Header />
      <NetworkGuard />
      <ConnectWalletModal />
      <main>{children}</main>
    </WalletProvider>
  );
}
