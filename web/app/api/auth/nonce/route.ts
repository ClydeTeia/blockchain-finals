import { NextResponse } from "next/server";

import { createNonceRecord } from "@/lib/auth/nonce-store";
import {
  buildWalletLoginMessage,
  generateNonce,
  normalizeWalletAddress
} from "@/lib/auth/wallet";

type NonceRequest = {
  walletAddress?: string;
};

export async function POST(request: Request) {
  let body: NonceRequest;
  try {
    body = (await request.json()) as NonceRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.walletAddress) {
    return NextResponse.json(
      { error: "walletAddress is required." },
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

  const nonce = generateNonce();
  const message = buildWalletLoginMessage({ walletAddress, nonce });
  const record = await createNonceRecord({ walletAddress, nonce, message });

  return NextResponse.json({
    walletAddress,
    nonce: record.nonce,
    message: record.message,
    expiresAt: record.expiresAt.toISOString()
  });
}
