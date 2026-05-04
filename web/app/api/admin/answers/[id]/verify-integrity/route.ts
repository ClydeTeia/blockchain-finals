import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { getAnswerById } from "@/lib/answers/data-store";
import { hashAnswer, normalizeAnswer } from "@/lib/answers/proof";
import { getContractAddress } from "@/lib/blockchain/contract";
import { ethers } from "ethers";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if ("response" in session) {
    return session.response;
  }

  try {
    const { id: answerId } = await params;
    const answer = await getAnswerById(answerId);
    
    if (!answer) {
      return NextResponse.json(
        { error: "Answer not found" },
        { status: 404 }
      );
    }

    // Only allow verification for completed or claimed answers
    if (answer.status !== "completed_onchain" && answer.status !== "claimed") {
      return NextResponse.json(
        { error: "Answer must be completed or claimed to verify integrity" },
        { status: 400 }
      );
    }

    // Recompute the answer hash from stored data
    const normalized = normalizeAnswer(answer.normalizedAnswerJson);
    const recomputedHash = hashAnswer(normalized, answer.salt);

    // Get the on-chain answer hash from the contract
    const contractAddress = getContractAddress();
    if (!contractAddress) {
      return NextResponse.json(
        { error: "Contract address not configured" },
        { status: 500 }
      );
    }

    // We need to use a provider that doesn't require a signer for read-only calls
    // Since this is a server route, we can use a default provider (like Infura/Alchemy) or a fallback
    // For simplicity, we'll use a placeholder. In production, you'd use a configured RPC URL.
    const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;
    if (!sepoliaRpcUrl) {
      return NextResponse.json(
        { error: "SEPOLIA_RPC_URL is required for integrity verification" },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(sepoliaRpcUrl);
    const abi = [
      "function responses(uint256, address) view returns (uint256 surveyId, address respondent, bytes32 answerHash, uint8 status, uint256 submittedAt, uint256 rewardAmount)"
    ];
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const [, , onchainAnswerHash] = await contract.responses(
      answer.surveyId,
      answer.respondentWallet
    );

    const isMatch = onchainAnswerHash.toLowerCase() === recomputedHash.toLowerCase();

    return NextResponse.json({
      answerId,
      storedHash: answer.answerHash,
      recomputedHash,
      onchainHash: onchainAnswerHash,
      integrityVerified: isMatch
    });
  } catch (error) {
    console.error("Error verifying answer integrity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
