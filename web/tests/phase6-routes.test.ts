import { Wallet } from "ethers";

import { AUTH_COOKIE_NAME } from "@/lib/auth/config";
import { createSessionToken } from "@/lib/auth/session";
import { resetAuditLogsForTests } from "@/lib/audit/log";
import { resetKycStoreForTests } from "@/lib/kyc/data-store";
import { POST as kycSubmitPost } from "@/app/api/kyc/submit/route";
import { GET as kycStatusGet } from "@/app/api/kyc/status/route";
import { GET as adminKycRequestsGet } from "@/app/api/admin/kyc-requests/route";
import { POST as signedUrlsPost } from "@/app/api/admin/kyc/[id]/signed-urls/route";
import { POST as approvePost } from "@/app/api/admin/kyc/[id]/approve/route";
import { POST as rejectPost } from "@/app/api/admin/kyc/[id]/reject/route";
import { clearMockCookies, setMockCookie } from "@/test-utils/mock-next-headers";

describe("Phase 6 KYC route handlers", () => {
  beforeEach(() => {
    clearMockCookies();
    resetKycStoreForTests();
    resetAuditLogsForTests();
    process.env.SESSION_SECRET = "test-secret";
    process.env.KYC_MAX_FILE_BYTES = "5242880";
    process.env.KYC_ALLOWED_MIME_TYPES = "image/png,image/jpeg,image/webp";
    process.env.ADMIN_WALLET_ALLOWLIST = "";
    process.env.VERIFIER_WALLET_ALLOWLIST = "";
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  function login(walletAddress: string): void {
    setMockCookie(AUTH_COOKIE_NAME, createSessionToken(walletAddress).token);
  }

  function makeKycFormData() {
    const formData = new FormData();
    formData.set(
      "document",
      new File([new Uint8Array([1, 2, 3])], "document.png", {
        type: "image/png"
      })
    );
    formData.set(
      "selfie",
      new File([new Uint8Array([4, 5, 6])], "selfie.jpg", {
        type: "image/jpeg"
      })
    );
    return formData;
  }

  it("rejects unauthenticated KYC submission", async () => {
    const response = await kycSubmitPost(
      new Request("http://localhost/api/kyc/submit", {
        method: "POST",
        body: makeKycFormData()
      })
    );
    expect(response.status).toBe(401);
  });

  it("rejects invalid KYC file type", async () => {
    const wallet = Wallet.createRandom();
    login(wallet.address);

    const formData = new FormData();
    formData.set("document", new File(["text"], "document.txt", { type: "text/plain" }));
    formData.set("selfie", new File([new Uint8Array([7])], "selfie.png", { type: "image/png" }));

    const response = await kycSubmitPost(
      new Request("http://localhost/api/kyc/submit", {
        method: "POST",
        body: formData
      })
    );

    expect(response.status).toBe(400);
  });

  it("submits KYC, lists for admin, creates signed URLs, and approves", async () => {
    const respondent = Wallet.createRandom();
    const admin = Wallet.createRandom();
    process.env.ADMIN_WALLET_ALLOWLIST = admin.address;

    login(respondent.address);
    const submitResponse = await kycSubmitPost(
      new Request("http://localhost/api/kyc/submit", {
        method: "POST",
        body: makeKycFormData()
      })
    );

    expect(submitResponse.status).toBe(200);
    const submitBody = (await submitResponse.json()) as {
      requestId: string;
      status: string;
    };
    expect(submitBody.status).toBe("pending");

    const statusPending = await kycStatusGet();
    expect(statusPending.status).toBe(200);
    const statusPendingBody = (await statusPending.json()) as { status: string };
    expect(statusPendingBody.status).toBe("pending");

    login(respondent.address);
    const nonAdminList = await adminKycRequestsGet(
      new Request("http://localhost/api/admin/kyc-requests", { method: "GET" })
    );
    expect(nonAdminList.status).toBe(403);

    login(admin.address);
    const adminList = await adminKycRequestsGet(
      new Request("http://localhost/api/admin/kyc-requests", { method: "GET" })
    );
    expect(adminList.status).toBe(200);

    const signedUrlsResponse = await signedUrlsPost(
      new Request(`http://localhost/api/admin/kyc/${submitBody.requestId}/signed-urls`, {
        method: "POST",
        body: JSON.stringify({ expiresInSeconds: 120 })
      }),
      { params: Promise.resolve({ id: submitBody.requestId }) }
    );
    expect(signedUrlsResponse.status).toBe(200);
    const signedUrlsBody = (await signedUrlsResponse.json()) as {
      documentSignedUrl: string;
      selfieSignedUrl: string;
    };
    expect(signedUrlsBody.documentSignedUrl).toContain("example.local");
    expect(signedUrlsBody.selfieSignedUrl).toContain("example.local");

    const approveResponse = await approvePost(
      new Request(`http://localhost/api/admin/kyc/${submitBody.requestId}/approve`, {
        method: "POST",
        body: JSON.stringify({ reason: "Looks good" })
      }),
      { params: Promise.resolve({ id: submitBody.requestId }) }
    );
    expect(approveResponse.status).toBe(200);

    login(respondent.address);
    const statusApproved = await kycStatusGet();
    expect(statusApproved.status).toBe(200);
    const statusApprovedBody = (await statusApproved.json()) as {
      status: string;
      decisionReason: string;
    };
    expect(statusApprovedBody.status).toBe("approved");
    expect(statusApprovedBody.decisionReason).toBe("Looks good");
  });

  it("allows admin to reject pending request", async () => {
    const respondent = Wallet.createRandom();
    const admin = Wallet.createRandom();
    process.env.ADMIN_WALLET_ALLOWLIST = admin.address;

    login(respondent.address);
    const submitResponse = await kycSubmitPost(
      new Request("http://localhost/api/kyc/submit", {
        method: "POST",
        body: makeKycFormData()
      })
    );
    const submitBody = (await submitResponse.json()) as { requestId: string };

    login(admin.address);
    const rejectResponse = await rejectPost(
      new Request(`http://localhost/api/admin/kyc/${submitBody.requestId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: "Image quality too low" })
      }),
      { params: Promise.resolve({ id: submitBody.requestId }) }
    );

    expect(rejectResponse.status).toBe(200);

    login(respondent.address);
    const statusResponse = await kycStatusGet();
    const statusBody = (await statusResponse.json()) as {
      status: string;
      decisionReason: string;
    };
    expect(statusBody.status).toBe("rejected");
    expect(statusBody.decisionReason).toBe("Image quality too low");
  });
});
