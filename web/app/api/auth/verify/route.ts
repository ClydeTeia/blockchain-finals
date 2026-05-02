import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/lib/auth/config";
import {
  getNonceRecord,
  markNonceAsUsed
} from "@/lib/auth/nonce-store";
import { createSessionToken } from "@/lib/auth/session";
import { normalizeWalletAddress, verifyWalletSignature } from "@/lib/auth/wallet";

type VerifyRequest = {
  walletAddress?: string;
  signature?: string;
  nonce?: string;
};

export async function POST(request: Request) {
  let body: VerifyRequest;
  try {
    body = (await request.json()) as VerifyRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.walletAddress || !body.signature || !body.nonce) {
    return NextResponse.json(
      { error: "walletAddress, signature, and nonce are required." },
      { status: 400 }
    );
  }

  const walletAddress = normalizeWalletAddress(body.walletAddress);
  if (!walletAddress) {
    return NextResponse.json(
      { error: "Invalid walletAddress format." },
      { status: 400 }
    );
  }

  const nonceRecord = await getNonceRecord(body.nonce);
  if (!nonceRecord) {
    return NextResponse.json(
      { error: "Nonce is missing or expired." },
      { status: 401 }
    );
  }

  if (nonceRecord.usedAt) {
    return NextResponse.json(
      { error: "Nonce has already been used." },
      { status: 401 }
    );
  }

  if (nonceRecord.walletAddress !== walletAddress) {
    return NextResponse.json(
      { error: "Nonce does not belong to this wallet." },
      { status: 401 }
    );
  }

  const isValidSignature = verifyWalletSignature({
    message: nonceRecord.message,
    signature: body.signature,
    walletAddress
  });

  if (!isValidSignature) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  await markNonceAsUsed(body.nonce);
  let session: { token: string; expiresAt: Date };
  try {
    session = createSessionToken(walletAddress);
  } catch {
    return NextResponse.json(
      { error: "Server auth configuration is missing." },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    walletAddress,
    authenticated: true,
    expiresAt: session.expiresAt.toISOString()
  });

  response.cookies.set(AUTH_COOKIE_NAME, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/"
  });

  return response;
}
