import { Logger, OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  GatewayMetadata,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SkipThrottle } from '@nestjs/throttler';
import type { IncomingMessage } from 'http';
import type { Server, Socket } from 'socket.io';
import configuration from '../config/configuration';
import { RealtimeEventsService } from './realtime-events.service';
import {
  ACTIVITY_ROOM,
  CAMPAIGN_EVENT,
  SUBSCRIBE_ACTIVITY,
  SUBSCRIBE_CAMPAIGN,
  UNSUBSCRIBE_ACTIVITY,
  UNSUBSCRIBE_CAMPAIGN,
  campaignRoom,
  type CampaignEventPayload,
} from './events.types';

export function createWebSocketGatewayOptions(
  allowedOrigins: string[],
): GatewayMetadata {
  const originAllowlist = new Set(allowedOrigins);

  return {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    // CORS headers protect HTTP polling in browsers, but WebSocket upgrades
    // must be rejected explicitly because the WebSocket protocol does not
    // enforce browser CORS rules.
    allowRequest: (
      request: IncomingMessage,
      callback: (error: string | null | undefined, success: boolean) => void,
    ): void => {
      const origin = request.headers.origin;
      const isAllowed =
        typeof origin === 'string' && originAllowlist.has(origin);

      callback(isAllowed ? null : 'Origin not allowed', isAllowed);
    },
  };
}

export const webSocketGatewayOptions = createWebSocketGatewayOptions(
  configuration().app.corsAllowedOrigins,
);

/**
 * Push channel for campaign updates. Clients opt into rooms explicitly
 * (per-campaign + the global activity feed) rather than receiving a
 * firehose of every event for every campaign.
 */
@WebSocketGateway(webSocketGatewayOptions)
@SkipThrottle()
export class CampaignEventsGateway implements OnModuleInit {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(CampaignEventsGateway.name);

  constructor(private readonly realtimeEvents: RealtimeEventsService) {}

  onModuleInit(): void {
    this.realtimeEvents.onCampaignEvent((payload) => this.broadcast(payload));
  }

  @SubscribeMessage(SUBSCRIBE_CAMPAIGN)
  handleSubscribeCampaign(
    @ConnectedSocket() client: Socket,
    @MessageBody() campaignId: string,
  ): void {
    void client.join(campaignRoom(campaignId));
  }

  @SubscribeMessage(UNSUBSCRIBE_CAMPAIGN)
  handleUnsubscribeCampaign(
    @ConnectedSocket() client: Socket,
    @MessageBody() campaignId: string,
  ): void {
    void client.leave(campaignRoom(campaignId));
  }

  @SubscribeMessage(SUBSCRIBE_ACTIVITY)
  handleSubscribeActivity(@ConnectedSocket() client: Socket): void {
    void client.join(ACTIVITY_ROOM);
  }

  @SubscribeMessage(UNSUBSCRIBE_ACTIVITY)
  handleUnsubscribeActivity(@ConnectedSocket() client: Socket): void {
    void client.leave(ACTIVITY_ROOM);
  }

  /**
   * Broadcast a normalized event to the campaign's room and the global
   * activity room. Called only after the indexer has confirmed the
   * corresponding DB write, so clients never see an update the API can't
   * yet corroborate on refetch.
   */
  broadcast(payload: CampaignEventPayload): void {
    this.logger.debug(
      { type: payload.type, campaignId: payload.campaignId },
      'Broadcasting campaign event',
    );
    this.server
      .to(campaignRoom(payload.campaignId))
      .emit(CAMPAIGN_EVENT, payload);
    this.server.to(ACTIVITY_ROOM).emit(CAMPAIGN_EVENT, payload);
  }
}
