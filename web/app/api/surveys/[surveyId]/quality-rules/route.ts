import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { Contract, JsonRpcProvider } from "ethers";
import { isAdminWallet } from "@/lib/auth/admin";
import { getDb, hasDatabaseConfig } from "@/lib/db/client";
import { getContractAddress, SURVEY_REWARD_ABI } from "@/lib/blockchain/contract";
import { isWalletAdminOnChain } from "@/lib/blockchain/verification";
import { surveyQualityRules } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/require-session";

const DEFAULT_RULES = {
  minCompletionSeconds: 10,
  requireAttentionCheck: true,
  passingScore: 70
};

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

  if (!hasDatabaseConfig()) {
    return NextResponse.json({ surveyId, rules: DEFAULT_RULES, source: "default" });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ surveyId, rules: DEFAULT_RULES, source: "default" });
  }

  const rows = await db
    .select()
    .from(surveyQualityRules)
    .where(eq(surveyQualityRules.surveyId, surveyId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return NextResponse.json({ surveyId, rules: DEFAULT_RULES, source: "default" });
  }

  return NextResponse.json({
    surveyId,
    rules: row.rulesJson ?? DEFAULT_RULES,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    source: "drizzle"
  });
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

  const provider = new JsonRpcProvider(rpcUrl);
  const contract = new Contract(contractAddress, SURVEY_REWARD_ABI, provider);
  const survey = await contract.surveys(surveyId);

  if (!survey || survey.creator === "0x0000000000000000000000000000000000000000") {
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  const isAdmin =
    isAdminWallet(session.walletAddress) ||
    (await isWalletAdminOnChain(session.walletAddress));
  const isCreator =
    String(survey.creator).toLowerCase() === session.walletAddress.toLowerCase();

  if (!isAdmin && !isCreator) {
    return NextResponse.json(
      { error: "Only the survey creator or admin can update quality rules." },
      { status: 403 }
    );
  }

  if (!hasDatabaseConfig()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database is not available." }, { status: 500 });
  }

  let body: { rules?: unknown; version?: number };
  try {
    body = (await request.json()) as { rules?: unknown; version?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.rules) || body.rules.length === 0) {
    return NextResponse.json({ error: "rules must be a non-empty array." }, { status: 400 });
  }

  const version = Number.isInteger(body.version) && (body.version ?? 0) > 0 ? body.version! : 1;
  const now = new Date();

  const existing = await db
    .select({ id: surveyQualityRules.id })
    .from(surveyQualityRules)
    .where(eq(surveyQualityRules.surveyId, surveyId))
    .limit(1);

  if (existing[0]?.id) {
    await db
      .update(surveyQualityRules)
      .set({
        rulesJson: body.rules,
        version,
        updatedAt: now
      })
      .where(eq(surveyQualityRules.id, existing[0].id));
  } else {
    await db.insert(surveyQualityRules).values({
      id: crypto.randomUUID(),
      surveyId,
      rulesJson: body.rules,
      version,
      createdAt: now,
      updatedAt: now
    });
  }

  return NextResponse.json({ ok: true, surveyId, version });
}
