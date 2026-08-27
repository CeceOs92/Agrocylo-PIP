import { GATEWAY_OPTIONS } from '@nestjs/websockets/constants';
import {
  CampaignEventsGateway,
  createWebSocketGatewayOptions,
  webSocketGatewayOptions,
} from './campaign-events.gateway';
import configuration from '../config/configuration';
import { RealtimeEventsService } from './realtime-events.service';
import { ACTIVITY_ROOM, campaignRoom } from './events.types';

function mockSocket() {
  return { join: jest.fn(), leave: jest.fn() } as any;
}

describe('CampaignEventsGateway', () => {
  let gateway: CampaignEventsGateway;
  let realtime: RealtimeEventsService;
  let emit: jest.Mock;
  let to: jest.Mock;

  beforeEach(() => {
    realtime = new RealtimeEventsService();
    gateway = new CampaignEventsGateway(realtime);
    emit = jest.fn();
    to = jest.fn().mockReturnValue({ emit });
    gateway.server = { to } as any;
  });

  describe('origin allowlist', () => {
    const allowedOrigin = 'https://app.agrocylo.example';

    it('configures the gateway without a wildcard origin', () => {
      const gatewayOptions = Reflect.getMetadata(
        GATEWAY_OPTIONS,
        CampaignEventsGateway,
      );

      expect(gatewayOptions).toBeDefined();
      expect(gatewayOptions.cors.origin).toEqual(
        configuration().app.corsAllowedOrigins,
      );
      expect(gatewayOptions).toEqual(webSocketGatewayOptions);
      expect(gatewayOptions.cors.origin).not.toContain('*');
      expect(gatewayOptions.allowRequest).toEqual(expect.any(Function));
    });

    it('allows a handshake from a configured origin', () => {
      const options = createWebSocketGatewayOptions([allowedOrigin]);
      const callback = jest.fn();

      options.allowRequest?.({ headers: { origin: allowedOrigin } }, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it.each([undefined, 'https://evil.example'])(
      'rejects a handshake from origin %s',
      (origin) => {
        const options = createWebSocketGatewayOptions([allowedOrigin]);
        const callback = jest.fn();

        options.allowRequest?.({ headers: { origin } }, callback);

        expect(callback).toHaveBeenCalledWith('Origin not allowed', false);
      },
    );
  });

  it('joins a client to a campaign room on subscribe', () => {
    const client = mockSocket();
    gateway.handleSubscribeCampaign(client, '123');
    expect(client.join).toHaveBeenCalledWith(campaignRoom('123'));
  });

  it('removes a client from a campaign room on unsubscribe', () => {
    const client = mockSocket();
    gateway.handleUnsubscribeCampaign(client, '123');
    expect(client.leave).toHaveBeenCalledWith(campaignRoom('123'));
  });

  it('joins and leaves the global activity room', () => {
    const client = mockSocket();
    gateway.handleSubscribeActivity(client);
    expect(client.join).toHaveBeenCalledWith(ACTIVITY_ROOM);
    gateway.handleUnsubscribeActivity(client);
    expect(client.leave).toHaveBeenCalledWith(ACTIVITY_ROOM);
  });

  it('broadcasts to the campaign room and the activity room', () => {
    const payload = {
      type: 'campaign.invested' as const,
      campaignId: '123',
      data: { amount: '250' },
    };
    gateway.broadcast(payload);

    expect(to).toHaveBeenCalledWith(campaignRoom('123'));
    expect(to).toHaveBeenCalledWith(ACTIVITY_ROOM);
    expect(emit).toHaveBeenCalledWith('campaign:event', payload);
  });

  it('broadcasts automatically when the realtime service emits a campaign event (broadcast-after-persist wiring)', () => {
    gateway.onModuleInit();
    const payload = {
      type: 'campaign.funded' as const,
      campaignId: '456',
      data: {},
    };

    realtime.emitCampaignEvent(payload);

    expect(to).toHaveBeenCalledWith(campaignRoom('456'));
    expect(emit).toHaveBeenCalledWith('campaign:event', payload);
  });
});
