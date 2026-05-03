import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { isWalletVerified } from "@/lib/blockchain/verification";

export const dynamic = "force-dynamic";

export default async function KycPage() {
  const session = await requireSession();
  if ("response" in session) {
    redirect("/?error=login_required");
  }

  const verified = await isWalletVerified(session.walletAddress);

  if (verified) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">Verified!</h1>
            <p className="text-gray-600">
              Your wallet is verified. You can now complete reward surveys.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold mb-4">Get Verified</h1>
          <p className="text-gray-600 mb-6">
            To earn rewards, you need to complete a demo KYC verification.
            This involves uploading a sample ID image and selfie.
          </p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">
              KYC upload form will appear here.
            </p>
            <p className="text-sm text-gray-400">
              (Use sample ID only - never upload real ID)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
