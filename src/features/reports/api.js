import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api/client.js';

/*
 * Financial statements and breakdowns (API_CONTRACT.md §9.5, §9.8). Every
 * figure, share, change and total comes from the financial engine; this
 * layer only fetches. Query keys start with the figure families that
 * ledger/invoice mutations already invalidate.
 */

function useReport(key, path, query, options = {}) {
  return useQuery({
    queryKey: [key, path, query],
    queryFn: async ({ signal }) => api.get(path, { query, signal }),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export const useOverview = (period) => useReport('dashboard', '/financials/overview', period);
export const useRevenueVsExpenses = (period, granularity) => useReport('dashboard', '/financials/revenue-vs-expenses', { ...period, granularity });
export const useProfitAndLoss = (period) => useReport('dashboard', '/reports/profit-and-loss', period);
export const useCashFlowStatement = (period) => useReport('cash-flow', '/reports/cash-flow-statement', period);
export const useExpenseReport = (period) => useReport('dashboard', '/reports/expense-report', period);
/** asOf: YYYY-MM-DD, or undefined for today (the server's default). */
export const useBalanceSheet = (asOf) => useReport('accounts', '/reports/balance-sheet', { asOf });

/** The running balance series for the cash flow chart (month buckets for periods over a year). */
export function useCashSeries(period) {
  return useQuery({
    queryKey: ['cash-flow', 'series', period],
    queryFn: async ({ signal }) => {
      try {
        return (await api.get('/financials/cash-flow', { query: { ...period, granularity: 'day' }, signal })).data;
      } catch (error) {
        if (error?.kind === 'unprocessable' || error?.kind === 'validation') {
          return (await api.get('/financials/cash-flow', { query: { ...period, granularity: 'month' }, signal })).data;
        }
        throw error;
      }
    },
    placeholderData: keepPreviousData,
  });
}
