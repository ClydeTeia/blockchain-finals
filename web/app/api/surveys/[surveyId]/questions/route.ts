import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { Contract, JsonRpcProvider } from "ethers";
import { requireSession } from "@/lib/auth/require-session";
import { getDb, hasDatabaseConfig } from "@/lib/db/client";
import { surveyQuestionSets } from "@/lib/db/schema";
import { getContractAddress, SURVEY_REWARD_ABI } from "@/lib/blockchain/contract";
import { sanitizeSurveyQuestions } from "@/lib/surveys/questions";

function isMissingQuestionSetTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const cause = "cause" in error ? (error as { cause?: unknown }).cause : undefined;
  if (!cause || typeof cause !== "object") {
    return false;
  }
  return "code" in cause && (cause as { code?: unknown }).code === "42P01";
}

function getRpcUrl(): string | null {
  return process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? process.env.SEPOLIA_RPC_URL ?? null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ surveyId: string }> }
) {
  const session = await requireSession();
  if ("response" in session) {
    return session.response;
  }

  const { surveyId: surveyIdRaw } = await context.params;
  const surveyId = Number(surveyIdRaw);
  if (!Number.isInteger(surveyId) || surveyId <= 0) {
    return NextResponse.json({ error: "Invalid survey id." }, { status: 400 });
  }

  const contractAddress = getContractAddress();
  const rpcUrl = getRpcUrl();
  if (!contractAddress || !rpcUrl) {
    return NextResponse.json({ error: "Blockchain configuration is missing." }, { status: 500 });
  }

  let body: { questions?: unknown };
  try {
    body = (await request.json()) as { questions?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const questions = sanitizeSurveyQuestions(body.questions);
  if (questions.length === 0) {
    return NextResponse.json({ error: "At least one valid question is required." }, { status: 400 });
  }

  if (!hasDatabaseConfig()) {
    return NextResponse.json({
      ok: true,
      surveyId,
      questionsCount: questions.length,
      persisted: false,
      warning: "Database is not configured; question set was not persisted."
    });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({
      ok: true,
      surveyId,
      questionsCount: questions.length,
      persisted: false,
      warning: "Database is not available; question set was not persisted."
    });
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const contract = new Contract(contractAddress, SURVEY_REWARD_ABI, provider);
  const survey = await contract.surveys(surveyId);

  if (!survey || survey.creator === "0x0000000000000000000000000000000000000000") {
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  const surveyCreator = String(survey.creator).toLowerCase();
  if (surveyCreator !== session.walletAddress.toLowerCase()) {
    return NextResponse.json(
      { error: "Only the survey creator can set question content." },
      { status: 403 }
    );
  }

  try {
    const existing = await db
      .select({ id: surveyQuestionSets.id })
      .from(surveyQuestionSets)
      .where(eq(surveyQuestionSets.surveyId, surveyId))
      .limit(1);

    const now = new Date();
    if (existing[0]?.id) {
      await db
        .update(surveyQuestionSets)
        .set({
          questionsJson: questions,
          version: 1,
          updatedAt: now
        })
        .where(and(eq(surveyQuestionSets.id, existing[0].id), eq(surveyQuestionSets.surveyId, surveyId)));
    } else {
      await db.insert(surveyQuestionSets).values({
        id: crypto.randomUUID(),
        surveyId,
        questionsJson: questions,
        version: 1,
        createdAt: now,
        updatedAt: now
      });
    }
  } catch (error) {
    if (isMissingQuestionSetTableError(error)) {
      console.warn(`Question set table unavailable for survey ${surveyId}; skipping persistence.`);
    } else {
      console.warn(`Failed persisting question set for survey ${surveyId}; skipping persistence.`, error);
    }
    return NextResponse.json({
      ok: true,
      surveyId,
      questionsCount: questions.length,
      persisted: false,
      warning: "Question set table is unavailable; question set was not persisted."
    });
  }

  return NextResponse.json({ ok: true, surveyId, questionsCount: questions.length, persisted: true });
}
