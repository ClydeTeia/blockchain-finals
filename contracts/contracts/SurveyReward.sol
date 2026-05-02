// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract SurveyReward is AccessControl, Pausable, ReentrancyGuard, EIP712 {
  using ECDSA for bytes32;

  bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
  bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
  bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
  bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

  bytes32 private constant COMPLETION_PROOF_TYPEHASH =
    keccak256(
      "CompletionProof(address respondent,uint256 surveyId,bytes32 answerHash,uint256 rewardAmount,uint256 nonce,uint256 deadline)"
    );

  enum VerificationStatus {
    None,
    Pending,
    Approved,
    Rejected,
    Revoked
  }

  struct Survey {
    address creator;
    string title;
    string description;
    string question;
    string[] options;
    uint256 rewardPerResponse;
    uint256 maxResponses;
    uint256 responseCount;
    uint256 escrowRemaining;
    bool active;
    bool unusedRewardsWithdrawn;
  }

  struct CompletionProof {
    address respondent;
    uint256 surveyId;
    bytes32 answerHash;
    uint256 rewardAmount;
    uint256 nonce;
    uint256 deadline;
  }

  uint256 public surveyCount;
  mapping(uint256 => Survey) public surveys;
  mapping(address => VerificationStatus) public verificationStatus;
  mapping(address => bytes32) public verificationProofHash;
  mapping(uint256 => mapping(address => bool)) public hasSubmittedSurveyResponse;
  mapping(uint256 => bool) public usedProofNonces;
  mapping(address => uint256) public claimableRewards;
  mapping(address => uint256) public totalEarned;

  event CreatorRoleGranted(address indexed account);
  event CreatorRoleRevoked(address indexed account);
  event VerificationRequested(address indexed wallet, bytes32 indexed proofHash);
  event VerificationApproved(address indexed wallet);
  event VerificationRejected(address indexed wallet, string reason);
  event VerificationRevoked(address indexed wallet);
  event SurveyCreated(
    uint256 indexed surveyId,
    address indexed creator,
    uint256 rewardPerResponse,
    uint256 maxResponses,
    uint256 escrowAmount
  );
  event ResponseSubmitted(
    uint256 indexed surveyId,
    address indexed respondent,
    bytes32 indexed answerHash,
    uint256 rewardAmount,
    uint256 nonce
  );
  event RewardsClaimed(address indexed respondent, uint256 amount);
  event SurveyClosed(uint256 indexed surveyId, address indexed creator);
  event UnusedRewardsWithdrawn(uint256 indexed surveyId, address indexed creator, uint256 amount);

  constructor() EIP712("SurveyChainRewards", "1") {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(ADMIN_ROLE, msg.sender);
    _grantRole(CREATOR_ROLE, msg.sender);
    _grantRole(VERIFIER_ROLE, msg.sender);
    _grantRole(VALIDATOR_ROLE, msg.sender);
  }

  modifier onlyAdmin() {
    require(hasRole(ADMIN_ROLE, msg.sender), "Only admin.");
    _;
  }

  modifier onlyCreatorOrAdmin() {
    require(
      hasRole(CREATOR_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender),
      "Creator or admin required."
    );
    _;
  }

  modifier onlyVerifierOrAdmin() {
    require(
      hasRole(VERIFIER_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender),
      "Verifier or admin required."
    );
    _;
  }

  function grantCreatorRole(address account) external onlyAdmin {
    _grantRole(CREATOR_ROLE, account);
    emit CreatorRoleGranted(account);
  }

  function revokeCreatorRole(address account) external onlyAdmin {
    _revokeRole(CREATOR_ROLE, account);
    emit CreatorRoleRevoked(account);
  }

  function requestVerification(bytes32 kycProofHash) external whenNotPaused {
    verificationStatus[msg.sender] = VerificationStatus.Pending;
    verificationProofHash[msg.sender] = kycProofHash;
    emit VerificationRequested(msg.sender, kycProofHash);
  }

  function approveVerification(address wallet) external onlyVerifierOrAdmin {
    verificationStatus[wallet] = VerificationStatus.Approved;
    emit VerificationApproved(wallet);
  }

  function rejectVerification(address wallet, string calldata reason) external onlyVerifierOrAdmin {
    verificationStatus[wallet] = VerificationStatus.Rejected;
    emit VerificationRejected(wallet, reason);
  }

  function revokeVerification(address wallet) external onlyVerifierOrAdmin {
    verificationStatus[wallet] = VerificationStatus.Revoked;
    emit VerificationRevoked(wallet);
  }

  function createSurvey(
    string calldata title,
    string calldata description,
    string calldata question,
    string[] calldata options,
    uint256 rewardPerResponse,
    uint256 maxResponses
  ) external payable whenNotPaused onlyCreatorOrAdmin {
    require(bytes(title).length > 0, "Title required.");
    require(bytes(question).length > 0, "Question required.");
    require(options.length >= 2, "Need at least 2 options.");
    require(rewardPerResponse > 0, "rewardPerResponse must be > 0.");
    require(maxResponses > 0, "maxResponses must be > 0.");

    uint256 expectedEscrow = rewardPerResponse * maxResponses;
    require(msg.value == expectedEscrow, "Incorrect escrow amount.");

    surveyCount += 1;
    Survey storage survey = surveys[surveyCount];
    survey.creator = msg.sender;
    survey.title = title;
    survey.description = description;
    survey.question = question;
    survey.rewardPerResponse = rewardPerResponse;
    survey.maxResponses = maxResponses;
    survey.responseCount = 0;
    survey.escrowRemaining = expectedEscrow;
    survey.active = true;
    survey.unusedRewardsWithdrawn = false;

    for (uint256 i = 0; i < options.length; i++) {
      survey.options.push(options[i]);
    }

    emit SurveyCreated(
      surveyCount,
      msg.sender,
      rewardPerResponse,
      maxResponses,
      expectedEscrow
    );
  }

  function submitResponseWithProof(
    uint256 surveyId,
    bytes32 answerHash,
    uint256 rewardAmount,
    uint256 nonce,
    uint256 deadline,
    bytes calldata signature
  ) external whenNotPaused {
    require(verificationStatus[msg.sender] == VerificationStatus.Approved, "Not verified.");

    Survey storage survey = surveys[surveyId];
    require(survey.creator != address(0), "Survey does not exist.");
    require(survey.active, "Survey is not active.");
    require(survey.responseCount < survey.maxResponses, "Survey is full.");
    require(!hasSubmittedSurveyResponse[surveyId][msg.sender], "Already submitted.");
    require(answerHash != bytes32(0), "answerHash required.");
    require(block.timestamp <= deadline, "Proof expired.");
    require(!usedProofNonces[nonce], "Nonce already used.");
    require(rewardAmount == survey.rewardPerResponse, "Invalid reward amount.");
    require(survey.escrowRemaining >= rewardAmount, "Insufficient survey escrow.");

    bytes32 digest = _hashTypedDataV4(
      keccak256(
        abi.encode(
          COMPLETION_PROOF_TYPEHASH,
          msg.sender,
          surveyId,
          answerHash,
          rewardAmount,
          nonce,
          deadline
        )
      )
    );

    address signer = digest.recover(signature);
    require(hasRole(VALIDATOR_ROLE, signer), "Invalid validator signature.");

    usedProofNonces[nonce] = true;
    hasSubmittedSurveyResponse[surveyId][msg.sender] = true;
    survey.responseCount += 1;
    survey.escrowRemaining -= rewardAmount;
    claimableRewards[msg.sender] += rewardAmount;
    totalEarned[msg.sender] += rewardAmount;

    emit ResponseSubmitted(surveyId, msg.sender, answerHash, rewardAmount, nonce);
  }

  function claimRewards() external nonReentrant {
    uint256 amount = claimableRewards[msg.sender];
    require(amount > 0, "No claimable rewards.");

    claimableRewards[msg.sender] = 0;
    (bool ok, ) = payable(msg.sender).call{value: amount}("");
    require(ok, "Reward transfer failed.");

    emit RewardsClaimed(msg.sender, amount);
  }

  function closeSurvey(uint256 surveyId) external {
    Survey storage survey = surveys[surveyId];
    require(survey.creator != address(0), "Survey does not exist.");
    require(
      msg.sender == survey.creator || hasRole(ADMIN_ROLE, msg.sender),
      "Only creator or admin can close."
    );
    require(survey.active, "Survey already closed.");

    survey.active = false;
    emit SurveyClosed(surveyId, msg.sender);
  }

  function withdrawUnusedRewards(uint256 surveyId) external nonReentrant {
    Survey storage survey = surveys[surveyId];
    require(survey.creator != address(0), "Survey does not exist.");
    require(msg.sender == survey.creator, "Only creator can withdraw.");
    require(!survey.active, "Survey must be closed.");
    require(!survey.unusedRewardsWithdrawn, "Unused rewards already withdrawn.");

    uint256 amount = survey.escrowRemaining;
    survey.escrowRemaining = 0;
    survey.unusedRewardsWithdrawn = true;

    if (amount > 0) {
      (bool ok, ) = payable(survey.creator).call{value: amount}("");
      require(ok, "Withdraw transfer failed.");
    }

    emit UnusedRewardsWithdrawn(surveyId, survey.creator, amount);
  }

  function pause() external onlyAdmin {
    _pause();
  }

  function unpause() external onlyAdmin {
    _unpause();
  }

  function isVerified(address wallet) external view returns (bool) {
    return verificationStatus[wallet] == VerificationStatus.Approved;
  }

  function getCompletionProofDigest(CompletionProof calldata proof) external view returns (bytes32) {
    return
      _hashTypedDataV4(
        keccak256(
          abi.encode(
            COMPLETION_PROOF_TYPEHASH,
            proof.respondent,
            proof.surveyId,
            proof.answerHash,
            proof.rewardAmount,
            proof.nonce,
            proof.deadline
          )
        )
      );
  }

  receive() external payable {}
}
