import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, SESSION_TTL_SECONDS } from "./config";
import { normalizeWalletAddress } from "./wallet";

type SessionPayload = {
  walletAddress: string;
  exp: number;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required for auth session signing.");
  }

  return secret;
}

function sign(unsignedToken: string, secret: string): string {
  return createHmac("sha256", secret).update(unsignedToken).digest("base64url");
}

export function createSessionToken(walletAddress: string): {
  token: string;
  expiresAt: Date;
} {
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
  if (!normalizedWalletAddress) {
    throw new Error("Invalid wallet address.");
  }

  const secret = getSessionSecret();
  const expiresAtUnix = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload: SessionPayload = {
    walletAddress: normalizedWalletAddress,
    exp: expiresAtUnix
  };

  const unsignedToken = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(unsignedToken, secret);

  return {
    token: `${unsignedToken}.${signature}`,
    expiresAt: new Date(expiresAtUnix * 1000)
  };
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [unsignedToken, signature] = token.split(".");
  if (!unsignedToken || !signature) {
    return null;
  }

  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return null;
  }
  const expectedSignature = sign(unsignedToken, secret);

  const left = Buffer.from(signature, "utf8");
  const right = Buffer.from(expectedSignature, "utf8");
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64UrlDecode(unsignedToken)) as SessionPayload;
  } catch {
    return null;
  }

  const normalizedWalletAddress = normalizeWalletAddress(payload.walletAddress);
  if (!normalizedWalletAddress) {
    return null;
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return {
    walletAddress: normalizedWalletAddress,
    exp: payload.exp
  };
}

export async function readSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
