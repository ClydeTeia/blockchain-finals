import type { Metadata } from "next";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { AuthSignatureButton } from "@/components/AuthSignatureButton";
import { WalletProvider } from "@/hooks/useWallet";
import { WalletAuthProvider } from "@/hooks/useWalletAuth";

export const metadata: Metadata = {
  title: "SurveyChain Rewards",
  description: "Blockchain-based escrow and proof-of-completion for verified survey rewards",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <WalletAuthProvider>
            <header>
              <nav>
                <span>SurveyChain Rewards</span>
                <div>
                  <ConnectWalletButton />
                  <AuthSignatureButton />
                </div>
              </nav>
            </header>
            <main>{children}</main>
          </WalletAuthProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
