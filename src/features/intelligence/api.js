import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api/client.js';

/*
 * Intelligence (API_CONTRACT.md §9.5 health, §9.9 forecast, §9.10 AI). Every
 * finding, flag, projection and score is produced by the backend with the
 * method it discloses in meta.capability; this layer only fetches and sends.
 */

const periodBody = (period) => (period.period === 'custom'
  ? { period: 'custom', periodStart: period.periodStart, periodEnd: period.periodEnd }
  : { period: period.period });

function useInvalidate(keys) {
  const queryClient = useQueryClient();
  return () => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export function useInsights(period, includeDismissed) {
  return useQuery({
    queryKey: ['dashboard', 'insights', period, includeDismissed],
    queryFn: async ({ signal }) => api.get('/ai/insights', { query: { ...period, includeDismissed }, signal }),
    placeholderData: keepPreviousData,
  });
}

export function useGenerateInsights() {
  const invalidate = useInvalidate([['dashboard']]);
  return useMutation({ mutationFn: (period) => api.post('/ai/insights', periodBody(period)), onSuccess: invalidate });
}

export function useDismissInsight() {
  const invalidate = useInvalidate([['dashboard']]);
  return useMutation({ mutationFn: (id) => api.post(`/ai/insights/${id}/dismiss`), onSuccess: invalidate });
}

export function useAnomalies(query) {
  return useQuery({
    queryKey: ['dashboard', 'anomalies', query],
    queryFn: async ({ signal }) => api.get('/ai/anomalies', { query, signal }),
    placeholderData: keepPreviousData,
  });
}

export function useDetectAnomalies() {
  const invalidate = useInvalidate([['dashboard'], ['notifications']]);
  return useMutation({ mutationFn: (period) => api.post('/ai/anomalies/detect', periodBody(period)), onSuccess: invalidate });
}

export function useUpdateAnomaly() {
  const invalidate = useInvalidate([['dashboard'], ['notifications']]);
  return useMutation({ mutationFn: ({ id, status, note }) => api.patch(`/ai/anomalies/${id}`, { status, ...(note ? { note } : {}) }), onSuccess: invalidate });
}

/** The latest stored projection; null (not an error) before the first one. */
export function useForecast() {
  return useQuery({
    queryKey: ['dashboard', 'forecast'],
    queryFn: async ({ signal }) => {
      try {
        return await api.get('/forecast/latest', { signal });
      } catch (error) {
        if (error?.kind === 'not_found') return null;
        throw error;
      }
    },
  });
}

export function useGenerateForecast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (horizonDays) => api.post('/forecast', { horizonDays }),
    onSuccess: (response) => {
      queryClient.setQueryData(['dashboard', 'forecast'], response);
      return Promise.all([['dashboard'], ['notifications']].map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  });
}

export function useHealth(period) {
  return useQuery({
    queryKey: ['dashboard', 'health', period],
    queryFn: async ({ signal }) => api.get('/financials/health', { query: period, signal }),
    placeholderData: keepPreviousData,
  });
}

export function useConversation() {
  return useQuery({
    queryKey: ['assistant'],
    queryFn: async ({ signal }) => api.get('/ai/assistant/messages', { query: { limit: 100 }, signal }),
  });
}

export function useAsk() {
  const invalidate = useInvalidate([['assistant']]);
  return useMutation({ mutationFn: (message) => api.post('/ai/assistant/messages', { message }), onSuccess: invalidate });
}

export function useClearConversation() {
  const invalidate = useInvalidate([['assistant']]);
  return useMutation({ mutationFn: () => api.delete('/ai/assistant/messages'), onSuccess: invalidate });
}

/** An evidence/reference `ref` ("invoice:<id>", "category:<id>", …) → the screen that shows it. */
export function refPath(ref) {
  if (!ref) return null;
  const [kind, id] = ref.split(/:(.*)/s);
  if (kind === 'invoice') return `/app/invoices?open=${id}`;
  if (kind === 'transaction') return `/app/transactions?open=${id}`;
  if (kind === 'category') return '/app/reports?tab=expenses';
  if (kind === 'forecast') return '/app/intelligence?tab=forecast';
  if (kind === 'period') {
    const [start, end] = (id ?? '').split('..');
    return start && end ? `/app/reports?period=custom&periodStart=${start}&periodEnd=${end}` : '/app/reports';
  }
  return null;
}
