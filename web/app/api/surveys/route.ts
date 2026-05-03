import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { hasRoleOnContract } from "@/lib/blockchain/roles";
import { createSurvey } from "@/lib/surveys/data-store";
import { ethers } from "ethers";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if ("response" in session) {
      return session.response;
    }

    const walletAddress = session.walletAddress;

    // Check if user has creator role (or admin role)
    const isCreator = await hasRoleOnContract(walletAddress, "CREATOR_ROLE");
    const isAdmin = await hasRoleOnContract(walletAddress, "ADMIN_ROLE");

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "Creator or admin role required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, question, options, rewardPerResponseWei, maxResponses } = body;

    // Basic validation
    if (typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (typeof description !== "string" || description.length > 1000) {
      return NextResponse.json({ error: "Description is too long." }, { status: 400 });
    }
    if (typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }
    if (!Array.isArray(options) || options.length < 2 || options.length > 10) {
      return NextResponse.json({ error: "At least 2 and at most 10 options required." }, { status: 400 });
    }
    if (!Array.isArray(options) || !options.every((opt: unknown) => typeof opt === "string" && opt.trim().length > 0)) {
      return NextResponse.json({ error: "Options must be non-empty strings." }, { status: 400 });
    }

    let rewardWei: bigint;
    try {
      rewardWei = ethers.parseEther(rewardPerResponseWei?.toString() ?? "0");
    } catch {
      return NextResponse.json({ error: "Invalid reward amount." }, { status: 400 });
    }
    if (rewardWei <= 0n) {
      return NextResponse.json({ error: "Reward must be > 0 ETH." }, { status: 400 });
    }

    const maxResp = Number(maxResponses);
    if (!Number.isInteger(maxResp) || maxResp <= 0) {
      return NextResponse.json({ error: "Max responses must be a positive integer." }, { status: 400 });
    }

    const totalEscrow = rewardWei * BigInt(maxResp);

    // In Phase 1, return contract call parameters to frontend
    // The frontend will call the contract directly with MetaMask
    return NextResponse.json({
      ok: true,
      contractCall: {
        functionName: "createSurvey",
        params: {
          title: title.trim(),
          description: description.trim(),
          question: question.trim(),
          options: options.map((o: string) => o.trim()),
          rewardPerResponse: rewardWei.toString(),
          maxResponses: maxResp.toString()
        },
        value: totalEscrow.toString()
      }
    });
  } catch (err) {
    console.error("Error creating survey:", err);
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create survey." },
      { status: 500 }
    );
  }
}
