import { buildKycFormData, mapVerificationStatus } from "@/lib/kyc/adapters";
import { toSurveySummary } from "@/lib/blockchain/contract";

describe("Phase 8/9/11 adapter coverage", () => {
  it("builds KYC form data with document and selfie fields", () => {
    const form = buildKycFormData(
      new File(["doc"], "doc.png", { type: "image/png" }),
      new File(["selfie"], "selfie.png", { type: "image/png" })
    );
    expect(form.get("document")).toBeInstanceOf(File);
    expect(form.get("selfie")).toBeInstanceOf(File);
  });

  it("maps KYC statuses including not_submitted", () => {
    expect(mapVerificationStatus("not_submitted")).toBe("not_submitted");
    expect(mapVerificationStatus("pending")).toBe("pending");
    expect(mapVerificationStatus("approved")).toBe("approved");
    expect(mapVerificationStatus("rejected")).toBe("rejected");
    expect(mapVerificationStatus("revoked")).toBe("revoked");
  });

  it("adapts contract surveys() getter output for direct survey answering", () => {
    const summary = toSurveySummary(7n, {
      creator: "0x0000000000000000000000000000000000000001",
      title: "Title",
      description: "Description",
      question: "Question",
      rewardPerResponse: 10n,
      maxResponses: 100n,
      responseCount: 3n,
      escrowRemaining: 970n,
      active: true,
      unusedRewardsWithdrawn: false
    });
    expect(summary.id).toBe(7n);
    expect(summary.options).toBeNull();
    expect(summary.question).toBe("Question");
  });
});
