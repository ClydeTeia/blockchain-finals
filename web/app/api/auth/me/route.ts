import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";

export async function GET() {
  const session = await requireSession();
  if ("response" in session) {
    return session.response;
  }

  return NextResponse.json({
    authenticated: true,
    walletAddress: session.walletAddress,
    expiresAt: new Date(session.exp * 1000).toISOString()
  });
}
