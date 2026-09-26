import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api/client.js';

/*
 * Ledger data (API_CONTRACT.md §9.3, §9.6): accounts, categories, category
 * rules and transactions. Any change to the ledger invalidates every view
 * that shows figures, so the dashboard and reports are never stale.
 */

const FIGURES = [['transactions'], ['transaction'], ['accounts'], ['dashboard'], ['cash-flow'], ['notifications']];

function useInvalidate(keys) {
  const queryClient = useQueryClient();
  return () => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: async ({ signal }) => (await api.get('/companies/current/accounts', { signal })).data });
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: async ({ signal }) => (await api.get('/companies/current/categories', { signal })).data, staleTime: 60_000 });
}

export function useRules() {
  return useQuery({ queryKey: ['rules'], queryFn: async ({ signal }) => (await api.get('/companies/current/category-rules', { signal })).data });
}

/** One transaction (e.g. opened by link: /app/transactions?open=<id>). */
export function useTransaction(id) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async ({ signal }) => (await api.get(`/transactions/${id}`, { signal })).data,
    enabled: Boolean(id),
    retry: false,
  });
}

export function useTransactions(query) {
  return useQuery({
    queryKey: ['transactions', query],
    queryFn: async ({ signal }) => api.get('/transactions', { query, signal }),
    placeholderData: keepPreviousData,
  });
}

/** The categorizer's proposal for a payee/description (rules and learned corrections). */
export function useCategorySuggestion({ type, payee, description }) {
  const enabled = Boolean(type && (payee?.trim() || description?.trim()));
  return useQuery({
    queryKey: ['category-suggestion', type, payee?.trim() ?? '', description?.trim() ?? ''],
    queryFn: async ({ signal }) => api.get('/transactions/categories-suggestion', {
      query: { type, payee: payee?.trim() || undefined, description: description?.trim() || undefined }, signal,
    }),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateTransaction() {
  const invalidate = useInvalidate(FIGURES);
  return useMutation({ mutationFn: (body) => api.post('/transactions', body), onSuccess: invalidate });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidate([...FIGURES, ['rules']]);
  return useMutation({ mutationFn: ({ id, changes }) => api.patch(`/transactions/${id}`, changes), onSuccess: invalidate });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidate(FIGURES);
  return useMutation({ mutationFn: (id) => api.delete(`/transactions/${id}`), onSuccess: invalidate });
}

export function useBulkCategorize() {
  const invalidate = useInvalidate(FIGURES);
  return useMutation({ mutationFn: (body) => api.post('/transactions/bulk-categorize', body), onSuccess: invalidate });
}

export function useSaveAccount() {
  const invalidate = useInvalidate(FIGURES);
  return useMutation({
    mutationFn: ({ id, body }) => (id ? api.patch(`/accounts/${id}`, body) : api.post('/companies/current/accounts', body)),
    onSuccess: invalidate,
  });
}

export function useSaveCategory() {
  const invalidate = useInvalidate([['categories'], ['transactions'], ['dashboard']]);
  return useMutation({
    mutationFn: ({ id, body }) => (id ? api.patch(`/categories/${id}`, body) : api.post('/companies/current/categories', body)),
    onSuccess: invalidate,
  });
}

export function useCreateRule() {
  const invalidate = useInvalidate([['rules'], ['category-suggestion']]);
  return useMutation({ mutationFn: (body) => api.post('/companies/current/category-rules', body), onSuccess: invalidate });
}

export function useDeleteRule() {
  const invalidate = useInvalidate([['rules'], ['category-suggestion']]);
  return useMutation({ mutationFn: (id) => api.delete(`/category-rules/${id}`), onSuccess: invalidate });
}

/** Category lookup and the display order the API returns (system, income, expense; parents then children). */
export function categoryIndex(categories = []) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const label = (id) => {
    const category = byId.get(id);
    if (!category) return 'Unknown category';
    const parent = category.parentId ? byId.get(category.parentId) : null;
    return parent ? `${parent.name} › ${category.name}` : category.name;
  };
  return { byId, label, uncategorized: categories.find((category) => category.isSystem) ?? null };
}

/** The caller's company (currency, fiscal year start, demo flag). */
export function useCompany() {
  return useQuery({ queryKey: ['company'], queryFn: async ({ signal }) => (await api.get('/companies/current', { signal })).data, staleTime: 5 * 60_000 });
}
