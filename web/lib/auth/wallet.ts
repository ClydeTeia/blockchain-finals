import { getAddress, isAddress, verifyMessage } from "ethers";
import { randomBytes } from "node:crypto";

export function normalizeWalletAddress(value: string): string | null {
  if (!isAddress(value)) {
    return null;
  }

  return getAddress(value);
}

export function generateNonce(): string {
  return randomBytes(16).toString("hex");
}

export function buildWalletLoginMessage(params: {
  walletAddress: string;
  nonce: string;
}): string {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID ?? "11155111";

  return [
    "SurveyChain Rewards wallet login",
    "",
    `Wallet: ${params.walletAddress}`,
    `Nonce: ${params.nonce}`,
    `Chain ID: ${chainId}`,
    "By signing, you prove wallet ownership for this session."
  ].join("\n");
}

export function verifyWalletSignature(params: {
  message: string;
  signature: string;
  walletAddress: string;
}): boolean {
  const recovered = verifyMessage(params.message, params.signature);
  const normalizedRecovered = normalizeWalletAddress(recovered);
  const normalizedWallet = normalizeWalletAddress(params.walletAddress);

  if (!normalizedRecovered || !normalizedWallet) {
    return false;
  }

  return normalizedRecovered === normalizedWallet;
}
