import { QueryClient } from '@tanstack/react-query';
import { isNetworkError, isServerError } from './api-error';

const MAX_QUERY_RETRIES = 2;

// Retry only what a retry can fix: no response, or a 5xx. A 4xx or a schema
// mismatch will fail the same way again.
function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) return false;
  return isNetworkError(error) || isServerError(error);
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetryQuery,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
