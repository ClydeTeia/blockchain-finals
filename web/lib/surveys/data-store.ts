import { randomUUID } from "node:crypto";
import { Contract, JsonRpcProvider, parseEther } from "ethers";

import {
  hasSupabaseRestConfig,
  supabaseInsert,
  supabaseSelect,
  supabasePatch
} from "@/lib/storage/supabase-rest";
import type { SurveyRecord, CreateSurveyInput } from "./types";

const surveys = new Map<string, SurveyRecord>();

// Contract ABI for read functions
const SURVEY_ABI = [
  "function surveyCount() view returns (uint256)",
  "function surveys(uint256) view returns (title string, description string, question string, options string[], rewardPerResponse uint256, maxResponses uint256, responseCount uint256, escrowRemaining uint256, active bool, creator address)"
];

async function getContract() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!rpcUrl || !contractAddress) {
    throw new Error("RPC URL or contract address not configured");
  }
  const provider = new JsonRpcProvider(rpcUrl);
  return new Contract(contractAddress, SURVEY_ABI, provider);
}

async function readSurveyFromChain(id: bigint): Promise<SurveyRecord | null> {
  try {
    const contract = await getContract();
    const result = await contract.surveys(id);
    // result is a tuple: [title, description, question, options, rewardPerResponse, maxResponses, responseCount, escrowRemaining, active, creator]
    const [
      title,
      description,
      question,
      options,
      rewardPerResponse,
      maxResponses,
      responseCount,
      escrowRemaining,
      active,
      creator
    ] = result as [
      string,
      string,
      string,
      string[],
      bigint,
      bigint,
      bigint,
      bigint,
      boolean,
      string
    ];

    // We don't have createdAt from contract, use current time as approximation
    return {
      id,
      creator,
      title,
      description,
      question,
      options,
      rewardPerResponse,
      maxResponses,
      responseCount,
      escrowRemaining,
      active,
      createdAt: new Date()
    };
  } catch (error) {
    console.error("Error reading survey from chain:", error);
    return null;
  }
}

async function fetchAllSurveysFromChain(): Promise<SurveyRecord[]> {
  try {
    const contract = await getContract();
    const count = await contract.surveyCount();
    const surveysArray: SurveyRecord[] = [];

    for (let i = 1n; i <= count; i++) {
      const survey = await readSurveyFromChain(i);
      if (survey) {
        surveysArray.push(survey);
      }
    }

    return surveysArray;
  } catch (error) {
    console.error("Error fetching all surveys from chain:", error);
    return [];
  }
}

function toWei(eth: string): bigint {
  return BigInt(Math.floor(parseFloat(eth) * 1e18));
}

export async function createSurvey(
  input: CreateSurveyInput & { creator: string }
): Promise<SurveyRecord> {
  const now = new Date();
  const rewardWei = toWei(input.rewardPerResponseWei);
  const totalEscrow = rewardWei * BigInt(input.maxResponses);

  const record: SurveyRecord = {
    id: BigInt(surveys.size + 1), // placeholder
    creator: input.creator,
    title: input.title,
    description: input.description,
    question: input.question,
    options: input.options,
    rewardPerResponse: rewardWei,
    maxResponses: BigInt(input.maxResponses),
    responseCount: 0n,
    escrowRemaining: totalEscrow,
    active: true,
    createdAt: now
  };

  if (hasSupabaseRestConfig()) {
    const inserted = await supabaseInsert("surveys", {
      id: record.id.toString(),
      creator: record.creator,
      title: record.title,
      description: record.description,
      question: record.question,
      options: record.options,
      reward_per_response: record.rewardPerResponse.toString(),
      max_responses: record.maxResponses.toString(),
      response_count: record.responseCount.toString(),
      escrow_remaining: record.escrowRemaining.toString(),
      active: record.active,
      created_at: record.createdAt.toISOString()
    });

    if (!inserted) {
      surveys.set(record.id.toString(), record);
    }
  } else {
    surveys.set(record.id.toString(), record);
  }

  return record;
}

