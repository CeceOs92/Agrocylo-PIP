import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import type { CampaignEventPayload } from './events.types';

const CAMPAIGN_EVENT_KEY = 'campaign-event';

/**
 * In-process pub/sub between the indexer (which knows the instant a DB write
 * succeeds) and the WebSocket gateway (which broadcasts it). Kept as a thin
 * EventEmitter wrapper rather than a direct gateway dependency so the
 * indexer module doesn't need to know sockets exist.
 */
@Injectable()
export class RealtimeEventsService {
  private readonly emitter = new EventEmitter();

  emitCampaignEvent(payload: CampaignEventPayload): void {
    this.emitter.emit(CAMPAIGN_EVENT_KEY, payload);
  }

  onCampaignEvent(listener: (payload: CampaignEventPayload) => void): void {
    this.emitter.on(CAMPAIGN_EVENT_KEY, listener);
  }
}
