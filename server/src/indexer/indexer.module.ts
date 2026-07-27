import { Module } from '@nestjs/common';
import { SorobanEventListenerService } from './soroban-event-listener.service';
import { EventParserService } from './parsers/event-parser.service';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebsocketModule],
  providers: [SorobanEventListenerService, EventParserService],
  exports: [SorobanEventListenerService, EventParserService],
})
export class IndexerModule {}
