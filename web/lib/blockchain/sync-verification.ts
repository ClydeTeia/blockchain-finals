import { Contract, JsonRpcProvider, Wallet, isAddress, getAddress } from "ethers";
import { getContractAddress } from "@/lib/blockchain/contract";

/**
 * Approves a wallet's verification status on-chain using the verifier/validator key.
 * Called automatically when off-chain KYC is approved to keep on-chain status in sync.
 */
export async function syncOnChainApproval(
  walletAddress: string
): Promise<{ ok: boolean; txHash?: string; reason?: string }> {
  if (!isAddress(walletAddress)) {
    return { ok: false, reason: "Invalid wallet address." };
  }

  const rpcUrl = process.env.SEPOLIA_RPC_URL ?? process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
  const contractAddress = getContractAddress();
  const verifierKey = process.env.VERIFIER_PRIVATE_KEY ?? process.env.VALIDATOR_PRIVATE_KEY ?? process.env.DEPLOYER_PRIVATE_KEY;

  if (!rpcUrl || !contractAddress || !verifierKey) {
    return { ok: false, reason: "Missing RPC, contract address, or verifier key." };
  }

  try {
    // First check if already verified on-chain to avoid wasting gas
    const provider = new JsonRpcProvider(rpcUrl);
    const readContract = new Contract(
      contractAddress,
      ["function isVerified(address wallet) view returns (bool)"],
      provider
    );
    const alreadyVerified = await readContract.isVerified(getAddress(walletAddress));
    if (alreadyVerified) {
      return { ok: true, reason: "Already verified on-chain." };
    }

    // Approve on-chain
    const signer = new Wallet(verifierKey, provider);
    const writeContract = new Contract(
      contractAddress,
      ["function approveVerification(address wallet)"],
      signer
    );
    const tx = await writeContract.approveVerification(getAddress(walletAddress));
    await tx.wait();
    return { ok: true, txHash: tx.hash as string };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown on-chain sync failure.";
    console.error("syncOnChainApproval failed for", walletAddress, ":", message);
    return { ok: false, reason: message };
  }
}
