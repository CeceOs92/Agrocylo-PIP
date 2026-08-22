import { Logger, OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SkipThrottle } from '@nestjs/throttler';
import type { Server, Socket } from 'socket.io';
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

/**
 * Push channel for campaign updates. Clients opt into rooms explicitly
 * (per-campaign + the global activity feed) rather than receiving a
 * firehose of every event for every campaign.
 *
 * AUTHENTICATION & SECURITY DECISION:
 * - Campaign events broadcast over this gateway represent public campaign lifecycle
 *   activity (e.g., funding progress, status changes) designed for open marketplace
 *   discovery and live progress tracking, accessible to both guest and authenticated users.
 * - Consequently, socket connection-level authentication is intentionally deferred/omitted
 *   for these public event streams.
 * - Security is maintained via CORS origin controls (configured dynamically via CorsSocketIoAdapter)
 *   and explicit room subscriptions.
 * - Should future features introduce sensitive/private event streams (such as admin dispute
 *   details or private user notifications), token-based authentication guards must be added
 *   at connection time (e.g., handshake tokens) or message handle level.
 */
@WebSocketGateway()
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
