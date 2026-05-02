import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SurveyChain Rewards",
  description: "Phase 1 foundation scaffold"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
