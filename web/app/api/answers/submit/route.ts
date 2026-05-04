import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAddress } from "ethers";

import {
  createAnswer,
  findSubmittedAnswerBySurveyAndWallet,
  getAttemptById,
  markAttemptSubmitted
} from "@/lib/answers/data-store";
import {
  buildProofNonce,
  hashAnswer,
  normalizeAnswer,
  signCompletionProof
} from "@/lib/answers/proof";
import { evaluateQualityGate } from "@/lib/answers/quality-gate";
import { isAdminWallet } from "@/lib/auth/admin";
import { requireSession } from "@/lib/auth/require-session";
import { isWalletAdminOnChain, isWalletVerified } from "@/lib/blockchain/verification";
import { syncOnChainApproval } from "@/lib/blockchain/sync-verification";

type SubmitRequest = {
  surveyId?: string;
  attemptId?: string;
  rewardAmountWei?: string;
  answer?: unknown;
  completionTimeSeconds?: number;
};

function parseBigInt(value: string | undefined): bigint | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }
  return BigInt(value);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if ("response" in session) {
    return session.response;
  }

  let body: SubmitRequest;
  try {
    body = (await request.json()) as SubmitRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const surveyId = parseBigInt(body.surveyId);
  const rewardAmount = parseBigInt(body.rewardAmountWei);
  if (!surveyId || !rewardAmount || !body.attemptId) {
    return NextResponse.json(
      { error: "surveyId, attemptId, and rewardAmountWei are required." },
      { status: 400 }
    );
  }

  const attempt = await getAttemptById(body.attemptId);
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }
  if (attempt.respondentWallet !== session.walletAddress) {
    return NextResponse.json(
      { error: "Attempt does not belong to current session wallet." },
      { status: 403 }
    );
  }
  if (attempt.surveyId !== surveyId) {
    return NextResponse.json(
      { error: "Attempt survey mismatch." },
      { status: 400 }
    );
  }

  const alreadySubmitted = await findSubmittedAnswerBySurveyAndWallet(
    surveyId,
    session.walletAddress
  );
  if (alreadySubmitted) {
    return NextResponse.json(
      { error: "Duplicate reward-eligible response is not allowed." },
      { status: 409 }
    );
  }

  const isAdmin =
    isAdminWallet(session.walletAddress) ||
    (await isWalletAdminOnChain(session.walletAddress));
  const verified = await isWalletVerified(session.walletAddress);
  if (!isAdmin && !verified) {
    return NextResponse.json(
      { error: "Wallet is not verified for reward surveys." },
      { status: 403 }
    );
  }

  // Auto-sync on-chain verification if user is off-chain verified
  // This ensures the smart contract's verification check will pass
  // when the user submits the proof on-chain
  if (verified || isAdmin) {
    const syncResult = await syncOnChainApproval(session.walletAddress);
    if (!syncResult.ok) {
      console.warn(
        "Auto on-chain verification sync failed for",
        session.walletAddress,
        ":",
        syncResult.reason
      );
    }
  }

  const completionTimeSeconds = Number(body.completionTimeSeconds ?? 0);
  const quality = evaluateQualityGate({
    answerJson: body.answer,
    completionTimeSeconds
  });

  const normalized = normalizeAnswer(body.answer ?? {});
  const salt = randomBytes(16).toString("hex");
  const answerHash = hashAnswer(normalized, salt);

  let completionNonce: string | null = null;
  let completionDeadline: Date | null = null;
  let completionSignature: string | null = null;

  if (quality.passed) {
    completionNonce = buildProofNonce();
    completionDeadline = new Date(Date.now() + 10 * 60 * 1000);
    const nonceNumber = BigInt(
      completionNonce.replace(/\D/g, "").slice(0, 18) || "1"
    );

    try {
      completionSignature = await signCompletionProof({
        respondent: getAddress(session.walletAddress),
        surveyId,
        answerHash,
        rewardAmount,
        nonce: nonceNumber,
        deadline: BigInt(Math.floor(completionDeadline.getTime() / 1000))
      });
      completionNonce = nonceNumber.toString();
    } catch {
      return NextResponse.json(
        { error: "Proof signing configuration is missing." },
        { status: 500 }
      );
    }
  }

  const created = await createAnswer({
    surveyId,
    respondentWallet: session.walletAddress,
    attemptId: attempt.id,
    answerJson: body.answer ?? {},
    normalizedAnswerJson: normalized,
    answerHash,
    salt,
    validationScore: quality.score,
    validationStatus: quality.passed ? "passed" : "failed",
    validationReason: quality.reason,
    validationDetails: quality.details,
    completionTimeSeconds,
    rewardAmountWei: rewardAmount.toString(),
    completionNonce: completionNonce ?? "",
    completionDeadline,
    completionSignature
  });
  await markAttemptSubmitted(attempt.id);

  return NextResponse.json({
    answerId: created.id,
    surveyId: created.surveyId.toString(),
    status: created.status,
    validation: {
      passed: quality.passed,
      score: quality.score,
      reason: quality.reason,
      details: quality.details
    },
    answerHash: created.answerHash,
    salt: created.salt,
    proof: quality.passed
      ? {
          respondent: session.walletAddress,
          surveyId: created.surveyId.toString(),
          answerHash: created.answerHash,
          rewardAmountWei: rewardAmount.toString(),
          nonce: created.completionNonce,
          deadline: Math.floor(
            (created.completionDeadline ?? new Date(0)).getTime() / 1000
          ).toString(),
          signature: created.completionSignature
        }
      : null
  });
}
