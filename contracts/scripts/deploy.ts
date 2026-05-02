import { ethers } from "hardhat";

async function main() {
  const factory = await ethers.getContractFactory("SurveyReward");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  console.log("SurveyReward deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
