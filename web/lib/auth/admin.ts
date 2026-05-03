import { requireSession } from "@/lib/auth/require-session";

function parseAllowlist(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminWallet(walletAddress: string): boolean {
  const admins = parseAllowlist(process.env.ADMIN_WALLET_ALLOWLIST);
  const verifiers = parseAllowlist(process.env.VERIFIER_WALLET_ALLOWLIST);
  const allowlist = new Set([...admins, ...verifiers]);
  return allowlist.has(walletAddress.toLowerCase());
}

export async function requireAdminSession(): Promise<
  | { walletAddress: string; exp: number }
  | { response: Response }
> {
  const session = await requireSession();
  if ("response" in session) {
    return { response: session.response };
  }

  if (!isAdminWallet(session.walletAddress)) {
    return {
      response: Response.json(
        { error: "Admin authorization required." },
        { status: 403 }
      )
    };
  }

  return session;
}
