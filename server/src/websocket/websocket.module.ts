import { Module } from '@nestjs/common';
import { CampaignEventsGateway } from './campaign-events.gateway';
import { RealtimeEventsService } from './realtime-events.service';

@Module({
  providers: [CampaignEventsGateway, RealtimeEventsService],
  exports: [RealtimeEventsService],
})
export class WebsocketModule {}