export async function getAllSurveys(): Promise<SurveyRecord[]> {
  // Try to read from blockchain first if RPC configured
  if (process.env.SEPOLIA_RPC_URL && process.env.CONTRACT_ADDRESS) {
    const chainSurveys = await fetchAllSurveysFromChain();
    if (chainSurveys.length > 0) {
      return chainSurveys;
    }
  }

  // Fallback to Supabase if configured
  if (hasSupabaseRestConfig()) {
    const rows = await supabaseSelect<{
      id: string;
      creator: string;
      title: string;
      description: string;
      question: string;
      options: string[];
      reward_per_response: string;
      max_responses: string;
      response_count: string;
      escrow_remaining: string;
      active: boolean;
      created_at: string;
    }>(
      `surveys?select=*&order=created_at.desc`
    );

    if (!rows) return [];

    return rows.map((row) => ({
      id: BigInt(row.id),
      creator: row.creator,
      title: row.title,
      description: row.description,
      question: row.question,
      options: row.options,
      rewardPerResponse: BigInt(row.reward_per_response),
      maxResponses: BigInt(row.max_responses),
      responseCount: BigInt(row.response_count),
      escrowRemaining: BigInt(row.escrow_remaining),
      active: row.active,
      createdAt: new Date(row.created_at)
    }));
  }

  // In-memory fallback
  return [...surveys.values()].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function getSurveyById(
  id: string
): Promise<SurveyRecord | null> {
  const bigintId = BigInt(id);

  // Try blockchain first
  if (process.env.SEPOLIA_RPC_URL && process.env.CONTRACT_ADDRESS) {
    const chainSurvey = await readSurveyFromChain(bigintId);
    if (chainSurvey) {
      return chainSurvey;
    }
  }

  // Fallback Supabase
  if (hasSupabaseRestConfig()) {
    const rows = await supabaseSelect<{
      id: string;
      creator: string;
      title: string;
      description: string;
      question: string;
      options: string[];
      reward_per_response: string;
      max_responses: string;
      response_count: string;
      escrow_remaining: string;
      active: boolean;
      created_at: string;
    }>(
      `surveys?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
    );
    const row = rows?.[0];
    if (!row) return null;

    return {
      id: BigInt(row.id),
      creator: row.creator,
      title: row.title,
      description: row.description,
      question: row.question,
      options: row.options,
      rewardPerResponse: BigInt(row.reward_per_response),
      maxResponses: BigInt(row.max_responses),
      responseCount: BigInt(row.response_count),
      escrowRemaining: BigInt(row.escrow_remaining),
      active: row.active,
      createdAt: new Date(row.created_at)
    };
  }

  return surveys.get(id) ?? null;
}

export async function updateSurveyResponseCount(
  surveyId: bigint,
  increment: bigint = 1n
): Promise<void> {
  // This is called when a response is successfully submitted
  // Since the contract updates responseCount automatically, we may not need this
  // But we keep it for consistency if using DB mirroring
  if (hasSupabaseRestConfig()) {
    await supabasePatch(
      `surveys?id=eq.${surveyId.toString()}`,
      {
        response_count: `response_count + ${increment.toString()}`
      }
    );
    return;
  }

  const survey = surveys.get(surveyId.toString());
  if (survey) {
    survey.responseCount += increment;
    surveys.set(surveyId.toString(), survey);
  }
}

export async function closeSurvey(surveyId: bigint): Promise<void> {
  if (hasSupabaseRestConfig()) {
    await supabasePatch(
      `surveys?id=eq.${surveyId.toString()}`,
      { active: false }
    );
    return;
  }

  const survey = surveys.get(surveyId.toString());
  if (survey) {
    survey.active = false;
    surveys.set(surveyId.toString(), survey);
  }
}

export async function getUserCreatedSurveys(
  walletAddress: string
): Promise<SurveyRecord[]> {
  if (hasSupabaseRestConfig()) {
    const rows = await supabaseSelect<{
      id: string;
      creator: string;
      title: string;
      description: string;
      question: string;
      options: string[];
      reward_per_response: string;
      max_responses: string;
      response_count: string;
      escrow_remaining: string;
      active: boolean;
      created_at: string;
    }>(
      `surveys?select=*&creator=eq.${encodeURIComponent(
        walletAddress
      )}&order=created_at.desc`
    );

    if (!rows) return [];

    return rows.map((row) => ({
      id: BigInt(row.id),
      creator: row.creator,
      title: row.title,
      description: row.description,
      question: row.question,
      options: row.options,
      rewardPerResponse: BigInt(row.reward_per_response),
      maxResponses: BigInt(row.max_responses),
      responseCount: BigInt(row.response_count),
      escrowRemaining: BigInt(row.escrow_remaining),
      active: row.active,
      createdAt: new Date(row.created_at)
    }));
  }

  return [...surveys.values()]
    .filter((s) => s.creator.toLowerCase() === walletAddress.toLowerCase())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function resetSurveyStoreForTests(): void {
  surveys.clear();
}
