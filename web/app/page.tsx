import Link from "next/link";
import SurveyCard from "@/components/SurveyCard";
import { getAllSurveys } from "@/lib/surveys/data-store";
import type { SurveyRecord } from "@/lib/surveys/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;

  let surveys: SurveyRecord[] = [];
  try {
    surveys = await getAllSurveys();
  } catch (error) {
    console.error("Failed to fetch surveys:", error);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Alert Messages */}
      {params.error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {params.error === "login_required" && "Please connect your wallet to continue."}
          {params.error === "survey_not_found" && "Survey not found."}
          {params.error === "survey_closed" && "This survey is closed."}
          {params.error === "admin_required" && "Admin role required to access this page."}
          {!["login_required", "survey_not_found", "survey_closed", "admin_required"].includes(params.error) && params.error}
        </div>
      )}
      {params.success && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Action completed successfully!
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Available Surveys</h2>
        <p className="text-gray-600">
          Complete surveys and earn Sepolia ETH. Connect your wallet to get started.
        </p>
      </div>

      {surveys.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">No surveys available yet.</p>
          <Link href="/surveys/create" className="text-blue-500 hover:underline">
            Create the first survey
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <SurveyCard
              key={survey.id.toString()}
              id={survey.id.toString()}
              title={survey.title}
              description={survey.description}
              question={survey.question}
              rewardPerResponseWei={survey.rewardPerResponse.toString()}
              maxResponses={survey.maxResponses.toString()}
              responseCount={survey.responseCount.toString()}
              active={survey.active}
            />
          ))}
        </div>
      )}
    </div>
  );
}
