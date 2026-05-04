import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { Contract, JsonRpcProvider } from "ethers";
import { SURVEY_REWARD_ABI, getContractAddress } from "@/lib/blockchain/contract";
import { getDb, hasDatabaseConfig } from "@/lib/db/client";
import { surveyQuestionSets } from "@/lib/db/schema";
import { sanitizeSurveyQuestions, type SurveyQuestion } from "@/lib/surveys/questions";

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ surveyId: string }> }
) {
  const { surveyId: surveyIdRaw } = await context.params;
  const surveyId = Number(surveyIdRaw);
  if (!Number.isInteger(surveyId) || surveyId <= 0) {
    return NextResponse.json({ error: "Invalid survey id." }, { status: 400 });
  }

  const contractAddress = getContractAddress();
  if (!contractAddress) {
    return NextResponse.json({ error: "Contract address not configured." }, { status: 500 });
  }

  const rpcUrl = getRpcUrl();
  if (!rpcUrl) {
    return NextResponse.json({ error: "RPC URL not configured." }, { status: 500 });
  }

  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(contractAddress, SURVEY_REWARD_ABI, provider);
    const survey = await contract.surveys(surveyId);

    if (!survey || survey.creator === "0x0000000000000000000000000000000000000000") {
      return NextResponse.json({ error: "Survey not found." }, { status: 404 });
    }

    let questions: SurveyQuestion[] = [
      {
        id: "q_1",
        prompt: survey.question,
        type: "text",
        required: true
      }
    ];
    let questionSetPersisted = false;

    if (hasDatabaseConfig()) {
      const db = getDb();
      if (db) {
        try {
          const row = (
            await db
              .select({ questionsJson: surveyQuestionSets.questionsJson })
              .from(surveyQuestionSets)
              .where(eq(surveyQuestionSets.surveyId, surveyId))
              .limit(1)
          )[0];
          const parsed = sanitizeSurveyQuestions(row?.questionsJson);
          if (parsed.length > 0) {
            questions = parsed;
            questionSetPersisted = true;
          }
        } catch (error) {
          if (isMissingQuestionSetTableError(error)) {
            console.warn(`Question set table unavailable for survey ${surveyId}; falling back to on-chain question only.`);
          } else {
            console.warn(`Failed loading question set for survey ${surveyId}; falling back to on-chain question only.`, error);
          }
        }
      }
    }

    return NextResponse.json({
      survey: {
        id: surveyId,
        creator: survey.creator,
        title: survey.title,
        description: survey.description,
        question: survey.question,
        rewardPerResponse: survey.rewardPerResponse.toString(),
        maxResponses: survey.maxResponses.toString(),
        responseCount: survey.responseCount.toString(),
        escrowRemaining: survey.escrowRemaining.toString(),
        active: survey.active,
        unusedRewardsWithdrawn: survey.unusedRewardsWithdrawn,
        options: [],
        questions,
        questionSetPersisted
      }
    });
  } catch (error) {
    console.error("Error fetching survey by id:", error);
    return NextResponse.json({ error: "Failed to fetch survey." }, { status: 500 });
  }
}
