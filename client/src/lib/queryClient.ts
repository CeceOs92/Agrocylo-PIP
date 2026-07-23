import { QueryClient } from '@tanstack/react-query';

/**
 * On-chain data only changes after a confirmed transaction (ours or someone
 * else's), so we don't need to poll or refetch on window focus — mutations
 * invalidate the queries they affect (see hooks/contract/mutations.ts), and a
 * short staleTime absorbs bursts of re-renders/re-mounts across components
 * reading the same campaign.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
