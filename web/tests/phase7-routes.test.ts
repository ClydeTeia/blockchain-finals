import { Wallet } from "ethers";

import { AUTH_COOKIE_NAME } from "@/lib/auth/config";
import { createSessionToken } from "@/lib/auth/session";
import { resetAnswerStoresForTests } from "@/lib/answers/data-store";
import { POST as startAttemptPost } from "@/app/api/surveys/[surveyId]/start-attempt/route";
import { POST as submitPost } from "@/app/api/answers/submit/route";
import { POST as refreshProofPost } from "@/app/api/answers/[id]/refresh-proof/route";
import { POST as markOnchainPost } from "@/app/api/answers/[id]/mark-onchain-confirmed/route";
import { GET as myAnswersGet } from "@/app/api/answers/my/route";
import { clearMockCookies, setMockCookie } from "@/test-utils/mock-next-headers";

describe("Phase 7 route handlers", () => {
  beforeEach(() => {
    resetAnswerStoresForTests();
    clearMockCookies();
    process.env.SESSION_SECRET = "test-secret";
    process.env.CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000001";
    process.env.NEXT_PUBLIC_CHAIN_ID = "11155111";
    process.env.VALIDATOR_PRIVATE_KEY = Wallet.createRandom().privateKey;
    process.env.QUALITY_MIN_COMPLETION_SECONDS = "30";
    process.env.QUALITY_MIN_TEXT_LENGTH = "20";
    process.env.QUALITY_PASSING_SCORE = "70";
  });

  async function authenticate(wallet: { address: string }) {
    const session = createSessionToken(wallet.address);
    setMockCookie(AUTH_COOKIE_NAME, session.token);
  }

  it("creates attempt, submits valid answer, refreshes proof, marks onchain, and lists my answers", async () => {
    const wallet = Wallet.createRandom();
    await authenticate(wallet);
    process.env.VERIFIED_WALLET_ALLOWLIST = wallet.address;

    const startAttemptResponse = await startAttemptPost(
      new Request("http://localhost/api/surveys/1/start-attempt", { method: "POST" }),
      { params: Promise.resolve({ surveyId: "1" }) }
    );
    expect(startAttemptResponse.status).toBe(200);
    const startAttemptBody = (await startAttemptResponse.json()) as { attemptId: string };

    const submitResponse = await submitPost(
      new Request("http://localhost/api/answers/submit", {
        method: "POST",
        body: JSON.stringify({
          surveyId: "1",
          attemptId: startAttemptBody.attemptId,
          rewardAmountWei: "1000",
          completionTimeSeconds: 60,
          answer: { q1: "This is a sufficiently long answer for quality gate." }
        })
      })
    );
    expect(submitResponse.status).toBe(200);
    const submitBody = (await submitResponse.json()) as {
      answerId: string;
      validation: { passed: boolean };
      proof: { signature: string } | null;
    };
    expect(submitBody.validation.passed).toBe(true);
    expect(submitBody.proof?.signature).toBeTruthy();

    const refreshResponse = await refreshProofPost(
      new Request(`http://localhost/api/answers/${submitBody.answerId}/refresh-proof`, {
        method: "POST"
      }),
      { params: Promise.resolve({ id: submitBody.answerId }) }
    );
    expect(refreshResponse.status).toBe(200);

    const markResponse = await markOnchainPost(
      new Request(
        `http://localhost/api/answers/${submitBody.answerId}/mark-onchain-confirmed`,
        {
          method: "POST",
          body: JSON.stringify({
            txHash: `0x${"a".repeat(64)}`
          })
        }
      ),
      { params: Promise.resolve({ id: submitBody.answerId }) }
    );
    expect(markResponse.status).toBe(200);

    const myResponse = await myAnswersGet();
    expect(myResponse.status).toBe(200);
    const myBody = (await myResponse.json()) as { answers: Array<{ id: string }> };
    expect(myBody.answers.length).toBe(1);
    expect(myBody.answers[0]?.id).toBe(submitBody.answerId);
  });

  it("returns no proof when quality gate fails", async () => {
    const wallet = Wallet.createRandom();
    await authenticate(wallet);
    process.env.VERIFIED_WALLET_ALLOWLIST = wallet.address;

    const startAttemptResponse = await startAttemptPost(
      new Request("http://localhost/api/surveys/1/start-attempt", { method: "POST" }),
      { params: Promise.resolve({ surveyId: "1" }) }
    );
    const startAttemptBody = (await startAttemptResponse.json()) as { attemptId: string };

    const submitResponse = await submitPost(
      new Request("http://localhost/api/answers/submit", {
        method: "POST",
        body: JSON.stringify({
          surveyId: "1",
          attemptId: startAttemptBody.attemptId,
          rewardAmountWei: "1000",
          completionTimeSeconds: 5,
          answer: { q1: "short" }
        })
      })
    );
    const submitBody = (await submitResponse.json()) as {
      validation: { passed: boolean };
      proof: unknown;
    };

    expect(submitResponse.status).toBe(200);
    expect(submitBody.validation.passed).toBe(false);
    expect(submitBody.proof).toBeNull();
  });

  it("blocks duplicate reward-eligible submission", async () => {
    const wallet = Wallet.createRandom();
    await authenticate(wallet);
    process.env.VERIFIED_WALLET_ALLOWLIST = wallet.address;

    const attempt1 = await startAttemptPost(
      new Request("http://localhost/api/surveys/1/start-attempt", { method: "POST" }),
      { params: Promise.resolve({ surveyId: "1" }) }
    );
    const body1 = (await attempt1.json()) as { attemptId: string };
    await submitPost(
      new Request("http://localhost/api/answers/submit", {
        method: "POST",
        body: JSON.stringify({
          surveyId: "1",
          attemptId: body1.attemptId,
          rewardAmountWei: "1000",
          completionTimeSeconds: 60,
          answer: { q1: "first sufficiently long answer text" }
        })
      })
    );

    const attempt2 = await startAttemptPost(
      new Request("http://localhost/api/surveys/1/start-attempt", { method: "POST" }),
      { params: Promise.resolve({ surveyId: "1" }) }
    );
    const body2 = (await attempt2.json()) as { attemptId: string };
    const duplicate = await submitPost(
      new Request("http://localhost/api/answers/submit", {
        method: "POST",
        body: JSON.stringify({
          surveyId: "1",
          attemptId: body2.attemptId,
          rewardAmountWei: "1000",
          completionTimeSeconds: 60,
          answer: { q1: "second sufficiently long answer text" }
        })
      })
    );

    expect(duplicate.status).toBe(409);
  });

  it("blocks unverified wallet submissions", async () => {
    const wallet = Wallet.createRandom();
    await authenticate(wallet);
    process.env.VERIFIED_WALLET_ALLOWLIST = "";

    const startAttemptResponse = await startAttemptPost(
      new Request("http://localhost/api/surveys/1/start-attempt", { method: "POST" }),
      { params: Promise.resolve({ surveyId: "1" }) }
    );
    const startAttemptBody = (await startAttemptResponse.json()) as { attemptId: string };

    const submitResponse = await submitPost(
      new Request("http://localhost/api/answers/submit", {
        method: "POST",
        body: JSON.stringify({
          surveyId: "1",
          attemptId: startAttemptBody.attemptId,
          rewardAmountWei: "1000",
          completionTimeSeconds: 60,
          answer: { q1: "long enough but unverified wallet flow" }
        })
      })
    );
    expect(submitResponse.status).toBe(403);
  });
});
