import {
  buildProofNonce,
  hashAnswer,
  normalizeAnswer,
  signCompletionProof
} from "@/lib/answers/proof";
import { evaluateQualityGate } from "@/lib/answers/quality-gate";
import {
  createAttempt,
  createAnswer,
  findSubmittedAnswerBySurveyAndWallet,
  getAnswerById,
  getAttemptById,
  getMyAnswers,
  markAnswerOnchainConfirmed,
  markAttemptSubmitted,
  resetAnswerStoresForTests,
  updateAnswerProof
} from "@/lib/answers/data-store";
import {
  createNonceRecord,
  getNonceRecord,
  markNonceAsUsed,
  resetNonceStoreForTests
} from "@/lib/auth/nonce-store";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { isCreatorWallet } from "@/lib/auth/creator";
import { isWalletVerified } from "@/lib/blockchain/verification";

describe("Library unit coverage", () => {
  beforeEach(() => {
    resetAnswerStoresForTests();
    resetNonceStoreForTests();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.VALIDATOR_PRIVATE_KEY;
    delete process.env.CONTRACT_ADDRESS;
    delete process.env.SEPOLIA_RPC_URL;
    process.env.NEXT_PUBLIC_CHAIN_ID = "11155111";
    process.env.SESSION_SECRET = "test-secret";
    vi.unstubAllGlobals();
  });


  it("covers proof helpers and signing guardrails", async () => {
    expect(normalizeAnswer("  hi ")).toBe("hi");
    expect(typeof normalizeAnswer({ a: 1 })).toBe("string");
    expect(hashAnswer("x", "y")).toMatch(/^0x/);
    expect(buildProofNonce()).toContain("-");

    await expect(
      signCompletionProof({
        respondent: "0x0000000000000000000000000000000000000001",
        surveyId: 1n,
        answerHash: "0x1234",
        rewardAmount: 1n,
        nonce: 1n,
        deadline: 1n
      })
    ).rejects.toThrow("answerHash");
  });

  it("covers quality-gate failure branches and clamping", () => {
    process.env.QUALITY_MIN_COMPLETION_SECONDS = "not-number";
    process.env.QUALITY_MIN_TEXT_LENGTH = "999999";
    process.env.QUALITY_PASSING_SCORE = "70";
    const result = evaluateQualityGate({
      answerJson: "x",
      completionTimeSeconds: 1
    });
    expect(result.passed).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("covers data-store in-memory edge paths", async () => {
    const attempt = await createAttempt({
      surveyId: 1n,
      respondentWallet: "0x0000000000000000000000000000000000000001",
      userAgent: null,
      ipHash: null
    });
    expect(await getAttemptById(attempt.id)).not.toBeNull();
    await markAttemptSubmitted(attempt.id);
    await markAttemptSubmitted("missing");

    const answer = await createAnswer({
      surveyId: 1n,
      respondentWallet: "0x0000000000000000000000000000000000000001",
      attemptId: attempt.id,
      answerJson: { a: 1 },
      normalizedAnswerJson: { a: 1 },
      answerHash: "0x" + "1".repeat(64),
      salt: "s",
      validationScore: 100,
      validationStatus: "passed",
      validationReason: null,
      validationDetails: {},
      completionTimeSeconds: 40,
      rewardAmountWei: "1",
      completionNonce: "1",
      completionDeadline: new Date(),
      completionSignature: "0xabc"
    });

    expect(await getAnswerById(answer.id)).not.toBeNull();
    expect(await getAnswerById("missing")).toBeNull();
    expect(await findSubmittedAnswerBySurveyAndWallet(1n, attempt.respondentWallet)).not.toBeNull();
    expect(await findSubmittedAnswerBySurveyAndWallet(2n, attempt.respondentWallet)).toBeNull();
    expect(await markAnswerOnchainConfirmed("missing", "0x" + "a".repeat(64))).toBe(false);
    expect(await markAnswerOnchainConfirmed(answer.id, "0x" + "a".repeat(64))).toBe(true);
    expect(await updateAnswerProof("missing", "n", new Date(), "s")).toBe(false);
    expect(await updateAnswerProof(answer.id, "n2", new Date(), "s2")).toBe(true);
    expect((await getMyAnswers(attempt.respondentWallet)).length).toBeGreaterThan(0);
  });


  it("covers nonce-store and session negative paths", async () => {
    const rec = await createNonceRecord({
      walletAddress: "0x0000000000000000000000000000000000000001",
      nonce: "n1",
      message: "m1"
    });
    expect(await getNonceRecord(rec.nonce)).not.toBeNull();
    await markNonceAsUsed(rec.nonce);
    const used = await getNonceRecord(rec.nonce);
    expect(used?.usedAt).not.toBeNull();
    expect(await getNonceRecord("missing")).toBeNull();

    const token = createSessionToken("0x0000000000000000000000000000000000000001").token;
    expect(verifySessionToken(token)).not.toBeNull();
    expect(verifySessionToken("bad")).toBeNull();
    expect(verifySessionToken("a.b")).toBeNull();
  });


  it("covers wallet verification fallbacks", async () => {
    process.env.VERIFIED_WALLET_ALLOWLIST = "0x0000000000000000000000000000000000000001";
    expect(await isWalletVerified("not-address")).toBe(false);
    expect(await isWalletVerified("0x0000000000000000000000000000000000000001")).toBe(true);

    process.env.SEPOLIA_RPC_URL = "https://invalid.local";
    process.env.CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000001";
    expect(await isWalletVerified("0x0000000000000000000000000000000000000001")).toBe(false);
  });

  it("covers creator allowlist parsing", () => {
    delete process.env.NEXT_PUBLIC_CREATOR_WALLET_ALLOWLIST;
    delete process.env.CREATOR_WALLET_ALLOWLIST;
    expect(isCreatorWallet("0x0000000000000000000000000000000000000001")).toBe(false);

    process.env.NEXT_PUBLIC_CREATOR_WALLET_ALLOWLIST = "0x0000000000000000000000000000000000000001";
    expect(isCreatorWallet("0x0000000000000000000000000000000000000001")).toBe(true);
    expect(isCreatorWallet("0x0000000000000000000000000000000000000002")).toBe(false);
  });
});
