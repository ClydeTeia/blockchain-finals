import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { getSurveyById } from "@/lib/surveys/data-store";
import AnswerSurveyForm from "@/components/AnswerSurveyForm";
import { ethers } from "ethers";

export const dynamic = "force-dynamic";

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Require authentication
  const session = await requireSession();
  if ("response" in session) {
    redirect("/?error=login_required");
  }

  const survey = await getSurveyById(id);
  if (!survey) {
    redirect("/?error=survey_not_found");
  }

  if (!survey.active) {
    redirect("/?error=survey_closed");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">{survey.title}</h1>
          <p className="text-gray-600 mb-4">{survey.description}</p>

          <div className="grid grid-cols-3 gap-4 py-4 border-t border-b text-sm">
            <div>
              <span className="text-gray-500">Reward</span>
              <p className="font-semibold text-green-600">
                {(Number(survey.rewardPerResponse) / 1e18).toFixed(6)} ETH
              </p>
            </div>
            <div>
              <span className="text-gray-500">Spots Left</span>
              <p className="font-semibold">
                {Number(survey.maxResponses) - Number(survey.responseCount)} / {survey.maxResponses}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Status</span>
              <p className="font-semibold text-blue-600">
                {survey.active ? "Active" : "Closed"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Answer Survey</h2>
          <AnswerSurveyForm
            survey={{
              id: survey.id.toString(),
              title: survey.title,
              description: survey.description,
              question: survey.question,
              options: survey.options,
              rewardPerResponse: survey.rewardPerResponse.toString(),
              maxResponses: survey.maxResponses.toString(),
              responseCount: survey.responseCount.toString(),
              active: survey.active
            }}
            onSuccess={async ({ proof }) => {
              // Submit proof on-chain
              if (!(window as any).ethereum) {
                alert("MetaMask required to submit proof");
                return;
              }

              try {
                const provider = new ethers.BrowserProvider((window as any).ethereum);
                const signer = await provider.getSigner();
                const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
                const abi = [
                  "function submitResponseWithProof(uint256 surveyId, bytes32 answerHash, uint256 rewardAmount, uint256 nonce, uint256 deadline, bytes calldata signature) external"
                ];
                const contract = new ethers.Contract(contractAddress!, abi, signer);

                const tx = await contract.submitResponseWithProof(
                  BigInt(proof.surveyId),
                  proof.answerHash,
                  BigInt(proof.rewardAmountWei),
                  BigInt(proof.nonce),
                  BigInt(Math.floor(new Date(proof.deadline).getTime() / 1000)),
                  proof.signature
                );

                alert(`Transaction sent! Hash: ${tx.hash}`);

                // Mark confirmed in backend
                await fetch(`/api/answers/${proof.answerId}/mark-onchain-confirmed`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ txHash: tx.hash })
                });

                redirect("/rewards?success=submitted");
              } catch (err) {
                alert(err instanceof Error ? err.message : "On-chain submission failed");
              }
            }}
            onError={(msg) => alert(msg)}
          />
        </div>
      </div>
    </div>
  );
}
