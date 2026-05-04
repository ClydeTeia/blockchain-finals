import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";

const REQUIRED_TABLES = [
  "auth_nonces",
  "kyc_requests",
  "survey_attempts",
  "survey_answers",
  "survey_quality_rules",
  "audit_logs"
] as const;

function getProjectRef(url: string | undefined): string | null {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url);
    return parsed.hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await requireAdminSession();
  if ("response" in session) {
    return session.response;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        configured: false,
        error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing."
      },
      { status: 503 }
    );
  }

  const baseUrl = supabaseUrl.replace(/\/+$/, "");
  const projectRef = getProjectRef(baseUrl);

  const checks = await Promise.all(
    REQUIRED_TABLES.map(async (table) => {
      const response = await fetch(
        `${baseUrl}/rest/v1/${table}?select=*&limit=1`,
        {
          method: "GET",
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`
          },
          cache: "no-store"
        }
      );

      const rawBody = await response.text();
      let parsedBody: unknown = null;
      try {
        parsedBody = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        parsedBody = rawBody;
      }

      return {
        table,
        ok: response.ok,
        status: response.status,
        detail: response.ok ? null : parsedBody
      };
    })
  );

  const missingOrBroken = checks.filter((check) => !check.ok);

  return NextResponse.json({
    configured: true,
    projectRef,
    ready: missingOrBroken.length === 0,
    checks
  });
}

