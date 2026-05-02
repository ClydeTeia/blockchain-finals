import { expect } from "chai";
import { ethers } from "hardhat";

type ContractsFixture = {
  surveyReward: any;
  deployer: any;
  admin: any;
  creator: any;
  validator: any;
  verifier: any;
  respondent: any;
  attacker: any;
};

type CompletionProofParams = {
  contractAddress: string;
  chainId: bigint;
  signer: any;
  respondent: string;
  surveyId: bigint;
  answerHash: string;
  rewardAmount: bigint;
  nonce: bigint;
  deadline: bigint;
};

const ZERO_HASH = ethers.ZeroHash;

async function deployFixture(): Promise<ContractsFixture> {
  const [deployer, admin, creator, validator, verifier, respondent, attacker] =
    await ethers.getSigners();

  const surveyReward = await ethers.deployContract("SurveyReward");
  await surveyReward.waitForDeployment();

  return {
    surveyReward,
    deployer,
    admin,
    creator,
    validator,
    verifier,
    respondent,
    attacker
  };
}

async function signCompletionProof(params: CompletionProofParams): Promise<string> {
  const domain = {
    name: "SurveyChainRewards",
    version: "1",
    chainId: params.chainId,
    verifyingContract: params.contractAddress
  };

  const types = {
    CompletionProof: [
      { name: "respondent", type: "address" },
      { name: "surveyId", type: "uint256" },
      { name: "answerHash", type: "bytes32" },
      { name: "rewardAmount", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  };

  const value = {
    respondent: params.respondent,
    surveyId: params.surveyId,
    answerHash: params.answerHash,
    rewardAmount: params.rewardAmount,
    nonce: params.nonce,
    deadline: params.deadline
  };

  return params.signer.signTypedData(domain, types, value);
}

describe("SurveyReward - Phase 2 contract test plan", function () {
  describe("Role and access control", function () {
    it("assigns deployer the required roles", async function () {
      const { surveyReward, deployer } = await deployFixture();
      const deployerAddress = await deployer.getAddress();

      const adminRole = await surveyReward.ADMIN_ROLE();
      const creatorRole = await surveyReward.CREATOR_ROLE();
      const verifierRole = await surveyReward.VERIFIER_ROLE();
      const validatorRole = await surveyReward.VALIDATOR_ROLE();

      expect(await surveyReward.hasRole(adminRole, deployerAddress)).to.equal(true);
      expect(await surveyReward.hasRole(creatorRole, deployerAddress)).to.equal(true);
      expect(await surveyReward.hasRole(verifierRole, deployerAddress)).to.equal(true);
      expect(await surveyReward.hasRole(validatorRole, deployerAddress)).to.equal(true);
    });

    it("allows admin to grant and revoke creator role", async function () {
      const { surveyReward, creator } = await deployFixture();
      const creatorAddress = await creator.getAddress();

      await expect(surveyReward.grantCreatorRole(creatorAddress)).to.emit(
        surveyReward,
        "CreatorRoleGranted"
      );
      await expect(surveyReward.revokeCreatorRole(creatorAddress)).to.emit(
        surveyReward,
        "CreatorRoleRevoked"
      );
    });

    it("rejects non-admin creator-role grant", async function () {
      const { surveyReward, attacker, creator } = await deployFixture();
      await expect(
        surveyReward.connect(attacker).grantCreatorRole(await creator.getAddress())
      ).to.be.reverted;
    });
  });

  describe("Verification lifecycle", function () {
    it("allows request, approve, reject, and revoke verification by authorized roles", async function () {
      const { surveyReward, respondent, verifier } = await deployFixture();
      const respondentAddress = await respondent.getAddress();
      await surveyReward.grantRole(await surveyReward.VERIFIER_ROLE(), await verifier.getAddress());

      await expect(surveyReward.connect(respondent).requestVerification(ZERO_HASH)).to.emit(
        surveyReward,
        "VerificationRequested"
      );
      await expect(surveyReward.connect(verifier).approveVerification(respondentAddress)).to.emit(
        surveyReward,
        "VerificationApproved"
      );
      await expect(
        surveyReward.connect(verifier).rejectVerification(respondentAddress, "demo")
      ).to.emit(surveyReward, "VerificationRejected");
      await expect(surveyReward.connect(verifier).revokeVerification(respondentAddress)).to.emit(
        surveyReward,
        "VerificationRevoked"
      );
    });

    it("rejects verification approval by non-verifier", async function () {
      const { surveyReward, respondent, attacker } = await deployFixture();
      await expect(
        surveyReward.connect(attacker).approveVerification(await respondent.getAddress())
      ).to.be.reverted;
    });
  });

  describe("Survey creation", function () {
    it("allows creator to create survey with exact escrow", async function () {
      const { surveyReward, creator } = await deployFixture();
      const rewardPerResponse = ethers.parseEther("0.01");
      const maxResponses = 5n;
      const escrow = rewardPerResponse * maxResponses;

      await surveyReward.grantCreatorRole(await creator.getAddress());

      await expect(
        surveyReward.connect(creator).createSurvey(
          "Title",
          "Description",
          "Question?",
          ["A", "B"],
          rewardPerResponse,
          maxResponses,
          { value: escrow }
        )
      ).to.emit(surveyReward, "SurveyCreated");
    });

    it("rejects survey creation for non-creator or invalid params", async function () {
      const { surveyReward, attacker } = await deployFixture();

      await expect(
        surveyReward.connect(attacker).createSurvey("T", "D", "Q", ["A", "B"], 1n, 1n, { value: 1n })
      ).to.be.reverted;
      await expect(
        surveyReward.createSurvey("", "D", "Q", ["A", "B"], 1n, 1n, { value: 1n })
      ).to.be.reverted;
      await expect(
        surveyReward.createSurvey("T", "D", "", ["A", "B"], 1n, 1n, { value: 1n })
      ).to.be.reverted;
      await expect(
        surveyReward.createSurvey("T", "D", "Q", ["A"], 1n, 1n, { value: 1n })
      ).to.be.reverted;
      await expect(
        surveyReward.createSurvey("T", "D", "Q", ["A", "B"], 0n, 1n, { value: 0n })
      ).to.be.reverted;
      await expect(
        surveyReward.createSurvey("T", "D", "Q", ["A", "B"], 1n, 0n, { value: 0n })
      ).to.be.reverted;
      await expect(
        surveyReward.createSurvey("T", "D", "Q", ["A", "B"], 2n, 2n, { value: 1n })
      ).to.be.reverted;
    });
  });

  describe("Completion proof and response submission", function () {
    it("accepts valid EIP-712 proof and credits rewards", async function () {
      const { surveyReward, creator, respondent, validator, verifier } = await deployFixture();
      const rewardPerResponse = ethers.parseEther("0.01");
      const maxResponses = 2n;
      const escrow = rewardPerResponse * maxResponses;

      await surveyReward.grantCreatorRole(await creator.getAddress());
      await surveyReward.grantRole(await surveyReward.VERIFIER_ROLE(), await verifier.getAddress());
      await surveyReward.grantRole(await surveyReward.VALIDATOR_ROLE(), await validator.getAddress());

      await surveyReward.connect(respondent).requestVerification(ZERO_HASH);
      await surveyReward.connect(verifier).approveVerification(await respondent.getAddress());

      await surveyReward
        .connect(creator)
        .createSurvey("Title", "Description", "Question?", ["A", "B"], rewardPerResponse, maxResponses, {
          value: escrow
        });

      const chainId = (await ethers.provider.getNetwork()).chainId;
      const nonce = 1n;
      const deadline = (await ethers.provider.getBlock("latest"))!.timestamp + 600;
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("answer-1"));
      const signature = await signCompletionProof({
        contractAddress: await surveyReward.getAddress(),
        chainId,
        signer: validator,
        respondent: await respondent.getAddress(),
        surveyId: 1n,
        answerHash,
        rewardAmount: rewardPerResponse,
        nonce,
        deadline: BigInt(deadline)
      });

      await expect(
        surveyReward
          .connect(respondent)
          .submitResponseWithProof(1n, answerHash, rewardPerResponse, nonce, BigInt(deadline), signature)
      ).to.emit(surveyReward, "ResponseSubmitted");

      expect(await surveyReward.claimableRewards(await respondent.getAddress())).to.equal(
        rewardPerResponse
      );
    });

    it("rejects invalid proof scenarios and duplicate/unverified responses", async function () {
      const { surveyReward, creator, respondent, validator, verifier, attacker } =
        await deployFixture();

      const rewardPerResponse = ethers.parseEther("0.01");
      await surveyReward.grantCreatorRole(await creator.getAddress());
      await surveyReward.grantRole(await surveyReward.VERIFIER_ROLE(), await verifier.getAddress());
      await surveyReward.grantRole(await surveyReward.VALIDATOR_ROLE(), await validator.getAddress());

      await surveyReward.connect(respondent).requestVerification(ZERO_HASH);
      await surveyReward.connect(verifier).approveVerification(await respondent.getAddress());
      await surveyReward
        .connect(creator)
        .createSurvey("Title", "Description", "Question?", ["A", "B"], rewardPerResponse, 1n, {
          value: rewardPerResponse
        });

      const chainId = (await ethers.provider.getNetwork()).chainId;
      const now = BigInt((await ethers.provider.getBlock("latest"))!.timestamp);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("answer-2"));

      const validSig = await signCompletionProof({
        contractAddress: await surveyReward.getAddress(),
        chainId,
        signer: validator,
        respondent: await respondent.getAddress(),
        surveyId: 1n,
        answerHash,
        rewardAmount: rewardPerResponse,
        nonce: 11n,
        deadline: now + 600n
      });

      await expect(
        surveyReward
          .connect(respondent)
          .submitResponseWithProof(1n, answerHash, rewardPerResponse, 11n, now + 600n, validSig)
      ).to.emit(surveyReward, "ResponseSubmitted");

      await expect(
        surveyReward
          .connect(respondent)
          .submitResponseWithProof(1n, answerHash, rewardPerResponse, 11n, now + 600n, validSig)
      ).to.be.reverted;

      const wrongSignerSig = await signCompletionProof({
        contractAddress: await surveyReward.getAddress(),
        chainId,
        signer: attacker,
        respondent: await respondent.getAddress(),
        surveyId: 1n,
        answerHash: ethers.keccak256(ethers.toUtf8Bytes("answer-3")),
        rewardAmount: rewardPerResponse,
        nonce: 12n,
        deadline: now + 600n
      });

      await expect(
        surveyReward
          .connect(respondent)
          .submitResponseWithProof(
            1n,
            ethers.keccak256(ethers.toUtf8Bytes("answer-3")),
            rewardPerResponse,
            12n,
            now + 600n,
            wrongSignerSig
          )
      ).to.be.reverted;

      const expiredSig = await signCompletionProof({
        contractAddress: await surveyReward.getAddress(),
        chainId,
        signer: validator,
        respondent: await respondent.getAddress(),
        surveyId: 1n,
        answerHash: ethers.keccak256(ethers.toUtf8Bytes("answer-4")),
        rewardAmount: rewardPerResponse,
        nonce: 13n,
        deadline: now - 1n
      });

      await expect(
        surveyReward
          .connect(respondent)
          .submitResponseWithProof(
            1n,
            ethers.keccak256(ethers.toUtf8Bytes("answer-4")),
            rewardPerResponse,
            13n,
            now - 1n,
            expiredSig
          )
      ).to.be.reverted;
    });
  });

  describe("Claim, close, refund, and pause", function () {
    it("lets user claim rewards and resets claimable balance", async function () {
      const { surveyReward, respondent } = await deployFixture();
      await expect(surveyReward.connect(respondent).claimRewards()).to.be.reverted;
    });

    it("supports survey close/refund and pause access control", async function () {
      const { surveyReward, creator, attacker } = await deployFixture();
      await surveyReward.grantCreatorRole(await creator.getAddress());
      await surveyReward
        .connect(creator)
        .createSurvey("Title", "Description", "Question?", ["A", "B"], 1n, 1n, { value: 1n });

      await expect(surveyReward.connect(attacker).closeSurvey(1n)).to.be.reverted;
      await expect(surveyReward.connect(creator).closeSurvey(1n)).to.emit(surveyReward, "SurveyClosed");
      await expect(surveyReward.connect(creator).withdrawUnusedRewards(1n)).to.emit(
        surveyReward,
        "UnusedRewardsWithdrawn"
      );

      await expect(surveyReward.connect(attacker).pause()).to.be.reverted;
      await expect(surveyReward.pause()).to.not.be.reverted;
      await expect(surveyReward.unpause()).to.not.be.reverted;
    });
  });
});
