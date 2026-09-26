import { useEffect, useMemo, useState } from 'react';
import { Landmark, Plus, Receipt, Tags } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge, Pill } from '../../components/ui/Badge.jsx';
import { Field, Select, SearchInput } from '../../components/ui/Field.jsx';
import { DataTable, Pagination } from '../../components/ui/Table.jsx';
import { EmptyState } from '../../components/ui/Feedback.jsx';
import { Modal } from '../../components/ui/Overlay.jsx';
import { DateRangeSelector } from '../../components/ui/DateRangeSelector.jsx';
import { MoneyValue, StatusBadge } from '../../components/finance/Finance.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { describeError } from '../../lib/api/errors.js';
import { formatDate } from '../../lib/format.js';
import { categoryIndex, useBulkCategorize, useTransactions, useTransaction } from './api.js';
import { CategorySelect } from './inputs.jsx';
import { TransactionDrawer } from './TransactionDrawer.jsx';
import styles from './Ledger.module.css';

const PAGE_SIZE = 20;

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * The ledger list (GET /transactions): server-side filters, sort and
 * pagination; a row opens its details; selected rows can be categorized
 * together (POST /transactions/bulk-categorize).
 */
/**
 * `initialFilters` ({ type, categoryId, from, to }) comes from a drill-down
 * link (e.g. a report line): the list opens filtered exactly as the figure.
 */
