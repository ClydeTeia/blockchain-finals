import { Wallet } from "ethers";

import { AUTH_COOKIE_NAME } from "@/lib/auth/config";
import { resetNonceStoreForTests } from "@/lib/auth/nonce-store";
import { POST as noncePost } from "@/app/api/auth/nonce/route";
import { POST as verifyPost } from "@/app/api/auth/verify/route";
import { GET as meGet } from "@/app/api/auth/me/route";
import { clearMockCookies } from "@/test-utils/mock-next-headers";

describe("Auth route handlers", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret";
    resetNonceStoreForTests();
    clearMockCookies();
  });

  it("issues a nonce and verifies wallet signature", async () => {
    const wallet = Wallet.createRandom();

    const nonceResponse = await noncePost(
      new Request("http://localhost/api/auth/nonce", {
        method: "POST",
        body: JSON.stringify({ walletAddress: wallet.address })
      })
    );
    expect(nonceResponse.status).toBe(200);
    const nonceBody = (await nonceResponse.json()) as {
      nonce: string;
      message: string;
    };
    expect(nonceBody.nonce).toBeTruthy();

    const signature = await wallet.signMessage(nonceBody.message);
    const verifyResponse = await verifyPost(
      new Request("http://localhost/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          walletAddress: wallet.address,
          nonce: nonceBody.nonce,
          signature
        })
      })
    );

    expect(verifyResponse.status).toBe(200);
    const setCookie = verifyResponse.headers.get("set-cookie");
    expect(setCookie).toContain(AUTH_COOKIE_NAME);
  });

  it("rejects reused nonce", async () => {
    const wallet = Wallet.createRandom();

    const nonceResponse = await noncePost(
      new Request("http://localhost/api/auth/nonce", {
        method: "POST",
        body: JSON.stringify({ walletAddress: wallet.address })
      })
    );
    const { nonce, message } = (await nonceResponse.json()) as {
      nonce: string;
      message: string;
    };
    const signature = await wallet.signMessage(message);

    const firstVerify = await verifyPost(
      new Request("http://localhost/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          walletAddress: wallet.address,
          nonce,
          signature
        })
      })
    );
    expect(firstVerify.status).toBe(200);

    const secondVerify = await verifyPost(
      new Request("http://localhost/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          walletAddress: wallet.address,
          nonce,
          signature
        })
      })
    );
    expect(secondVerify.status).toBe(401);
  });

  it("rejects wallet mismatch for nonce", async () => {
    const walletA = Wallet.createRandom();
    const walletB = Wallet.createRandom();

    const nonceResponse = await noncePost(
      new Request("http://localhost/api/auth/nonce", {
        method: "POST",
        body: JSON.stringify({ walletAddress: walletA.address })
      })
    );
    const { nonce, message } = (await nonceResponse.json()) as {
      nonce: string;
      message: string;
    };

    const signature = await walletA.signMessage(message);
    const verifyResponse = await verifyPost(
      new Request("http://localhost/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          walletAddress: walletB.address,
          nonce,
          signature
        })
      })
    );
    expect(verifyResponse.status).toBe(401);
  });

  it("rejects protected /api/auth/me when no session cookie exists", async () => {
    const response = await meGet();
    expect(response.status).toBe(401);
  });

  it("rejects expired nonce", async () => {
    process.env.SESSION_SECRET = "test-secret";
    process.env.NEXT_PUBLIC_CHAIN_ID = "11155111";

    const wallet = Wallet.createRandom();
    const nonceResponse = await noncePost(
      new Request("http://localhost/api/auth/nonce", {
        method: "POST",
        body: JSON.stringify({ walletAddress: wallet.address })
      })
    );
    const { nonce, message } = (await nonceResponse.json()) as {
      nonce: string;
      message: string;
    };
    const signature = await wallet.signMessage(message);

    // Simulate expiration by clearing in-memory store.
    resetNonceStoreForTests();
    const verifyResponse = await verifyPost(
      new Request("http://localhost/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          walletAddress: wallet.address,
          nonce,
          signature
        })
      })
    );
    expect(verifyResponse.status).toBe(401);
  });
});
