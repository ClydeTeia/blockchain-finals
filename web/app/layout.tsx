import type { Metadata } from "next";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { AuthSignatureButton } from "@/components/AuthSignatureButton";

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
      </body>
    </html>
  );
}
