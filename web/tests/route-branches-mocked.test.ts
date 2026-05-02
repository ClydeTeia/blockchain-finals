import { describe, expect, it, vi, beforeEach } from "vitest";

describe("Route branch coverage with targeted mocks", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("covers refresh-proof 403 branch", async () => {
    vi.doMock("@/lib/auth/require-session", () => ({
      requireSession: vi.fn().mockResolvedValue({
        walletAddress: "0x0000000000000000000000000000000000000001",
        exp: 9999999999
      })
    }));
    vi.doMock("@/lib/answers/data-store", () => ({
      getAnswerById: vi.fn().mockResolvedValue({
        id: "a1",
        surveyId: 1n,
        answerHash: "0x" + "1".repeat(64),
        rewardAmountWei: "1",
        respondentWallet: "0x0000000000000000000000000000000000000002",
        validationStatus: "passed"
      }),
      updateAnswerProof: vi.fn().mockResolvedValue(true)
    }));

    const route = await import("@/app/api/answers/[id]/refresh-proof/route");
    const res = await route.POST(
      new Request("http://localhost/api/answers/a1/refresh-proof", {
        method: "POST"
      }),
      { params: Promise.resolve({ id: "a1" }) }
    );
    expect(res.status).toBe(403);
  });

  it("covers refresh-proof 400 failed-validation branch", async () => {
    vi.doMock("@/lib/auth/require-session", () => ({
      requireSession: vi.fn().mockResolvedValue({
        walletAddress: "0x0000000000000000000000000000000000000001",
        exp: 9999999999
      })
    }));
    vi.doMock("@/lib/answers/data-store", () => ({
      getAnswerById: vi.fn().mockResolvedValue({
        id: "a1",
        surveyId: 1n,
        answerHash: "0x" + "1".repeat(64),
        rewardAmountWei: "1",
        respondentWallet: "0x0000000000000000000000000000000000000001",
        validationStatus: "failed"
      }),
      updateAnswerProof: vi.fn().mockResolvedValue(true)
    }));

    const route = await import("@/app/api/answers/[id]/refresh-proof/route");
    const res = await route.POST(
      new Request("http://localhost/api/answers/a1/refresh-proof", {
        method: "POST"
      }),
      { params: Promise.resolve({ id: "a1" }) }
    );
    expect(res.status).toBe(400);
  });

  it("covers refresh-proof 500 signing error and update error branches", async () => {
    vi.doMock("@/lib/auth/require-session", () => ({
      requireSession: vi.fn().mockResolvedValue({
        walletAddress: "0x0000000000000000000000000000000000000001",
        exp: 9999999999
      })
    }));
    vi.doMock("@/lib/answers/data-store", () => ({
      getAnswerById: vi.fn().mockResolvedValue({
        id: "a1",
        surveyId: 1n,
        answerHash: "0x" + "1".repeat(64),
        rewardAmountWei: "1",
        respondentWallet: "0x0000000000000000000000000000000000000001",
        validationStatus: "passed"
      }),
      updateAnswerProof: vi.fn().mockResolvedValue(false)
    }));
    vi.doMock("@/lib/answers/proof", () => ({
      buildProofNonce: vi.fn().mockReturnValue("1-1"),
      signCompletionProof: vi.fn().mockRejectedValue(new Error("boom"))
    }));

    let route = await import("@/app/api/answers/[id]/refresh-proof/route");
    let res = await route.POST(
      new Request("http://localhost/api/answers/a1/refresh-proof", { method: "POST" }),
      { params: Promise.resolve({ id: "a1" }) }
    );
    expect(res.status).toBe(500);

    vi.resetModules();
    vi.doMock("@/lib/auth/require-session", () => ({
      requireSession: vi.fn().mockResolvedValue({
        walletAddress: "0x0000000000000000000000000000000000000001",
        exp: 9999999999
      })
    }));
    vi.doMock("@/lib/answers/data-store", () => ({
      getAnswerById: vi.fn().mockResolvedValue({
        id: "a1",
        surveyId: 1n,
        answerHash: "0x" + "1".repeat(64),
        rewardAmountWei: "1",
        respondentWallet: "0x0000000000000000000000000000000000000001",
        validationStatus: "passed"
      }),
      updateAnswerProof: vi.fn().mockResolvedValue(false)
    }));
    vi.doMock("@/lib/answers/proof", () => ({
      buildProofNonce: vi.fn().mockReturnValue("1-1"),
      signCompletionProof: vi.fn().mockResolvedValue("0xabc")
    }));

    route = await import("@/app/api/answers/[id]/refresh-proof/route");
    res = await route.POST(
      new Request("http://localhost/api/answers/a1/refresh-proof", { method: "POST" }),
      { params: Promise.resolve({ id: "a1" }) }
    );
    expect(res.status).toBe(500);
  });

  it("covers mark-onchain 403/404/500 branches", async () => {
    vi.doMock("@/lib/auth/require-session", () => ({
      requireSession: vi.fn().mockResolvedValue({
        walletAddress: "0x0000000000000000000000000000000000000001",
        exp: 9999999999
      })
    }));
    vi.doMock("@/lib/answers/data-store", () => ({
      getAnswerById: vi.fn().mockResolvedValue({
        respondentWallet: "0x0000000000000000000000000000000000000002"
      }),
      markAnswerOnchainConfirmed: vi.fn().mockResolvedValue(true)
    }));
    let route = await import("@/app/api/answers/[id]/mark-onchain-confirmed/route");
    let res = await route.POST(
      new Request("http://localhost/api/answers/a1/mark-onchain-confirmed", {
        method: "POST",
        body: JSON.stringify({ txHash: "0x" + "a".repeat(64) })
      }),
      { params: Promise.resolve({ id: "a1" }) }
    );
    expect(res.status).toBe(403);

    vi.resetModules();
    vi.doMock("@/lib/auth/require-session", () => ({
      requireSession: vi.fn().mockResolvedValue({
        walletAddress: "0x0000000000000000000000000000000000000001",
        exp: 9999999999
      })
    }));
    vi.doMock("@/lib/answers/data-store", () => ({
      getAnswerById: vi.fn().mockResolvedValue(null),
      markAnswerOnchainConfirmed: vi.fn().mockResolvedValue(true)
    }));
    route = await import("@/app/api/answers/[id]/mark-onchain-confirmed/route");
    res = await route.POST(
      new Request("http://localhost/api/answers/a1/mark-onchain-confirmed", {
        method: "POST",
        body: JSON.stringify({ txHash: "0x" + "a".repeat(64) })
      }),
      { params: Promise.resolve({ id: "a1" }) }
    );
    expect(res.status).toBe(404);

    vi.resetModules();
    vi.doMock("@/lib/auth/require-session", () => ({
      requireSession: vi.fn().mockResolvedValue({
        walletAddress: "0x0000000000000000000000000000000000000001",
        exp: 9999999999
      })
    }));
    vi.doMock("@/lib/answers/data-store", () => ({
      getAnswerById: vi.fn().mockResolvedValue({
        respondentWallet: "0x0000000000000000000000000000000000000001"
      }),
      markAnswerOnchainConfirmed: vi.fn().mockResolvedValue(false)
    }));
    route = await import("@/app/api/answers/[id]/mark-onchain-confirmed/route");
    res = await route.POST(
      new Request("http://localhost/api/answers/a1/mark-onchain-confirmed", {
        method: "POST",
        body: JSON.stringify({ txHash: "0x" + "a".repeat(64) })
      }),
      { params: Promise.resolve({ id: "a1" }) }
    );
    expect(res.status).toBe(500);
  });
});

