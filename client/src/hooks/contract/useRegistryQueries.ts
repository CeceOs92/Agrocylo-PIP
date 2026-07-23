import { useQuery } from '@tanstack/react-query';
import {
  contractMethod,
  getRegistryClient,
} from '../../lib/soroban/contractClient';
import { isRegistryConfigured } from '../../lib/soroban/config';
import { contractQueryKeys } from './queryKeys';
import type { ActivityRecord, FarmerProfile } from '../../lib/soroban/types';

/** Read hooks for RegistryContract state (farmer profiles, campaign activity log). */

export function useFarmer(address: string | undefined) {
  return useQuery({
    queryKey: contractQueryKeys.farmer(address ?? ''),
    enabled: Boolean(address) && isRegistryConfigured(),
    queryFn: async (): Promise<FarmerProfile | undefined> => {
      const client = await getRegistryClient();
      const tx = await contractMethod<FarmerProfile | undefined>(
        client,
        'get_farmer',
      )({ farmer: address! });
      return tx.result;
    },
  });
}

export function useActivity(campaignId: string | undefined) {
  return useQuery({
    queryKey: contractQueryKeys.activity(campaignId ?? ''),
    enabled: Boolean(campaignId) && isRegistryConfigured(),
    queryFn: async (): Promise<ActivityRecord[]> => {
      const client = await getRegistryClient();
      const tx = await contractMethod<ActivityRecord[]>(
        client,
        'get_campaign_activities',
      )({ campaign_id: BigInt(campaignId!) });
      return tx.result;
    },
  });
}
