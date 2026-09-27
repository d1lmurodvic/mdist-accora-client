import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api/client.js';
import { PERIOD_PRESETS } from '../../components/ui/DateRangeSelector.jsx';

/*
 * Dashboard data (API_CONTRACT.md §9.4, §9.5). Every figure is read from the
 * API as-is; the client computes nothing.
 */

const PRESET_IDS = new Set(PERIOD_PRESETS.map((preset) => preset.id));
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** The selected period lives in the URL (?period=…), so it survives reloads and can be shared. */
export function usePeriodParam() {
  const [params, setParams] = useSearchParams();
  const period = params.get('period');
  const value = period === 'custom' && ISO.test(params.get('periodStart') ?? '') && ISO.test(params.get('periodEnd') ?? '')
    ? { period: 'custom', periodStart: params.get('periodStart'), periodEnd: params.get('periodEnd') }
    : { period: PRESET_IDS.has(period) ? period : 'this_month' };
  const setValue = (next) => {
    setParams((current) => {
      const search = new URLSearchParams(current);
      ['period', 'periodStart', 'periodEnd'].forEach((key) => search.delete(key));
      search.set('period', next.period);
      if (next.period === 'custom') { search.set('periodStart', next.periodStart); search.set('periodEnd', next.periodEnd); }
      return search;
    }, { replace: true });
  };
  return [value, setValue];
}

/** Owner-only: load the labelled demo dataset into an empty workspace. */
export function useLoadDemoData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => api.post('/companies/current/demo-data', {}),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
