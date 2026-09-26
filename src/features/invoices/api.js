import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api/client.js';

/*
 * Invoices and contacts (API_CONTRACT.md §9.3, §9.7). Totals, line totals
 * and the overdue status all come from the server. A payment creates a
 * transaction, so it refreshes every view that shows figures.
 */

const FIGURES = [['invoices'], ['invoice'], ['transactions'], ['accounts'], ['dashboard'], ['cash-flow'], ['notifications']];

function useInvalidate(keys) {
  const queryClient = useQueryClient();
  return () => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export function useContacts(query = {}) {
  return useQuery({
    queryKey: ['contacts', query],
    queryFn: async ({ signal }) => (await api.get('/companies/current/contacts', { query, signal })).data,
    placeholderData: keepPreviousData,
  });
}

export function useSaveContact() {
  const invalidate = useInvalidate([['contacts'], ['invoices'], ['invoice']]);
  return useMutation({
    mutationFn: ({ id, body }) => (id ? api.patch(`/contacts/${id}`, body) : api.post('/companies/current/contacts', body)),
    onSuccess: invalidate,
  });
}

export function useInvoices(query) {
  return useQuery({
    queryKey: ['invoices', query],
    queryFn: async ({ signal }) => api.get('/invoices', { query, signal }),
    placeholderData: keepPreviousData,
  });
}

/** One invoice with its line items. */
export function useInvoice(id) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async ({ signal }) => (await api.get(`/invoices/${id}`, { signal })).data,
    enabled: Boolean(id),
  });
}

export function useSaveInvoice() {
  const invalidate = useInvalidate(FIGURES);
  return useMutation({
    mutationFn: ({ id, body }) => (id ? api.patch(`/invoices/${id}`, body) : api.post('/invoices', body)),
    onSuccess: invalidate,
  });
}

export function useInvoiceStatus() {
  const invalidate = useInvalidate(FIGURES);
  return useMutation({ mutationFn: ({ id, status }) => api.post(`/invoices/${id}/status`, { status }), onSuccess: invalidate });
}

/**
 * Record a full payment. The Idempotency-Key makes a retried submission
 * (e.g. after a timeout) return the first result instead of paying twice.
 */
export function usePayInvoice() {
  const invalidate = useInvalidate(FIGURES);
  return useMutation({
    mutationFn: ({ id, body, idempotencyKey }) => api.post(`/invoices/${id}/payment`, body, { headers: { 'Idempotency-Key': idempotencyKey } }),
    onSuccess: invalidate,
  });
}

export function useDeleteInvoice() {
  const invalidate = useInvalidate(FIGURES);
  return useMutation({ mutationFn: (id) => api.delete(`/invoices/${id}`), onSuccess: invalidate });
}

/** A fresh idempotency key (browser crypto; no dependency). */
export function newIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `pay-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const CONTACT_TYPE_FOR = { receivable: 'customer', payable: 'vendor' };
export const STATUS_OPTIONS = ['draft', 'sent', 'overdue', 'paid', 'cancelled'];
