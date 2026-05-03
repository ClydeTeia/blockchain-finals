"use client";

import { useRef, useState } from "react";
import { BrowserProvider } from "ethers";
import type { KycSubmitResponse } from "@/lib/kyc/types";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name}: only JPEG, PNG, or WebP images are accepted.`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return `${file.name}: file must be smaller than 5 MB.`;
  }
  return null;
}

type KycUploadFormProps = {
  provider: BrowserProvider | null;
  isSubmitting: boolean;
  isRequestingOnChain: boolean;
  error: string | null;
  onSubmit: (idImage: File, selfieImage: File) => Promise<KycSubmitResponse | null>;
  onRequestOnChain: (kycProofHash: string) => Promise<void>;
};

export function KycUploadForm({
  provider,
  isSubmitting,
  isRequestingOnChain,
  error,
  onSubmit,
  onRequestOnChain,
}: KycUploadFormProps) {
  const idRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<KycSubmitResponse | null>(null);
  const [onChainDone, setOnChainDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    const idFile = idRef.current?.files?.[0];
    const selfieFile = selfieRef.current?.files?.[0];

    if (!idFile || !selfieFile) {
      setValidationError("Both ID image and selfie are required.");
      return;
    }

    const idErr = validateImageFile(idFile);
    if (idErr) { setValidationError(idErr); return; }

    const selfieErr = validateImageFile(selfieFile);
    if (selfieErr) { setValidationError(selfieErr); return; }

    const result = await onSubmit(idFile, selfieFile);
    if (result) setSubmitted(result);
  }

  async function handleRequestOnChain() {
    if (!submitted) return;
    await onRequestOnChain(submitted.kycProofHash);
    setOnChainDone(true);
  }

  if (onChainDone) {
    return (
      <div>
        <p>On-chain verification requested. Wait for admin review.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div>
        <p>Documents uploaded. Now request on-chain verification via MetaMask.</p>
        <p>
          <small>KYC proof hash: <code>{submitted.kycProofHash}</code></small>
        </p>
        <button
          onClick={handleRequestOnChain}
          disabled={!provider || isRequestingOnChain}
        >
          {isRequestingOnChain
            ? "Waiting for MetaMask..."
            : "Request Verification On-Chain"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <p role="note" style={{ border: "1px solid orange", padding: "0.5rem" }}>
        <strong>Demo only.</strong> Do not upload real government IDs. Use dummy
        or sample images for classroom demonstration only.
      </p>

      <div>
        <label htmlFor="kyc-id-image">ID Image (front)</label>
        <input
          id="kyc-id-image"
          ref={idRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="kyc-selfie">Selfie</label>
        <input
          id="kyc-selfie"
          ref={selfieRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={isSubmitting}
        />
      </div>

      {(validationError ?? error) && (
        <p style={{ color: "red" }}>{validationError ?? error}</p>
      )}

      <button type="submit" disabled={isSubmitting || !provider}>
        {isSubmitting ? "Uploading..." : "Submit KYC Documents"}
      </button>
      {!provider && <p style={{ color: "gray" }}>Connect wallet first.</p>}
    </form>
  );
}
