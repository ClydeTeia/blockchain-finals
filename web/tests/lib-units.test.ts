import {
  supabaseInsert,
  supabasePatch,
  supabaseSelect
} from "@/lib/storage/supabase-rest";
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

  it("covers supabase-rest missing config and success/failure responses", async () => {
    expect(await supabaseInsert("t", { a: 1 })).toBe(false);
    expect(await supabaseSelect("t")).toBeNull();
    expect(await supabasePatch("t", { a: 1 })).toBe(false);

    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "key";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 1 }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await supabaseInsert("tbl", { a: 1 })).toBe(true);
    expect(await supabaseSelect<{ id: number }>("tbl?select=id")).toEqual([{ id: 1 }]);
    expect(await supabasePatch("tbl?id=eq.1", { a: 2 })).toBe(false);
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

  it("covers data-store Supabase path branches", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "key";

    const fetchMock = vi.fn()
      // createAttempt insert
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      // getAttemptById select
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: "att-1",
              survey_id: "1",
              respondent_wallet: "0x0000000000000000000000000000000000000001",
              status: "started",
              started_at: new Date().toISOString(),
              submitted_at: null,
              user_agent: null,
              ip_hash: null,
              created_at: new Date().toISOString()
            }
          ]),
          { status: 200 }
        )
      )
      // markAttemptSubmitted patch
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      // createAnswer insert
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      // getAnswerById select
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: "ans-1",
              attempt_id: "att-1",
              survey_id: "1",
              respondent_wallet: "0x0000000000000000000000000000000000000001",
              answer_json: { a: 1 },
              normalized_answer_json: { a: 1 },
              answer_hash: "0x" + "1".repeat(64),
              salt: "s",
              status: "pending_onchain",
              validation_score: 100,
              validation_status: "passed",
              validation_reason: null,
              validation_details: {},
              started_at: new Date().toISOString(),
              submitted_at: new Date().toISOString(),
              completion_time_seconds: 12,
              reward_amount_wei: "1",
              completion_nonce: "1",
              completion_deadline: new Date().toISOString(),
              completion_signature: "0xabc",
              onchain_tx_hash: null,
              onchain_confirmed_at: null,
              flagged: false,
              audit_notes: null,
              created_at: new Date().toISOString()
            }
          ]),
          { status: 200 }
        )
      )
      // findSubmittedAnswerBySurveyAndWallet select
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      // markAnswerOnchainConfirmed patch
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      // updateAnswerProof patch
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      // getMyAnswers select
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

    vi.stubGlobal("fetch", fetchMock);

    const attempt = await createAttempt({
      surveyId: 1n,
      respondentWallet: "0x0000000000000000000000000000000000000001",
      userAgent: null,
      ipHash: null
    });
    expect(attempt.id).toBeTruthy();
    expect(await getAttemptById("att-1")).not.toBeNull();
    await markAttemptSubmitted("att-1");

    await createAnswer({
      surveyId: 1n,
      respondentWallet: "0x0000000000000000000000000000000000000001",
      attemptId: "att-1",
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
    expect(await getAnswerById("ans-1")).not.toBeNull();
    expect(await findSubmittedAnswerBySurveyAndWallet(1n, "0x0000000000000000000000000000000000000001")).toBeNull();
    expect(await markAnswerOnchainConfirmed("ans-1", "0x" + "a".repeat(64))).toBe(true);
    expect(await updateAnswerProof("ans-1", "2", new Date(), "sig")).toBe(true);
    expect(await getMyAnswers("0x0000000000000000000000000000000000000001")).toEqual([]);
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

  it("covers nonce-store Supabase path branches", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "key";

    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    const fetchMock = vi.fn()
      // createNonceRecord insert
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      // getNonceRecord select
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              wallet_address: "0x0000000000000000000000000000000000000001",
              nonce: "n2",
              message: "m2",
              expires_at: expiresAt,
              used_at: null,
              created_at: new Date().toISOString()
            }
          ]),
          { status: 200 }
        )
      )
      // markNonceAsUsed patch
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      // getNonceRecord expired select
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              wallet_address: "0x0000000000000000000000000000000000000001",
              nonce: "n3",
              message: "m3",
              expires_at: new Date(Date.now() - 60_000).toISOString(),
              used_at: null,
              created_at: new Date().toISOString()
            }
          ]),
          { status: 200 }
        )
      );

    vi.stubGlobal("fetch", fetchMock);

    await createNonceRecord({
      walletAddress: "0x0000000000000000000000000000000000000001",
      nonce: "n2",
      message: "m2"
    });
    expect(await getNonceRecord("n2")).not.toBeNull();
    await markNonceAsUsed("n2");
    expect(await getNonceRecord("n3")).toBeNull();
  });

  it("covers wallet verification fallbacks", async () => {
    process.env.VERIFIED_WALLET_ALLOWLIST = "0x0000000000000000000000000000000000000001";
    expect(await isWalletVerified("not-address")).toBe(false);
    expect(await isWalletVerified("0x0000000000000000000000000000000000000001")).toBe(true);

    process.env.SEPOLIA_RPC_URL = "https://invalid.local";
    process.env.CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000001";
    expect(await isWalletVerified("0x0000000000000000000000000000000000000001")).toBe(false);
  });
});
