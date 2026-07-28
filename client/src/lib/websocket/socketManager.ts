import { io, type Socket } from 'socket.io-client';
import {
  CAMPAIGN_EVENT,
  SUBSCRIBE_CAMPAIGN,
  UNSUBSCRIBE_CAMPAIGN,
  type CampaignEventPayload,
} from './events.types';

/**
 * A single multiplexed socket shared by every mounted useCampaignLiveUpdates
 * instance, rather than one connection per component. Rooms are ref-counted
 * so a room is only left once the last subscriber unmounts, and are
 * re-joined automatically after a reconnect.
 */
const WS_URL = import.meta.env.VITE_WS_URL as string | undefined;

let socket: Socket | null = null;
const roomRefCounts = new Map<string, number>();

function getSocket(): Socket | null {
  if (!WS_URL) return null;
  if (socket) return socket;

  socket = io(WS_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  // Re-subscribe to every currently-held room after a reconnect (join state
  // lives on the server's socket instance, which is fresh on reconnect).
  socket.on('connect', () => {
    for (const campaignId of roomRefCounts.keys()) {
      socket?.emit(SUBSCRIBE_CAMPAIGN, campaignId);
    }
  });

  return socket;
}

export function joinCampaignRoom(campaignId: string): void {
  const s = getSocket();
  if (!s) return;
  const count = roomRefCounts.get(campaignId) ?? 0;
  roomRefCounts.set(campaignId, count + 1);
  if (count === 0) {
    if (s.connected) s.emit(SUBSCRIBE_CAMPAIGN, campaignId);
  }
}

export function leaveCampaignRoom(campaignId: string): void {
  const count = roomRefCounts.get(campaignId) ?? 0;
  if (count <= 1) {
    roomRefCounts.delete(campaignId);
    socket?.emit(UNSUBSCRIBE_CAMPAIGN, campaignId);
  } else {
    roomRefCounts.set(campaignId, count - 1);
  }
}

export function onCampaignEvent(
  listener: (payload: CampaignEventPayload) => void,
): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on(CAMPAIGN_EVENT, listener);
  return () => s.off(CAMPAIGN_EVENT, listener);
}

export function isWebSocketConfigured(): boolean {
  return Boolean(WS_URL);
}

export function onConnectionChange(
  listener: (connected: boolean) => void,
): () => void {
  const s = getSocket();
  if (!s) return () => {};
  const onConnect = () => listener(true);
  const onDisconnect = () => listener(false);
  s.on('connect', onConnect);
  s.on('disconnect', onDisconnect);
  return () => {
    s.off('connect', onConnect);
    s.off('disconnect', onDisconnect);
  };
}
