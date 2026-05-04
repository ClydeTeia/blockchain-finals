import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, hasDatabaseConfig } from "@/lib/db/client";
import { surveyQualityRules } from "@/lib/db/schema";

const DEFAULT_RULES = {
  minCompletionSeconds: 10,
  requireAttentionCheck: true,
  passingScore: 70
};

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
