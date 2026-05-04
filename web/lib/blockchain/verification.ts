import { Contract, JsonRpcProvider, getAddress, isAddress } from "ethers";
import { getLatestKycRequestByWallet } from "@/lib/kyc/data-store";

const verificationAbi = [
  "function isVerified(address wallet) view returns (bool)",
  "function ADMIN_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)"
];

function getAllowlist(): string[] {
  const raw = process.env.VERIFIED_WALLET_ALLOWLIST ?? "";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => isAddress(item))
    .map((item) => getAddress(item).toLowerCase());
}

export async function isWalletVerified(walletAddress: string): Promise<boolean> {
  if (!isAddress(walletAddress)) {
    return false;
  }
  const normalized = getAddress(walletAddress);

  try {
    const latestKyc = await getLatestKycRequestByWallet(normalized);
    if (latestKyc?.status === "approved") {
      return true;
    }
  } catch {
    // Continue with on-chain/allowlist fallback when off-chain store is unavailable.
  }

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (rpcUrl && contractAddress && isAddress(contractAddress)) {
    try {
      const provider = new JsonRpcProvider(rpcUrl);
      const contract = new Contract(contractAddress, verificationAbi, provider);
      const verified = (await contract.isVerified(normalized)) as boolean;
      return verified;
    } catch {
      return false;
    }
  }

  return getAllowlist().includes(normalized.toLowerCase());
}

export async function isWalletAdminOnChain(walletAddress: string): Promise<boolean> {
  if (!isAddress(walletAddress)) {
    return false;
  }
  const normalized = getAddress(walletAddress);

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!(rpcUrl && contractAddress && isAddress(contractAddress))) {
    return false;
  }

  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(contractAddress, verificationAbi, provider);
    const adminRole = (await contract.ADMIN_ROLE()) as string;
    const hasAdmin = (await contract.hasRole(adminRole, normalized)) as boolean;
    return hasAdmin;
  } catch {
    return false;
  }
}
