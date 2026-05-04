import { NextResponse } from "next/server";
import { Contract, JsonRpcProvider, Wallet } from "ethers";

import { logAuditEvent } from "@/lib/audit/log";
import { requireAdminSession } from "@/lib/auth/admin";
import { getContractAddress } from "@/lib/blockchain/contract";
import { decideKycRequest, getKycRequestById } from "@/lib/kyc/data-store";

type DecisionBody = {
  reason?: string;
};

async function syncOnChainVerification(walletAddress: string): Promise<{ ok: boolean; txHash?: string; reason?: string }> {
  const rpcUrl = process.env.SEPOLIA_RPC_URL ?? process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
  const contractAddress = getContractAddress();
  const verifierKey = process.env.VERIFIER_PRIVATE_KEY ?? process.env.VALIDATOR_PRIVATE_KEY;
  if (!rpcUrl || !contractAddress || !verifierKey) {
    return { ok: false, reason: "Missing RPC, contract address, or verifier key." };
  }

  try {
    const signer = new Wallet(verifierKey, new JsonRpcProvider(rpcUrl));
    const contract = new Contract(
      contractAddress,
      ["function approveVerification(address wallet)"],
      signer
    );
    const tx = await contract.approveVerification(walletAddress);
    await tx.wait();
    return { ok: true, txHash: tx.hash as string };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown on-chain sync failure.";
    return { ok: false, reason: message };
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if ("response" in session) {
    return session.response;
  }

  const { id } = await params;
  const existing = await getKycRequestById(id);
  if (!existing) {
    return NextResponse.json({ error: "KYC request not found." }, { status: 404 });
  }

  if (existing.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending KYC requests can be approved." },
      { status: 400 }
    );
  }

  let body: DecisionBody = {};
  try {
    body = (await request.json()) as DecisionBody;
  } catch {
    body = {};
  }

  const updated = await decideKycRequest({
    id,
    status: "approved",
    reviewerWallet: session.walletAddress,
    decisionReason: body.reason ?? null
  });

  if (!updated) {
    return NextResponse.json({ error: "Failed to update KYC request." }, { status: 500 });
  }

  const chainSync = await syncOnChainVerification(updated.walletAddress);

  await logAuditEvent({
    actorWallet: session.walletAddress,
    action: "kyc_approve",
    entityType: "kyc_request",
    entityId: id,
    details: {
      walletAddress: updated.walletAddress,
      proofHash: updated.proofHash,
      decisionReason: updated.decisionReason,
      onChainApproved: chainSync.ok,
      onChainTxHash: chainSync.txHash ?? null,
      onChainReason: chainSync.reason ?? null
    }
  });

  return NextResponse.json({
    requestId: updated.id,
    walletAddress: updated.walletAddress,
    status: updated.status,
    reviewedAt: updated.reviewedAt?.toISOString() ?? null,
    reviewerWallet: updated.reviewerWallet,
    decisionReason: updated.decisionReason,
    proofHash: updated.proofHash,
    onChain: {
      approved: chainSync.ok,
      txHash: chainSync.txHash ?? null,
      reason: chainSync.reason ?? null
    },
    note: chainSync.ok
      ? "KYC approved off-chain and synchronized on-chain."
      : "KYC approved off-chain. On-chain approval failed or is not configured."
  });
}
