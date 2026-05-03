"use client";

import { useCallback, useMemo } from "react";
import { BrowserProvider, Contract, ContractTransactionResponse } from "ethers";
import {
  SURVEY_REWARD_ABI,
  SurveyStruct,
  getContractAddress,
} from "@/lib/blockchain/contract";

export type SurveyContractState = {
  isReady: boolean;
  contractAddress: string | null;
  // Reads
  isVerified: (address: string) => Promise<boolean>;
  claimableRewards: (address: string) => Promise<bigint>;
  totalEarned: (address: string) => Promise<bigint>;
  getSurvey: (surveyId: bigint | number) => Promise<SurveyStruct>;
  getAllSurveys: () => Promise<SurveyStruct[]>;
  hasSubmitted: (surveyId: bigint | number, address: string) => Promise<boolean>;
  // Writes (require signer — throw if provider is null)
  claimRewards: () => Promise<ContractTransactionResponse>;
  submitResponseWithProof: (
    surveyId: bigint | number,
    answerHash: string,
    rewardAmount: bigint,
    nonce: bigint,
    deadline: bigint,
    signature: string
  ) => Promise<ContractTransactionResponse>;
  requestVerification: (kycProofHash: string) => Promise<ContractTransactionResponse>;
};

export function useSurveyContract(
  provider: BrowserProvider | null
): SurveyContractState {
  const contractAddress = getContractAddress();

  const readContract = useMemo(() => {
    if (!provider || !contractAddress) return null;
    return new Contract(contractAddress, SURVEY_REWARD_ABI, provider);
  }, [provider, contractAddress]);

  const writeContract = useCallback(async () => {
    if (!provider || !contractAddress) {
      throw new Error(
        contractAddress
          ? "Wallet not connected."
          : "NEXT_PUBLIC_CONTRACT_ADDRESS is not configured."
      );
    }
    const signer = await provider.getSigner();
    return new Contract(contractAddress, SURVEY_REWARD_ABI, signer);
  }, [provider, contractAddress]);

  const isVerified = useCallback(
    async (address: string): Promise<boolean> => {
      if (!readContract) throw new Error("Contract not ready.");
      return readContract.isVerified(address) as Promise<boolean>;
    },
    [readContract]
  );

  const claimableRewards = useCallback(
    async (address: string): Promise<bigint> => {
      if (!readContract) throw new Error("Contract not ready.");
      return readContract.claimableRewards(address) as Promise<bigint>;
    },
    [readContract]
  );

  const totalEarned = useCallback(
    async (address: string): Promise<bigint> => {
      if (!readContract) throw new Error("Contract not ready.");
      return readContract.totalEarned(address) as Promise<bigint>;
    },
    [readContract]
  );

  const getSurvey = useCallback(
    async (surveyId: bigint | number): Promise<SurveyStruct> => {
      if (!readContract) throw new Error("Contract not ready.");
      return readContract.getSurvey(surveyId) as Promise<SurveyStruct>;
    },
    [readContract]
  );

  const getAllSurveys = useCallback(async (): Promise<SurveyStruct[]> => {
    if (!readContract) throw new Error("Contract not ready.");
    return readContract.getAllSurveys() as Promise<SurveyStruct[]>;
  }, [readContract]);

  const hasSubmitted = useCallback(
    async (surveyId: bigint | number, address: string): Promise<boolean> => {
      if (!readContract) throw new Error("Contract not ready.");
      return readContract.hasSubmittedSurveyResponse(
        surveyId,
        address
      ) as Promise<boolean>;
    },
    [readContract]
  );

  const claimRewards = useCallback(async (): Promise<ContractTransactionResponse> => {
    const c = await writeContract();
    return c.claimRewards() as Promise<ContractTransactionResponse>;
  }, [writeContract]);

  const submitResponseWithProof = useCallback(
    async (
      surveyId: bigint | number,
      answerHash: string,
      rewardAmount: bigint,
      nonce: bigint,
      deadline: bigint,
      signature: string
    ): Promise<ContractTransactionResponse> => {
      const c = await writeContract();
      return c.submitResponseWithProof(
        surveyId,
        answerHash,
        rewardAmount,
        nonce,
        deadline,
        signature
      ) as Promise<ContractTransactionResponse>;
    },
    [writeContract]
  );

  const requestVerification = useCallback(
    async (kycProofHash: string): Promise<ContractTransactionResponse> => {
      const c = await writeContract();
      return c.requestVerification(kycProofHash) as Promise<ContractTransactionResponse>;
    },
    [writeContract]
  );

  return {
    isReady: !!readContract,
    contractAddress,
    isVerified,
    claimableRewards,
    totalEarned,
    getSurvey,
    getAllSurveys,
    hasSubmitted,
    claimRewards,
    submitResponseWithProof,
    requestVerification,
  };
}
