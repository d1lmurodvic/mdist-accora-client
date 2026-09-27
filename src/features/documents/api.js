import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api/client.js';

/*
 * Documents and the invoice/receipt reader (API_CONTRACT.md §9.7). Reading
 * never records anything: only confirming the reviewed values creates a
 * transaction or a draft invoice, so only confirmation refreshes figures.
 */

/** Upload limits from API_CONTRACT.md §9.7 — checked here only to fail fast; the server decides. */
export const MAX_UPLOAD_BYTES = 10_485_760;
export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
export const ACCEPT_ATTRIBUTE = '.pdf,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,application/pdf,image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif';
const ACCEPTED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];

/** A reason not to send the file, or null. */
export function precheckFile(file) {
  if (file.size === 0) return 'The file is empty.';
  if (file.size > MAX_UPLOAD_BYTES) return 'The file is larger than 10 MB.';
  const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
  if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(extension)) return 'Upload a PDF or an image (JPEG, PNG, WebP, GIF or HEIC).';
  return null;
}

const RECORDS = [['documents'], ['document'], ['transactions'], ['transaction'], ['accounts'], ['invoices'], ['invoice'], ['contacts'], ['dashboard'], ['cash-flow'], ['notifications']];

function useInvalidate(keys) {
  const queryClient = useQueryClient();
  return () => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

/** Whether the server can read documents right now (GET /ai/capabilities) — stated, never assumed. */
export function useReaderCapability() {
  return useQuery({
    queryKey: ['ai-capabilities'],
    queryFn: async ({ signal }) => (await api.get('/ai/capabilities', { signal })).data,
    staleTime: 5 * 60_000,
    select: (data) => data?.capabilities?.find((c) => c.id === 'document_extraction') ?? null,
  });
}

/** GET /documents (without extraction). Polls while any listed document is still being read. */
export function useDocuments(query) {
  return useQuery({
    queryKey: ['documents', query],
    queryFn: async ({ signal }) => api.get('/documents', { query, signal }),
    placeholderData: keepPreviousData,
    refetchInterval: (q) => (q.state.data?.data?.some((d) => d.status === 'processing') ? 2000 : false),
  });
}

/** One document with its latest extraction and meta.capability. Polls while processing. */
export function useDocument(id) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: async ({ signal }) => api.get(`/documents/${id}`, { signal }),
    enabled: Boolean(id),
    refetchInterval: (q) => (q.state.data?.data?.status === 'processing' ? 1500 : false),
  });
}

/** The stored file as a Blob (authorised; there is no public URL). */
export function useDocumentFile(id, enabled = true) {
  return useQuery({
    queryKey: ['document-file', id],
    queryFn: async ({ signal }) => (await api.blob(`/documents/${id}/file`, { signal })).data,
    enabled: Boolean(id) && enabled,
    staleTime: Infinity,
    gcTime: 60_000,
    retry: false,
  });
}

export function useUploadDocument() {
  const invalidate = useInvalidate([['documents'], ['dashboard'], ['notifications']]);
  return useMutation({
    mutationFn: (file) => {
      const body = new FormData();
      body.append('file', file, file.name);
      return api.upload('/documents', body);
    },
    onSuccess: invalidate,
  });
}

export function useExtractDocument() {
  const invalidate = useInvalidate([['documents'], ['document']]);
  return useMutation({ mutationFn: (id) => api.post(`/documents/${id}/extract`), onSuccess: invalidate });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/documents/${id}`),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['document', id] });
      queryClient.removeQueries({ queryKey: ['document-file', id] });
      return queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

/**
 * Confirmation, shaped like the ledger/invoice mutations so the same forms can
 * send it: the transaction form calls mutate(body), the invoice form mutate({ body }).
 */
export function useConfirmAsTransaction(id) {
  const invalidate = useInvalidate(RECORDS);
  return useMutation({
    mutationFn: (transaction) => api.post(`/documents/${id}/confirm`, { target: 'transaction', transaction }),
    onSuccess: invalidate,
  });
}

export function useConfirmAsInvoice(id) {
  const invalidate = useInvalidate(RECORDS);
  return useMutation({
    mutationFn: ({ body }) => api.post(`/documents/${id}/confirm`, { target: 'invoice', invoice: body }),
    onSuccess: invalidate,
  });
}

/** Badge text for a document not yet recorded. */
export const STATUS_LABEL = { processing: 'Reading', ready: 'Ready to review', failed: 'Needs manual entry' };
/** Filter text: the server filters on the reading status, recorded or not. */
export const FILTER_LABEL = { processing: 'Reading', ready: 'Read', failed: 'Not read' };
export const FAILURE_LABEL = {
  ai_unavailable: 'Automated reading is not available',
  provider_error: 'The reader service returned an error',
  invalid_provider_response: 'The reader returned an unusable result',
  unreadable: 'The document could not be read',
  timeout: 'Reading took too long and was stopped',
  interrupted: 'Reading was interrupted by a server restart',
  internal_error: 'Reading failed unexpectedly',
};

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
