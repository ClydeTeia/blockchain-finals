import { NextResponse } from "next/server";
import { Contract, JsonRpcProvider } from "ethers";
import { SURVEY_REWARD_ABI } from "@/lib/blockchain/contract";
import { getContractAddress } from "@/lib/blockchain/contract";

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

    return NextResponse.json({ surveys });
  } catch (error) {
    console.error("Error fetching surveys:", error);
    return NextResponse.json(
      { error: "Failed to fetch surveys." },
      { status: 500 }
    );
  }
}
