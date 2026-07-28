import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { contractQueryKeys } from './contract/queryKeys';
import {
  isWebSocketConfigured,
  joinCampaignRoom,
  leaveCampaignRoom,
  onCampaignEvent,
} from '../lib/websocket/socketManager';

/**
 * Subscribes to real-time updates for one campaign and invalidates the
 * matching React Query cache entry when the server confirms a relevant
 * event was persisted. Falls back to the existing 30s staleTime polling
 * (see lib/queryClient.ts) if VITE_WS_URL is unset or the socket never
 * connects — this hook never throws and never blocks rendering.
 *
 * Invalidation (not setQueryData merging) is used deliberately: it's the
 * same code path a local mutation's onSuccess already takes, so a
 * WebSocket-triggered update and a local-mutation-triggered update collapse
 * into the same in-flight refetch instead of racing two sources of truth.
 */
export function useCampaignLiveUpdates(campaignId: string | undefined): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!campaignId || !isWebSocketConfigured()) return;

    joinCampaignRoom(campaignId);
    const unsubscribe = onCampaignEvent((payload) => {
      if (payload.campaignId !== campaignId) return;
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.campaign(campaignId),
      });
    });

    return () => {
      unsubscribe();
      leaveCampaignRoom(campaignId);
    };
  }, [campaignId, queryClient]);
}
