import { useEffect, useState } from 'react';
import { loadRecentEscrowEvents } from '../lib/soroban/events';
import {
  computeAnalyticsMetrics,
  type AnalyticsMetrics,
} from '../lib/analytics/metrics';

const RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL || undefined;
const CONTRACT_ID =
  import.meta.env.VITE_PRODUCTION_ESCROW_CONTRACT_ID || undefined;
const DEFAULT_LOOKBACK_LEDGERS = 120_000;

const LOOKBACK_LEDGERS = (() => {
  const parsed = Number(import.meta.env.VITE_SOROBAN_EVENTS_LOOKBACK_LEDGERS);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_LOOKBACK_LEDGERS;
})();

export type AnalyticsState =
  | { status: 'not-configured' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; metrics: AnalyticsMetrics };

/**
 * Loads ProductionEscrowContract events directly from Soroban RPC and derives
 * chart-ready analytics metrics client-side. Requires VITE_SOROBAN_RPC_URL and
 * VITE_PRODUCTION_ESCROW_CONTRACT_ID to be configured (see client/.env.example);
 * without them this resolves to `not-configured` rather than failing.
 */
export function useCampaignAnalytics(): AnalyticsState {
  const [state, setState] = useState<AnalyticsState>(
    RPC_URL && CONTRACT_ID
      ? { status: 'loading' }
      : { status: 'not-configured' },
  );

  useEffect(() => {
    if (!RPC_URL || !CONTRACT_ID) return;
    let cancelled = false;

    async function load() {
      try {
        const events = await loadRecentEscrowEvents({
          rpcUrl: RPC_URL!,
          contractId: CONTRACT_ID!,
          lookbackLedgers: LOOKBACK_LEDGERS,
        });
        if (cancelled) return;
        setState({ status: 'ready', metrics: computeAnalyticsMetrics(events) });
      } catch (error) {
        if (cancelled) return;
        setState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to load analytics data from Soroban RPC.',
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
