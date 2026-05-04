import { ethers } from "hardhat";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

async function main() {
  const contractAddress = requireEnv("CONTRACT_ADDRESS");
  const targetWallet = requireEnv("TARGET_WALLET");

  const surveyReward = await ethers.getContractAt("SurveyReward", contractAddress);
  const tx = await surveyReward.grantCreatorRole(targetWallet);
  console.log(`grantCreatorRole tx sent: ${tx.hash}`);
  await tx.wait();
  console.log(`Creator role granted to ${targetWallet}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
