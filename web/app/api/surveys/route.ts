import { NextResponse } from "next/server";
import { inArray, sql } from "drizzle-orm";
import { Contract, JsonRpcProvider } from "ethers";
import { SURVEY_REWARD_ABI } from "@/lib/blockchain/contract";
import { getContractAddress } from "@/lib/blockchain/contract";
import { getDb, hasDatabaseConfig } from "@/lib/db/client";
import { surveyQuestionSets, surveyAnswers } from "@/lib/db/schema";
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

export async function GET(request: Request) {
  try {
    const contractAddress = getContractAddress();

    if (!contractAddress) {
      return NextResponse.json(
        { error: "Contract address not configured." },
        { status: 500 }
      );
    }

    const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL;
    if (!rpcUrl) {
      return NextResponse.json(
        { error: "RPC URL not configured." },
        { status: 500 }
      );
    }

    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(contractAddress, SURVEY_REWARD_ABI, provider);

    const surveyCount = Number(await contract.surveyCount());
    if (!Number.isFinite(surveyCount) || surveyCount < 0) {
      return NextResponse.json(
        { error: "Invalid survey count returned by contract." },
        { status: 500 }
      );
    }

    const surveys = [];
    for (let i = 1; i <= surveyCount; i += 1) {
      try {
        const survey = await contract.surveys(i);
        if (survey.active) {
          surveys.push({
            id: i,
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
          });
        }
      } catch (err) {
        console.warn(`Could not read survey ${i}:`, err);
      }
    }

    let questionSetBySurveyId = new Map<number, unknown>();
    let offChainCountBySurveyId = new Map<number, number>();
    let pendingOnChainBySurveyId = new Map<number, number>();
    if (hasDatabaseConfig()) {
      const db = getDb();
      if (db && surveys.length > 0) {
        try {
          const surveyIds = surveys.map((survey) => survey.id);
          const rows = await db
            .select({
              surveyId: surveyQuestionSets.surveyId,
              questionsJson: surveyQuestionSets.questionsJson
            })
            .from(surveyQuestionSets)
            .where(inArray(surveyQuestionSets.surveyId, surveyIds));
          questionSetBySurveyId = new Map(rows.map((row) => [row.surveyId, row.questionsJson]));
        } catch (error) {
          if (isMissingQuestionSetTableError(error)) {
            console.warn("Question set table unavailable; falling back to on-chain question only.");
          } else {
            console.warn("Failed loading question sets; falling back to on-chain question only.", error);
          }
        }

        // Count off-chain answers (all statuses) and pending on-chain answers per survey
        try {
          const surveyIds = surveys.map((survey) => survey.id);
          const answerCountRows = await db
            .select({
              surveyId: surveyAnswers.surveyId,
              count: sql<number>`count(*)::int`,
            })
            .from(surveyAnswers)
            .where(inArray(surveyAnswers.surveyId, surveyIds))
            .groupBy(surveyAnswers.surveyId);
          offChainCountBySurveyId = new Map(answerCountRows.map((row) => [row.surveyId, row.count]));

          // Count only pending_onchain status
          const pendingOnChainRows = await db
            .select({
              surveyId: surveyAnswers.surveyId,
              count: sql<number>`count(*)::int`,
            })
            .from(surveyAnswers)
            .where(
              sql`${surveyAnswers.surveyId} = ANY(${surveyIds}) AND ${surveyAnswers.status} = 'pending_onchain'`
            )
            .groupBy(surveyAnswers.surveyId);
          pendingOnChainBySurveyId = new Map(pendingOnChainRows.map((row) => [row.surveyId, row.count]));
        } catch (error) {
          console.warn("Failed loading off-chain answer counts.", error);
        }
      }
    }

    return NextResponse.json({
      surveys: surveys.map((survey) => {
        const questionSet = sanitizeSurveyQuestions(questionSetBySurveyId.get(survey.id));
        const fallback = [
          {
            id: "q_1",
            prompt: survey.question,
            type: survey.options.length >= 2 ? "multiple_choice" : "text",
            required: true,
            options: survey.options.length >= 2 ? survey.options : undefined
          }
        ];
        return {
          ...survey,
          offChainResponseCount: (offChainCountBySurveyId.get(survey.id) ?? 0).toString(),
          pendingOnChainCount: (pendingOnChainBySurveyId.get(survey.id) ?? 0).toString(),
          questions: questionSet.length > 0 ? questionSet : fallback,
          questionSetPersisted: questionSet.length > 0
        };
      })
    });
  } catch (error) {
    console.error("Error fetching surveys:", error);
    return NextResponse.json(
      { error: "Failed to fetch surveys." },
      { status: 500 }
    );
  }
}
