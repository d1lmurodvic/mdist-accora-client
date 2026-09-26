import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, FileScan, Info } from 'lucide-react';
import { PageHeader } from '../../components/ui/Page.jsx';
import { Pill } from '../../components/ui/Badge.jsx';
import { Select } from '../../components/ui/Field.jsx';
import { DataTable, Pagination } from '../../components/ui/Table.jsx';
import { EmptyState } from '../../components/ui/Feedback.jsx';
import { api } from '../../lib/api/client.js';
import { formatDate, formatRelativeTime } from '../../lib/format.js';
import { UploadZone } from '../../features/documents/UploadZone.jsx';
import { DocumentStatus } from '../../features/documents/Review.jsx';
import { FILTER_LABEL, formatBytes, useDocuments } from '../../features/documents/api.js';
import ledger from '../../features/ledger/Ledger.module.css';
import styles from '../../features/documents/Documents.module.css';

const SORTS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'sizeBytes:desc', label: 'Largest first' },
  { value: 'sizeBytes:asc', label: 'Smallest first' },
];
const TYPE_LABEL = { 'application/pdf': 'PDF', 'image/jpeg': 'JPEG', 'image/png': 'PNG', 'image/webp': 'WebP', 'image/gif': 'GIF', 'image/heic': 'HEIC' };

/** Whether the server can read documents right now (GET /ai/capabilities) — stated, never assumed. */
function useReaderCapability() {
  return useQuery({
    queryKey: ['ai-capabilities'],
    queryFn: async ({ signal }) => (await api.get('/ai/capabilities', { signal })).data,
    staleTime: 5 * 60_000,
    select: (data) => data?.capabilities?.find((c) => c.id === 'document_extraction') ?? null,
  });
}


/**
 * AI invoice & receipt reader (PRODUCT_REQUIREMENTS.md #10): upload, see what
 * was read, and turn a document into a transaction or a draft invoice only
 * after reviewing it.
 */
export default function Documents() {
  const navigate = useNavigate();
  const reader = useReaderCapability();
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [status, sort]);
  const list = useDocuments({ page, limit: 20, sort, status: status ? [status] : undefined });
  const rows = list.data?.data ?? [];

  const columns = [
    {
      key: 'name', header: 'Document', primary: true,
      render: (d) => (
        <span className={ledger.cellMain}>
          <span className={ledger.cellTitle}>{d.originalFilename ?? 'Untitled document'}</span>
          <span className={ledger.cellSub}>{TYPE_LABEL[d.mimeType] ?? d.mimeType} · {formatBytes(d.sizeBytes)}</span>
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (d) => <DocumentStatus document={d} /> },
    { key: 'createdAt', header: 'Uploaded', render: (d) => <span className={ledger.nowrap} title={formatDate(d.createdAt.slice(0, 10))}>{formatRelativeTime(d.createdAt)}</span> },
    { key: 'open', header: '', align: 'end', width: 40, render: () => <ChevronRight size={16} aria-hidden="true" className={ledger.muted} /> },
  ];

  return (
    <>
      <PageHeader
        title="Documents"
        description="Upload invoices and receipts, check what was read, and record them. Nothing is recorded until you confirm."
      />
      <UploadZone />
      {reader.data && !reader.data.available && (
        <p className={styles.capabilityNote} role="note">
          <Info size={16} aria-hidden="true" />
          <span>{reader.data.note ?? 'Automated reading is not available.'} Uploads are still kept, and you record each one from its page.</span>
        </p>
      )}
      {!(reader.data && !reader.data.available) && <div className={styles.capabilityGap} />}

      <div className={ledger.toolbar}>
        <div className={`${ledger.filters} ${ledger.flush}`} role="group" aria-label="Status">
          <Pill selected={!status} onClick={() => setStatus('')}>All</Pill>
          {['processing', 'ready', 'failed'].map((s) => <Pill key={s} selected={status === s} onClick={() => setStatus(s)}>{FILTER_LABEL[s]}</Pill>)}
        </div>
        <Select className={ledger.filterSelect} aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
      </div>
      <DataTable
        caption="Documents"
        columns={columns}
        rows={rows}
        loading={list.isPending}
        error={list.isError ? list.error : null}
        onRetry={() => list.refetch()}
        onRowClick={(d) => navigate(`/app/documents/${d.id}`)}
        empty={status
          ? <EmptyState title="No documents match this filter" compact />
          : <EmptyState icon={FileScan} title="No documents yet" description="Upload an invoice or a receipt above. You review every value before it becomes a transaction or an invoice." />}
      />
      <Pagination meta={list.data?.meta} onPageChange={setPage} />
      <p className={`${ledger.muted} ${ledger.note}`}>Files are private to your company and downloaded only through your session. A recorded document cannot be deleted.</p>
    </>
  );
}
