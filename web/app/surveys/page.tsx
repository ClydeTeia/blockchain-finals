"use client";

import { Suspense } from "react";
import { SurveyFeed } from "@/components/SurveyFeed";
import { CreateSurveyForm } from "@/components/CreateSurveyForm";
import { QualityRulesForm } from "@/components/QualityRulesForm";
import { useWallet } from "@/hooks/useWallet";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useState } from "react";

export default function SurveysPage() {
  const { account } = useWallet();
  const { isAuthenticated, isAdmin, isCreator } = useWalletAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQualityRulesForm, setShowQualityRulesForm] = useState(false);
  const [createdSurveyId, setCreatedSurveyId] = useState<number | null>(null);

  const canCreateSurvey = !!(account && isAuthenticated && (isCreator || isAdmin));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold mb-1">Survey Feed</h1>
          <p className="text-muted text-base">
            Browse active surveys and participate to earn rewards.
          </p>
        </div>
        {canCreateSurvey && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setShowQualityRulesForm(false);
              }}
              className={`btn ${showCreateForm ? 'btn-ghost' : 'btn-secondary'}`}
            >
              {showCreateForm ? "Hide Form" : "Create Survey"}
            </button>
            <button
              onClick={() => {
                setShowQualityRulesForm(!showQualityRulesForm);
                setShowCreateForm(false);
              }}
              className={`btn ${showQualityRulesForm ? 'btn-ghost' : 'btn-secondary'}`}
            >
              Quality Rules
            </button>
          </div>
        )}
      </div>

      {!account && (
        <div className="p-4 surface mb-8 flex items-center gap-3">
          <span className="text-lg">👋</span>
          <p className="font-medium text-sm m-0">
            Please connect your wallet to participate in surveys or create new ones.
          </p>
        </div>
      )}

      {account && !isAuthenticated && (
        <div className="p-4 surface mb-8 flex items-center gap-3">
          <span className="text-lg">🔐</span>
          <p className="font-medium text-sm m-0">
            Please sign in with your wallet to access full features.
          </p>
        </div>
      )}

      {showCreateForm && (
        <div className="mb-8 card">
          <h2 className="text-xl font-semibold mb-4">Create New Survey</h2>
          <CreateSurveyForm />
        </div>
      )}

      {showQualityRulesForm && (
        <div className="mb-8 card">
           <h2 className="text-xl font-semibold mb-4">Configure Quality Rules</h2>
          <QualityRulesForm
            surveyId={createdSurveyId || 1}
            onCancel={() => {
              setShowQualityRulesForm(false);
              setCreatedSurveyId(null);
            }}
          />
        </div>
      )}

      <Suspense fallback={
        <div className="flex justify-center p-12 text-muted">
          <div className="animate-spin inline-block w-6 h-6 border-[2px] border-current border-t-transparent text-primary rounded-full" role="status" aria-label="loading"></div>
        </div>
      }>
        <div className="flex flex-col gap-6">
          <SurveyFeed />
        </div>
      </Suspense>
    </div>
  );
}
