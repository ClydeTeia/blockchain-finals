import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAllAnswers } from "@/lib/answers/data-store";

export async function GET() {
  const session = await requireAdminSession();
  if ("response" in session) {
    return session.response;
  }

  try {
    const answers = await getAllAnswers();
    return NextResponse.json({ answers });
  } catch (error) {
    console.error("Error fetching answers for admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
