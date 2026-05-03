"use client";

import Link from "next/link";

type SurveyCardProps = {
  id: string;
  title: string;
  description: string;
  question: string;
  rewardPerResponseWei: string;
  maxResponses: string;
  responseCount: string;
  active: boolean;
};

export default function SurveyCard({
  id,
  title,
  description,
  question,
  rewardPerResponseWei,
  maxResponses,
  responseCount,
  active
}: SurveyCardProps) {
  const rewardEth = (parseInt(rewardPerResponseWei) / 1e18).toFixed(6);
  const remaining = parseInt(maxResponses) - parseInt(responseCount);
  const percentFilled = Math.round(
    (parseInt(responseCount) / parseInt(maxResponses)) * 100
  );

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {active ? (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
            Active
          </span>
        ) : (
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
            Closed
          </span>
        )}
      </div>

      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>

      <div className="mb-3">
        <p className="text-sm font-medium mb-1">Question:</p>
        <p className="text-sm text-gray-700 line-clamp-2">{question}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Reward</p>
          <p className="font-medium">{rewardEth} ETH</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Spots Left</p>
          <p className="font-medium">
            {remaining} / {maxResponses}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span>Filled</span>
          <span>{percentFilled}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: `${percentFilled}%` }}
          />
        </div>
      </div>

      <Link
        href={`/surveys/${id}`}
        className="block w-full text-center bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
      >
        {active ? "Answer Survey" : "View Details"}
      </Link>
    </div>
  );
}
