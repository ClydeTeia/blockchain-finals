import { getAddress, isAddress } from "ethers";

function parseAllowlist(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => isAddress(item))
    .map((item) => getAddress(item).toLowerCase());
}

export function isCreatorWallet(walletAddress: string): boolean {
  if (!isAddress(walletAddress)) {
    return false;
  }

  const allowlist = parseAllowlist(
    process.env.NEXT_PUBLIC_CREATOR_WALLET_ALLOWLIST ??
      process.env.CREATOR_WALLET_ALLOWLIST
  );

  return allowlist.includes(getAddress(walletAddress).toLowerCase());
}