export function TransactionsPanel({ accounts, categories, onRecord, onEdit, onGoToAccounts, canManage, openId, onOpened, initialFilters = {} }) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [type, setType] = useState(initialFilters.type ?? '');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState(initialFilters.categoryId ?? '');
  const [reviewStatus, setReviewStatus] = useState('');
  const [period, setPeriod] = useState(() => (initialFilters.from && initialFilters.to
    ? { period: 'custom', periodStart: initialFilters.from, periodEnd: initialFilters.to }
    : { period: 'all' }));
  const [sort, setSort] = useState({ field: 'date', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [open, setOpen] = useState(null);
  // A link to one transaction (?open=<id>) opens its details once it has loaded.
  const linked = useTransaction(openId);
  useEffect(() => {
    if (!openId || (!linked.data && !linked.isError)) return;
    if (linked.data) setOpen(linked.data);
    onOpened?.();
  }, [openId, linked.data, linked.isError, onOpened]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const bulk = useBulkCategorize();
  const { label: categoryLabel } = useMemo(() => categoryIndex(categories), [categories]);

  const query = {
    page, limit: PAGE_SIZE, sort: `${sort.field}:${sort.direction}`,
    q: q.trim() || undefined, type: type || undefined, accountId: accountId || undefined,
    categoryId: categoryId ? [categoryId] : undefined, reviewStatus: reviewStatus || undefined,
    ...(period.period === 'all' ? {} : period),
  };
  const list = useTransactions(query);
  const rows = list.data?.data ?? [];
  const filtered = Boolean(q.trim() || type || accountId || categoryId || reviewStatus || period.period !== 'all');

  // A new filter starts from the first page and a fresh selection.
  useEffect(() => { setPage(1); setSelected([]); }, [q, type, accountId, categoryId, reviewStatus, period, sort]);
  const accountName = (id) => accounts.find((account) => account.id === id)?.name ?? '—';

  const columns = [
    { key: 'date', header: 'Date', sortable: true, width: 120, render: (row) => <span className={styles.nowrap}>{formatDate(row.date)}</span> },
    {
      key: 'counterparty', header: 'Payee / description', primary: true,
      render: (row) => (
        <span className={styles.cellMain}>
          <span className={styles.cellTitle}>{row.payee ?? row.description ?? 'No description'}</span>
          {row.payee && row.description && <span className={styles.cellSub}>{row.description}</span>}
        </span>
      ),
    },
    {
      key: 'category', header: 'Category',
      render: (row) => (
        <span className={styles.cellMain}>
          <span>{categoryLabel(row.categoryId)}</span>
          <span className={styles.cellBadges}>
            {row.categorization.reviewStatus === 'needs_review' && <StatusBadge status="needs_review" />}
            {row.source === 'document' && <Badge tone="info">Document</Badge>}
            {row.invoiceId && <Badge tone="info">Invoice</Badge>}
          </span>
        </span>
      ),
    },
    { key: 'account', header: 'Account', render: (row) => accountName(row.accountId) },
    {
      key: 'amount', header: 'Amount', sortable: true, align: 'end',
      render: (row) => (
        <span className={row.type === 'income' ? styles.income : undefined}>
          <span aria-hidden="true">{row.type === 'income' ? '+ ' : '− '}</span>
          <span className="sr-only">{row.type === 'income' ? 'Income ' : 'Expense '}</span>
          <MoneyValue money={row.amount} size="sm" />
        </span>
      ),
    },
  ];

  const hasPostingAccount = accounts.some((account) => account.acceptsTransactions);
  let empty;
  if (!hasPostingAccount) {
    empty = (
      <EmptyState
        icon={Landmark}
        title="Add a cash or bank account first"
        description="Every transaction belongs to an account, so its balance and your cash position stay correct."
        action={canManage ? <Button icon={Plus} onClick={onGoToAccounts}>Add an account</Button> : <span className={styles.muted}>Ask the company owner to add one.</span>}
      />
    );
  } else if (!filtered) {
    empty = <EmptyState icon={Receipt} title="No transactions yet" description="Record income and expenses to see them here and in every report." action={<Button icon={Plus} onClick={onRecord}>Record a transaction</Button>} />;
  } else {
    empty = <EmptyState title="No transactions match these filters" description="Try another period, or clear the search." compact />;
  }

  const applyBulk = () => bulk.mutate({ transactionIds: selected, categoryId: bulkCategory }, {
    onSuccess: (response) => {
      const { updated, results } = response.data;
      const skipped = results.length - updated;
      toast.success(`${updated} transaction${updated === 1 ? '' : 's'} categorized`, skipped ? `${skipped} could not take this category (different type or not found).` : undefined);
      setBulkOpen(false);
      setSelected([]);
    },
    onError: (error) => toast.error('Could not categorize', describeError(error)),
  });

  return (
    <>
      <div className={styles.filters}>
        <SearchInput className={styles.search} value={search} onChange={setSearch} placeholder="Search payee, description, notes" />
        <DateRangeSelector value={period} onChange={setPeriod} allowAll />
        <Pill selected={!type} onClick={() => setType('')}>All</Pill>
        <Pill selected={type === 'income'} onClick={() => setType('income')}>Income</Pill>
        <Pill selected={type === 'expense'} onClick={() => setType('expense')}>Expenses</Pill>
        <Select className={styles.filterSelect} aria-label="Account" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          <option value="">All accounts</option>
          {accounts.filter((a) => a.acceptsTransactions).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
        <CategorySelect className={styles.filterSelect} aria-label="Category" categories={categories} includeEmpty emptyLabel="All categories" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
        <Select className={styles.filterSelect} aria-label="Review status" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
          <option value="">Any review status</option>
          <option value="needs_review">Needs review</option>
          <option value="confirmed">Confirmed</option>
        </Select>
      </div>

      <DataTable
        caption="Transactions"
        columns={columns}
        rows={rows}
        loading={list.isPending}
        error={list.isError ? list.error : null}
        onRetry={() => list.refetch()}
        empty={empty}
        sort={sort}
        onSortChange={setSort}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        onRowClick={setOpen}
      />
      <Pagination meta={list.data?.meta} onPageChange={setPage} />

      {selected.length > 0 && (
        <div className={styles.bulkBar} role="region" aria-label="Selection">
          <span>{selected.length} selected</span>
          <div className={styles.bulkActions}>
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>Clear</Button>
            <Button size="sm" icon={Tags} onClick={() => { setBulkCategory(''); setBulkOpen(true); }}>Categorize</Button>
          </div>
        </div>
      )}

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        size="sm"
        title={`Categorize ${selected.length} transaction${selected.length === 1 ? '' : 's'}`}
        description="Transactions whose type does not match the category are left unchanged and reported."
        footer={<><Button variant="secondary" onClick={() => setBulkOpen(false)}>Cancel</Button><Button onClick={applyBulk} disabled={!bulkCategory} loading={bulk.isPending}>Apply category</Button></>}
      >
        <Field label="Category">{(props) => <CategorySelect categories={categories} includeEmpty value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} {...props} />}</Field>
      </Modal>

      {open && (
        <TransactionDrawer
          transaction={rows.find((row) => row.id === open.id) ?? open}
          accounts={accounts}
          categoryLabel={categoryLabel}
          onClose={() => setOpen(null)}
          onEdit={(transaction) => { setOpen(null); onEdit(transaction); }}
        />
      )}
    </>
  );
}
