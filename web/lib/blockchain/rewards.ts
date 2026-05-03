import { Contract, JsonRpcProvider, BrowserProvider } from "ethers";

const REWARDS_ABI = [
  "function claimableRewards(address) view returns (uint256)",
  "function totalEarned(address) view returns (uint256)",
  "function claimRewards() external nonReentrant",
  "function surveys(uint256) view returns (title string, description string, question string, options string[], rewardPerResponse uint256, maxResponses uint256, responseCount uint256, escrowRemaining uint256, active bool, creator address)"
];

export async function getClaimableRewards(
  walletAddress: string
): Promise<bigint> {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl || !contractAddress) {
    return 0n;
  }

  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(contractAddress, REWARDS_ABI, provider);
    const claimable = await contract.claimableRewards(walletAddress);
    return claimable as bigint;
  } catch (error) {
    console.error("Error fetching claimable rewards:", error);
    return 0n;
  }
}

export async function getTotalEarned(
  walletAddress: string
): Promise<bigint> {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl || !contractAddress) {
    return 0n;
  }

  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(contractAddress, REWARDS_ABI, provider);
    const earned = await contract.totalEarned(walletAddress);
    return earned as bigint;
  } catch (error) {
    console.error("Error fetching total earned:", error);
    return 0n;
  }
}

export async function claimRewardsViaMetaMask(
  walletAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  if (!(window as any).ethereum) {
    return { success: false, error: "MetaMask not installed" };
  }

  try {
    const browserProvider = new BrowserProvider((window as any).ethereum);
    const signer = await browserProvider.getSigner();
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) throw new Error("Contract address not configured");

    const contract = new Contract(contractAddress, REWARDS_ABI, signer);
    const tx = await contract.claimRewards({ from: walletAddress });
    const receipt = await tx.wait();

    if (receipt?.status === 1) {
      return { success: true, txHash: tx.hash };
    } else {
      return { success: false, error: "Transaction failed" };
    }
  } catch (error) {
    console.error("Error claiming rewards:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
