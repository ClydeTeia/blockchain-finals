import type { Metadata } from "next";
import { AuthSignatureButton } from "@/components/AuthSignatureButton";
import { HeaderNavLinks } from "@/components/HeaderNavLinks";
import { WalletProvider } from "@/hooks/useWallet";
import { WalletAuthProvider } from "@/hooks/useWalletAuth";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SurveyChain Rewards",
  description: "Blockchain-based escrow and proof-of-completion for verified survey rewards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <WalletAuthProvider>
            <header>
              <div className="container header-inner">
                <div className="flex items-center gap-8">
                  <Link href="/" className="logo-text">
                    SurveyChain
                  </Link>
                  <HeaderNavLinks />
                </div>
                <div className="flex items-center gap-4">
                  <AuthSignatureButton />
                </div>
              </div>
            </header>
            <main className="container mt-8 mb-12">
              {children}
            </main>
          </WalletAuthProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
