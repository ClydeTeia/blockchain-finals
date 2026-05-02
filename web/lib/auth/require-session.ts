import { NextResponse } from "next/server";

import { readSessionFromCookies } from "./session";

export async function requireSession(): Promise<
  | { walletAddress: string; exp: number }
  | { response: NextResponse<{ error: string }> }
> {
  const session = await readSessionFromCookies();
  if (!session) {
    return {
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      )
    };
  }

  return session;
}
