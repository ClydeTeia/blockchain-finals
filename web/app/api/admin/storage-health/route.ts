import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";

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
  const bucketName = "kyc-documents";

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

  const response = await fetch(`${baseUrl}/storage/v1/bucket`, {
    method: "GET",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    },
    cache: "no-store"
  });

  const rawBody = await response.text();
  let parsedBody: unknown = null;
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    parsedBody = rawBody;
  }

  if (!response.ok) {
    return NextResponse.json(
      {
        configured: true,
        projectRef,
        status: response.status,
        error: "Failed to list storage buckets.",
        detail: parsedBody
      },
      { status: 500 }
    );
  }

  const buckets = Array.isArray(parsedBody)
    ? parsedBody.map((bucket) => {
        const item = bucket as { id?: string; name?: string; public?: boolean };
        return {
          id: item.id ?? null,
          name: item.name ?? null,
          public: item.public ?? null
        };
      })
    : [];

  const hasKycBucket = buckets.some(
    (bucket) => bucket.name === bucketName || bucket.id === bucketName
  );

  return NextResponse.json({
    configured: true,
    projectRef,
    bucketName,
    hasKycBucket,
    buckets
  });
}

