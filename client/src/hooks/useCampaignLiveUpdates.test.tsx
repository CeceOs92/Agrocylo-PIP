import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function makeMockSocket() {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  const socket = {
    connected: true,
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    }),
    off: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      listeners.get(event)?.delete(cb);
    }),
    emit: vi.fn(),
    trigger: (event: string, ...args: unknown[]) => {
      listeners.get(event)?.forEach((cb) => cb(...args));
    },
  };
  return socket;
}

describe('useCampaignLiveUpdates', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('invalidates the campaign query when a matching socket event arrives', async () => {
    vi.stubEnv('VITE_WS_URL', 'http://localhost:9999');
    const mockSocket = makeMockSocket();
    vi.doMock('socket.io-client', () => ({ io: () => mockSocket }));

    const { useCampaignLiveUpdates } = await import('./useCampaignLiveUpdates');
    const { contractQueryKeys } = await import('./contract/queryKeys');

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    function TestComponent() {
      useCampaignLiveUpdates('123');
      return <div>ok</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>,
    );

    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe:campaign', '123');

    mockSocket.trigger('campaign:event', {
      type: 'campaign.invested',
      campaignId: '123',
      data: { amount: '250' },
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: contractQueryKeys.campaign('123'),
    });
  });

  it('ignores events for a different campaignId', async () => {
    vi.stubEnv('VITE_WS_URL', 'http://localhost:9999');
    const mockSocket = makeMockSocket();
    vi.doMock('socket.io-client', () => ({ io: () => mockSocket }));

    const { useCampaignLiveUpdates } = await import('./useCampaignLiveUpdates');

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    function TestComponent() {
      useCampaignLiveUpdates('123');
      return <div>ok</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>,
    );

    mockSocket.trigger('campaign:event', {
      type: 'campaign.invested',
      campaignId: '999',
      data: {},
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('degrades gracefully and never opens a socket when VITE_WS_URL is unset', async () => {
    vi.stubEnv('VITE_WS_URL', '');
    const ioSpy = vi.fn();
    vi.doMock('socket.io-client', () => ({ io: ioSpy }));

    const { useCampaignLiveUpdates } = await import('./useCampaignLiveUpdates');

    const queryClient = new QueryClient();

    function TestComponent() {
      useCampaignLiveUpdates('123');
      return <div>ok</div>;
    }

    expect(() =>
      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>,
      ),
    ).not.toThrow();

    expect(ioSpy).not.toHaveBeenCalled();
  });
});
