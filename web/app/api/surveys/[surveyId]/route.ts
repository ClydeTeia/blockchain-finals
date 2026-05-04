import { NextResponse } from "next/server";
import { Contract, JsonRpcProvider } from "ethers";
import { SURVEY_REWARD_ABI, getContractAddress } from "@/lib/blockchain/contract";

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
        options: []
      }
    });
  } catch (error) {
    console.error("Error fetching survey by id:", error);
    return NextResponse.json({ error: "Failed to fetch survey." }, { status: 500 });
  }
}
