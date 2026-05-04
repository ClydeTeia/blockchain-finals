import type { Metadata } from "next";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { AuthSignatureButton } from "@/components/AuthSignatureButton";
import { WalletProvider } from "@/hooks/useWallet";
import { WalletAuthProvider } from "@/hooks/useWalletAuth";
import Link from "next/link";

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
            <header style={{
              backgroundColor: "white",
              borderBottom: "1px solid #dee2e6",
              padding: "1rem 2rem",
            }}>
              <nav style={{
                maxWidth: "1200px",
                margin: "0 auto",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                  <Link href="/" style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#333", textDecoration: "none" }}>
                    SurveyChain Rewards
                  </Link>
                  <Link href="/surveys" style={{ color: "#007bff", textDecoration: "none", fontWeight: "500" }}>
                    Surveys
                  </Link>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <ConnectWalletButton />
                  <AuthSignatureButton />
                </div>
              </nav>
            </header>
            <main style={{ padding: "2rem 1rem", maxWidth: "1200px", margin: "0 auto" }}>
              {children}
            </main>
          </WalletAuthProvider>
        </WalletProvider>
      </body>
    </html>
  );
}

