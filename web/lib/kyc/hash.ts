import { createHash } from "node:crypto";
import { keccak256, toUtf8Bytes } from "ethers";

export function sha256Hex(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export function buildKycProofHash(input: {
  walletAddress: string;
  documentHash: string;
  selfieHash: string;
}): string {
  return keccak256(
    toUtf8Bytes(
      `${input.walletAddress.toLowerCase()}:${input.documentHash}:${input.selfieHash}`
    )
  );
}
