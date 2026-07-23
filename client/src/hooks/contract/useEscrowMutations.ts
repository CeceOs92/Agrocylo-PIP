import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '../../context/WalletContext';
import {
  getEscrowClient,
  invokeContractWrite,
} from '../../lib/soroban/contractClient';
import { contractQueryKeys } from './queryKeys';

/**
 * Mutation hooks for ProductionEscrowContract writes. Each hook invalidates
 * the read-hook queries it affects on success, so components using
 * useCampaign/useDispute/etc. refresh automatically without a page reload.
 */

export interface CreateCampaignInput {
  campaignId: bigint;
  farmer: string;
  targetAmount: bigint;
  tokenAddress: string;
  deadline: bigint;
  harvestMetadata: string;
}

export function useCreateCampaign() {
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      return invokeContractWrite(
        getEscrowClient(),
        'create_campaign',
        {
          campaign_id: input.campaignId,
          farmer: input.farmer,
          target_amount: input.targetAmount,
          token_address: input.tokenAddress,
          deadline: input.deadline,
          harvest_metadata: input.harvestMetadata,
        },
        wallet,
      );
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.campaign(input.campaignId.toString()),
      });
    },
  });
}

export interface FundCampaignInput {
  campaignId: string;
  investor: string;
  amount: bigint;
}

export function useFundCampaign() {
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FundCampaignInput) => {
      return invokeContractWrite(
        getEscrowClient(),
        'fund_campaign',
        {
          campaign_id: BigInt(input.campaignId),
          investor: input.investor,
          amount: input.amount,
        },
        wallet,
      );
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.campaign(input.campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.contribution(
          input.campaignId,
          input.investor,
        ),
      });
    },
  });
}

export interface ReportHarvestInput {
  campaignId: string;
  farmer: string;
  outcome: string;
}

export function useReportHarvest() {
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReportHarvestInput) => {
      return invokeContractWrite(
        getEscrowClient(),
        'report_harvest',
        {
          campaign_id: BigInt(input.campaignId),
          farmer: input.farmer,
          outcome: input.outcome,
        },
        wallet,
      );
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.campaign(input.campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.harvestRecord(input.campaignId),
      });
    },
  });
}

export interface OpenDisputeInput {
  campaignId: string;
  opener: string;
  reason: string;
}

export function useOpenDispute() {
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OpenDisputeInput) => {
      return invokeContractWrite(
        getEscrowClient(),
        'open_dispute',
        {
          campaign_id: BigInt(input.campaignId),
          opener: input.opener,
          reason: input.reason,
        },
        wallet,
      );
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.campaign(input.campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.dispute(input.campaignId),
      });
    },
  });
}
