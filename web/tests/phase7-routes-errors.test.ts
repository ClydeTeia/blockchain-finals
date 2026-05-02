import { Wallet } from "ethers";

import { AUTH_COOKIE_NAME } from "@/lib/auth/config";
import { createSessionToken } from "@/lib/auth/session";
import { resetAnswerStoresForTests } from "@/lib/answers/data-store";
import { POST as startAttemptPost } from "@/app/api/surveys/[surveyId]/start-attempt/route";
import { POST as submitPost } from "@/app/api/answers/submit/route";
import { POST as refreshProofPost } from "@/app/api/answers/[id]/refresh-proof/route";
import { POST as markOnchainPost } from "@/app/api/answers/[id]/mark-onchain-confirmed/route";
import { clearMockCookies, setMockCookie } from "@/test-utils/mock-next-headers";

describe("Phase 7 route error coverage", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret";
    process.env.CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000001";
    process.env.NEXT_PUBLIC_CHAIN_ID = "11155111";
    process.env.VALIDATOR_PRIVATE_KEY = Wallet.createRandom().privateKey;
    process.env.VERIFIED_WALLET_ALLOWLIST = "";
    resetAnswerStoresForTests();
    clearMockCookies();
  });

  function login(wallet: { address: string }) {
    setMockCookie(AUTH_COOKIE_NAME, createSessionToken(wallet.address).token);
  }

  it("rejects invalid surveyId at start-attempt", async () => {
    const wallet = Wallet.createRandom();
    login(wallet);
    const response = await startAttemptPost(
      new Request("http://localhost/api/surveys/x/start-attempt", { method: "POST" }),
      { params: Promise.resolve({ surveyId: "x" }) }
    );
    expect(response.status).toBe(400);
  });

  it("rejects invalid JSON on answers submit", async () => {
    const wallet = Wallet.createRandom();
    login(wallet);
    const response = await submitPost(
      new Request("http://localhost/api/answers/submit", {
        method: "POST",
        body: "{not-json"
      })
    );
    expect(response.status).toBe(400);
  });

  it("rejects missing required submit fields", async () => {
    const wallet = Wallet.createRandom();
    login(wallet);
    const response = await submitPost(
      new Request("http://localhost/api/answers/submit", {
        method: "POST",
        body: JSON.stringify({})
      })
    );
    expect(response.status).toBe(400);
  });

  it("rejects unknown attempt on submit", async () => {
    const wallet = Wallet.createRandom();
    login(wallet);
    const response = await submitPost(
      new Request("http://localhost/api/answers/submit", {
        method: "POST",
        body: JSON.stringify({
          surveyId: "1",
          attemptId: "missing",
          rewardAmountWei: "1",
          answer: {}
        })
      })
    );
    expect(response.status).toBe(404);
  });

  it("rejects malformed txHash on mark-onchain-confirmed", async () => {
    const wallet = Wallet.createRandom();
    login(wallet);
    const response = await markOnchainPost(
      new Request("http://localhost/api/answers/a/mark-onchain-confirmed", {
        method: "POST",
        body: JSON.stringify({ txHash: "bad" })
      }),
      { params: Promise.resolve({ id: "a" }) }
    );
    expect(response.status).toBe(400);
  });

  it("rejects invalid JSON on mark-onchain-confirmed", async () => {
    const wallet = Wallet.createRandom();
    login(wallet);
    const response = await markOnchainPost(
      new Request("http://localhost/api/answers/a/mark-onchain-confirmed", {
        method: "POST",
        body: "{"
      }),
      { params: Promise.resolve({ id: "a" }) }
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 on refresh-proof for missing answer", async () => {
    const wallet = Wallet.createRandom();
    login(wallet);
    const response = await refreshProofPost(
      new Request("http://localhost/api/answers/missing/refresh-proof", {
        method: "POST"
      }),
      { params: Promise.resolve({ id: "missing" }) }
    );
    expect(response.status).toBe(404);
  });
});

