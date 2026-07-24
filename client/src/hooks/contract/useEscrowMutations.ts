import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '../../context/WalletContext';
import {
  getEscrowClient,
  invokeContractWrite,
} from '../../lib/soroban/contractClient';
import { contractQueryKeys } from './queryKeys';
import type { DisputeResolutionTag } from '../../lib/soroban/types';

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

/**
 * Admin-only mutation hooks below. Every admin action first requires the
 * caller to be the escrow admin (see useEscrowAdmin in useEscrowQueries.ts);
 * the contract also enforces this via `require_admin`/`.require_auth()`, so
 * these hooks are a UX convenience, not the authorization boundary.
 */

export interface ConfigureTranchesInput {
  campaignId: string;
  tranches: { amount: bigint; milestone: string }[];
}

export function useConfigureTranches() {
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ConfigureTranchesInput) => {
      return invokeContractWrite(
        getEscrowClient(),
        'configure_tranches',
        {
          campaign_id: BigInt(input.campaignId),
          tranches: input.tranches.map((t) => ({
            amount: t.amount,
            milestone: t.milestone,
            released: false,
          })),
        },
        wallet,
      );
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.tranches(input.campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.adminCampaignsOverview(),
      });
    },
  });
}

export interface ReleaseTrancheInput {
  campaignId: string;
  recipient: string;
  amount: bigint;
}

export function useReleaseTranche() {
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReleaseTrancheInput) => {
      return invokeContractWrite(
        getEscrowClient(),
        'release_tranche',
        {
          campaign_id: BigInt(input.campaignId),
          recipient: input.recipient,
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
        queryKey: contractQueryKeys.tranches(input.campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.adminCampaignsOverview(),
      });
    },
  });
}

export interface ResolveDisputeInput {
  campaignId: string;
  resolution: DisputeResolutionTag;
  payoutAmount: bigint;
}

export function useResolveDispute() {
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ResolveDisputeInput) => {
      return invokeContractWrite(
        getEscrowClient(),
        'resolve_dispute',
        {
          campaign_id: BigInt(input.campaignId),
          resolution: { tag: input.resolution },
          payout_amount: input.payoutAmount,
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
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.adminCampaignsOverview(),
      });
    },
  });
}

export interface SettleCampaignInput {
  campaignId: string;
  farmer: string;
  farmerPayout: bigint;
}

export function useSettleCampaign() {
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SettleCampaignInput) => {
      return invokeContractWrite(
        getEscrowClient(),
        'settle_campaign',
        {
          campaign_id: BigInt(input.campaignId),
          farmer: input.farmer,
          farmer_payout: input.farmerPayout,
        },
        wallet,
      );
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.campaign(input.campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.adminCampaignsOverview(),
      });
    },
  });
}

export interface MarkFailedInput {
  campaignId: string;
}

export function useMarkFailed() {
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MarkFailedInput) => {
      return invokeContractWrite(
        getEscrowClient(),
        'mark_failed',
        {
          campaign_id: BigInt(input.campaignId),
        },
        wallet,
      );
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.campaign(input.campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.adminCampaignsOverview(),
      });
    },
  });
}
