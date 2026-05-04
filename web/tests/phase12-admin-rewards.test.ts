import { beforeEach, describe, expect, it, vi } from "vitest";
import { RewardDashboard } from "@/components/RewardDashboard";
import { ResponseAuditPanel } from "@/components/ResponseAuditPanel";

describe("Phase 12 rewards and admin audit", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("exports rewards and audit components", () => {
    expect(RewardDashboard).toBeDefined();
    expect(ResponseAuditPanel).toBeDefined();
  });

  it("returns 403 for GET /api/admin/answers when admin session is rejected", async () => {
    vi.doMock("@/lib/auth/admin", () => ({
      requireAdminSession: vi.fn().mockResolvedValue({
        response: Response.json({ error: "Admin authorization required." }, { status: 403 })
      })
    }));

    const route = await import("@/app/api/admin/answers/route");
    const res = await route.GET();
    expect(res.status).toBe(403);
  });

  it("returns answers for GET /api/admin/answers with valid admin session", async () => {
    vi.doMock("@/lib/auth/admin", () => ({
      requireAdminSession: vi.fn().mockResolvedValue({
        walletAddress: "0x0000000000000000000000000000000000000001",
        exp: Math.floor(Date.now() / 1000) + 300
      })
    }));
    vi.doMock("@/lib/answers/data-store", () => ({
      getAllAnswers: vi.fn().mockResolvedValue([
        {
          id: "a1",
          attemptId: "attempt-1",
          surveyId: 1n,
          respondentWallet: "0x1",
          answerJson: {},
          normalizedAnswerJson: {},
          answerHash: "0x" + "1".repeat(64),
          salt: "salt",
          status: "completed_onchain",
          validationScore: 90,
          validationStatus: "passed",
          validationReason: null,
          validationDetails: {},
          startedAt: new Date("2026-05-04T00:00:00.000Z"),
          submittedAt: new Date("2026-05-04T00:00:10.000Z"),
          completionTimeSeconds: 10,
          rewardAmountWei: "1",
          completionNonce: "nonce-1",
          completionDeadline: new Date("2026-05-05T00:00:00.000Z"),
          completionSignature: "0x" + "2".repeat(130),
          onchainTxHash: "0x" + "3".repeat(64),
          onchainConfirmedAt: new Date("2026-05-04T00:01:00.000Z"),
          flagged: false,
          auditNotes: null,
          createdAt: new Date("2026-05-04T00:00:00.000Z")
        }
      ])
    }));

    const route = await import("@/app/api/admin/answers/route");
    const res = await route.GET();
    expect(res.status).toBe(200);
    const data = (await res.json()) as { answers: Array<{ id: string }> };
    expect(data.answers).toHaveLength(1);
    expect(data.answers[0].id).toBe("a1");
  });
});
