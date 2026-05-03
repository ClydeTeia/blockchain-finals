"use client";

import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div
          className="text-xl font-bold text-blue-600 cursor-pointer"
          onClick={() => router.push("/")}
        >
          SurveyChain Rewards
        </div>

        <nav className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-gray-600 hover:text-blue-600"
          >
            Surveys
          </button>
          <button
            onClick={() => router.push("/rewards")}
            className="text-gray-600 hover:text-blue-600"
          >
            Rewards
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="text-gray-600 hover:text-blue-600"
          >
            Admin
          </button>
          <button
            onClick={() => router.push("/kyc")}
            className="border border-blue-500 text-blue-500 px-3 py-1 rounded hover:bg-blue-50"
          >
            Get Verified
          </button>
          <button
            onClick={() => router.push("/surveys/create")}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Create Survey
          </button>
        </nav>
      </div>
    </header>
  );
}
