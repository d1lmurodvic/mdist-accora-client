import { useEffect, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge, Pill } from '../../components/ui/Badge.jsx';
import { Select, SearchInput } from '../../components/ui/Field.jsx';
import { DataTable, Pagination } from '../../components/ui/Table.jsx';
import { EmptyState } from '../../components/ui/Feedback.jsx';
import { DateRangeSelector } from '../../components/ui/DateRangeSelector.jsx';
import { MoneyValue, StatusBadge } from '../../components/finance/Finance.jsx';
import { formatDate } from '../../lib/format.js';
import { STATUS_OPTIONS, useContacts, useInvoices } from './api.js';
import ledger from '../ledger/Ledger.module.css';
import styles from './Invoices.module.css';

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

const STATUS_LABEL = { draft: 'Draft', sent: 'Sent', overdue: 'Overdue', paid: 'Paid', cancelled: 'Cancelled' };

/** GET /invoices: server-side status, type, contact, issue-date and number filters; sort; pagination. */
export function InvoicesPanel({ onOpen, onCreate }) {
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [contactId, setContactId] = useState('');
  const [period, setPeriod] = useState({ period: 'all' });
  const [sort, setSort] = useState({ field: 'issueDate', direction: 'desc' });
  const [page, setPage] = useState(1);
  const contacts = useContacts();

  useEffect(() => { setPage(1); }, [q, status, type, contactId, period, sort]);
  const query = {
    page, limit: 20, sort: `${sort.field}:${sort.direction}`, q: q.trim() || undefined,
    status: status ? [status] : undefined, type: type || undefined, contactId: contactId || undefined,
    ...(period.period === 'all' ? {} : period),
  };
  const list = useInvoices(query);
  const rows = list.data?.data ?? [];
  const filtered = Boolean(q.trim() || status || type || contactId || period.period !== 'all');

  const columns = [
    {
      key: 'number', header: 'Invoice', sortable: true, primary: true,
      render: (row) => (
        <span className={ledger.cellMain}>
          <span className={ledger.cellTitle}>{row.number}</span>
          <span className={ledger.cellSub}>{row.contact.name}</span>
        </span>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => <Badge tone={row.type === 'receivable' ? 'success' : 'neutral'}>{row.type === 'receivable' ? 'Receivable' : 'Payable'}</Badge> },
    { key: 'issueDate', header: 'Issued', sortable: true, render: (row) => <span className={ledger.nowrap}>{formatDate(row.issueDate)}</span> },
    { key: 'dueDate', header: 'Due', sortable: true, render: (row) => <span className={`${ledger.nowrap} ${row.status === 'overdue' ? styles.overdue : ''}`}>{formatDate(row.dueDate)}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'total', header: 'Total', sortable: true, align: 'end', render: (row) => <MoneyValue money={row.total} size="sm" /> },
  ];

  return (
    <>
      <div className={ledger.filters}>
        <SearchInput className={ledger.search} value={search} onChange={setSearch} placeholder="Search by invoice number" />
        <DateRangeSelector value={period} onChange={setPeriod} allowAll />
        <Select className={ledger.filterSelect} aria-label="Type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Receivable and payable</option>
          <option value="receivable">Receivable (you bill)</option>
          <option value="payable">Payable (you owe)</option>
        </Select>
        <Select className={ledger.filterSelect} aria-label="Contact" value={contactId} onChange={(e) => setContactId(e.target.value)}>
          <option value="">All contacts</option>
          {(contacts.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
      <div className={ledger.filters} role="group" aria-label="Status">
        <Pill selected={!status} onClick={() => setStatus('')}>All</Pill>
        {STATUS_OPTIONS.map((s) => <Pill key={s} selected={status === s} onClick={() => setStatus(s)}>{STATUS_LABEL[s]}</Pill>)}
      </div>
      <DataTable
        caption="Invoices"
        columns={columns}
        rows={rows}
        loading={list.isPending}
        error={list.isError ? list.error : null}
        onRetry={() => list.refetch()}
        sort={sort}
        onSortChange={setSort}
        onRowClick={(row) => onOpen(row.id)}
        empty={filtered
          ? <EmptyState title="No invoices match these filters" compact />
          : <EmptyState icon={FileText} title="No invoices yet" description="Bill a customer, or record a bill from a vendor. Unpaid invoices appear on your dashboard; they count as income or expense only when paid." action={<Button icon={Plus} onClick={onCreate}>New invoice</Button>} />}
      />
      <Pagination meta={list.data?.meta} onPageChange={setPage} />
      <p className={`${ledger.muted} ${ledger.note}`}>Overdue means sent and past its due date — it is worked out by IFRSmart, never set by hand.</p>
    </>
  );
}
