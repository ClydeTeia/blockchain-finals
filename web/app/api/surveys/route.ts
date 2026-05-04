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

    // Get total survey count
    const surveyCount = await contract.surveyCount();

    const surveys = [];
    for (let i = 1; i <= surveyCount; i++) {
      try {
        const survey = await contract.surveys(i);
        // Only include active surveys
        // Note: options are stored in the contract but not exposed by the public getter
        // They would need a separate getter function to be readable
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
            options: [], // Options are stored on-chain but not readable via current getter
          });
        }
      } catch (err) {
        // Skip surveys that can't be read
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
