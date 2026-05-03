"use client";

import { useState } from "react";
import type { KycRequest, SignedUrlsResponse } from "@/lib/kyc/types";

type KycReviewPanelProps = {
  requests: KycRequest[];
  isLoading: boolean;
  isActing: boolean;
  error: string | null;
  onGetSignedUrls: (id: string) => Promise<SignedUrlsResponse | null>;
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string, reason: string) => Promise<boolean>;
  onRefresh: () => Promise<void>;
};

type ImagePreview = {
  requestId: string;
  documentSignedUrl: string;
  selfieImageUrl: string;
  expiresInSeconds: number;
};

export function KycReviewPanel({
  requests,
  isLoading,
  isActing,
  error,
  onGetSignedUrls,
  onApprove,
  onReject,
  onRefresh,
}: KycReviewPanelProps) {
  const [preview, setPreview] = useState<ImagePreview | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);

  async function handleViewImages(req: KycRequest) {
    setLoadingPreviewId(req.id);
    const urls = await onGetSignedUrls(req.id);
    setLoadingPreviewId(null);
    if (urls) {
      setPreview({
        requestId: req.id,
        documentSignedUrl: urls.documentSignedUrl,
        selfieImageUrl: urls.selfieSignedUrl,
        expiresInSeconds: urls.expiresInSeconds,
      });
    }
  }

  async function handleApprove(id: string) {
    await onApprove(id);
    if (preview?.requestId === id) setPreview(null);
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) return;
    const ok = await onReject(id, rejectReason.trim());
    if (ok) {
      setRejectingId(null);
      setRejectReason("");
      if (preview?.requestId === id) setPreview(null);
    }
  }

  if (isLoading) return <p>Loading KYC requests...</p>;

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <h2>KYC Requests</h2>
        <button onClick={onRefresh} disabled={isLoading}>
          Refresh
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {requests.length === 0 && <p>No KYC requests.</p>}

      <table>
        <thead>
          <tr>
            <th>Wallet</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id}>
              <td>
                <code title={req.walletAddress}>
                  {req.walletAddress.slice(0, 8)}…{req.walletAddress.slice(-6)}
                </code>
              </td>
              <td>{req.status}</td>
              <td>{new Date(req.submittedAt).toLocaleDateString()}</td>
              <td>
                <button
                  onClick={() => handleViewImages(req)}
                  disabled={isActing || loadingPreviewId === req.id}
                >
                  {loadingPreviewId === req.id ? "Loading..." : "View Images"}
                </button>
                {req.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={isActing}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectingId(req.id)}
                      disabled={isActing}
                    >
                      Reject
                    </button>
                  </>
                )}
                {req.status === "rejected" && req.decisionReason && (
                  <span> Reason: {req.decisionReason}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rejectingId && (
        <div role="dialog" aria-label="Reject KYC">
          <p>Rejection reason:</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            required
          />
          <div>
            <button
              onClick={() => handleReject(rejectingId)}
              disabled={!rejectReason.trim() || isActing}
            >
              Confirm Rejection
            </button>
            <button onClick={() => { setRejectingId(null); setRejectReason(""); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div role="dialog" aria-label="KYC document review">
          <p>
            <small>
              Signed URLs expire in {preview.expiresInSeconds} seconds.
              Do not screenshot or share these URLs.
            </small>
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div>
              <p>ID Image</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.documentSignedUrl}
                alt="Submitted ID document"
                style={{ maxWidth: "300px" }}
              />
            </div>
            <div>
              <p>Selfie</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.selfieImageUrl}
                alt="Submitted selfie"
                style={{ maxWidth: "300px" }}
              />
            </div>
          </div>
          <button onClick={() => setPreview(null)}>Close</button>
        </div>
      )}
    </div>
  );
}
