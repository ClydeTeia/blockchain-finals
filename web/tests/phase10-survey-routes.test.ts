import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Phase 10 survey routes", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    delete process.env.CONTRACT_ADDRESS;
    delete process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
    delete process.env.SEPOLIA_RPC_URL;
  });

  it("returns 500 for GET /api/surveys when contract config is missing", async () => {
    const route = await import("@/app/api/surveys/route");
    const res = await route.GET(new Request("http://localhost/api/surveys"));
    expect(res.status).toBe(500);
  });

  it("accepts server-side CONTRACT_ADDRESS fallback", async () => {
    process.env.CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000001";
    const { getContractAddress } = await import("@/lib/blockchain/contract");
    expect(getContractAddress()).toBe("0x0000000000000000000000000000000000000001");
  });

  it("returns 400 for invalid survey id in GET /api/surveys/:id", async () => {
    const route = await import("@/app/api/surveys/[surveyId]/route");
    const res = await route.GET(new Request("http://localhost/api/surveys/abc"), {
      params: Promise.resolve({ surveyId: "abc" })
    });
    expect(res.status).toBe(400);
  });

  it("returns default rules for GET /api/surveys/:id/quality-rules without supabase config", async () => {
    const route = await import("@/app/api/surveys/[surveyId]/quality-rules/route");
    const res = await route.GET(
      new Request("http://localhost/api/surveys/1/quality-rules"),
      { params: Promise.resolve({ surveyId: "1" }) }
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { source: string; rules: Record<string, unknown> };
    expect(data.source).toBe("default");
    expect(data.rules).toBeDefined();
  });
});
