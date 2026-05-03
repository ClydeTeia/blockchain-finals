import { NextResponse } from "next/server";

import { getSurveyById } from "@/lib/surveys/data-store";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ error: "Invalid survey ID." }, { status: 400 });
    }

    const survey = await getSurveyById(id);

    if (!survey) {
      return NextResponse.json({ error: "Survey not found." }, { status: 404 });
    }

    return NextResponse.json({
      survey: {
        id: survey.id.toString(),
        creator: survey.creator,
        title: survey.title,
        description: survey.description,
        question: survey.question,
        options: survey.options,
        rewardPerResponse: survey.rewardPerResponse.toString(),
        maxResponses: survey.maxResponses.toString(),
        responseCount: survey.responseCount.toString(),
        escrowRemaining: survey.escrowRemaining.toString(),
        active: survey.active,
        createdAt: survey.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error("Error fetching survey:", error);
    return NextResponse.json(
      { error: "Failed to fetch survey." },
      { status: 500 }
    );
  }
}
