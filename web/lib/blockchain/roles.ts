import { Contract, JsonRpcProvider, keccak256, toUtf8Bytes, hexlify } from "ethers";

const ROLES_ABI = [
  "function hasRole(bytes32 role, address account) view returns (bool)"
];

export async function hasRoleOnContract(
  walletAddress: string,
  roleName: "ADMIN_ROLE" | "CREATOR_ROLE"
): Promise<boolean> {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl || !contractAddress) {
    return false;
  }

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return false;
  }

  try {
    const provider = new JsonRpcProvider(rpcUrl);
    // Compute role hash: keccak256(roleName)
    const roleBytes = keccak256(toUtf8Bytes(roleName));
    const roleHash = hexlify(roleBytes);
    const contract = new Contract(contractAddress, ROLES_ABI, provider);
    const hasRole = await contract.hasRole(roleHash, walletAddress);
    return hasRole as boolean;
  } catch (error) {
    console.error("Error checking role:", error);
    return false;
  }
}
