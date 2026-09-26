/**
 * TanStack Query defaults for server state. Financial figures are always
 * computed by the backend, so data is refetched rather than kept long.
 */

import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api/errors.js';

const NO_RETRY = new Set(['validation', 'unauthorized', 'forbidden', 'not_found', 'conflict', 'unprocessable', 'unavailable', 'rate_limited']);

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && NO_RETRY.has(error.kind)) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}
