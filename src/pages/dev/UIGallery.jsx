import { useState } from 'react';
import { Banknote, FileText, Plus, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { PageHeader, FilterBar } from '../../components/ui/Page.jsx';
import { Card, CardHeader, GlassCard, SectionHeader } from '../../components/ui/Card.jsx';
import { Button, IconButton } from '../../components/ui/Button.jsx';
import { Badge, Pill } from '../../components/ui/Badge.jsx';
import { Field, Input, Select, Switch, Textarea, Checkbox, Radio, SearchInput } from '../../components/ui/Field.jsx';
import { Tabs } from '../../components/ui/Menu.jsx';
import { DataTable, Pagination } from '../../components/ui/Table.jsx';
import { ConfirmDialog, Drawer, Modal } from '../../components/ui/Overlay.jsx';
import { CardSkeleton, EmptyState, ErrorState, Spinner } from '../../components/ui/Feedback.jsx';
import { DateRangeSelector } from '../../components/ui/DateRangeSelector.jsx';
import { CapabilityBadge, ConfidenceBadge, MoneyValue, PercentageValue, StatusBadge, TrendIndicator } from '../../components/finance/Finance.jsx';
import { StatCard } from '../../components/finance/StatCard.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { NetworkError } from '../../lib/api/errors.js';
import styles from './UIGallery.module.css';

/*
 * DEVELOPMENT ONLY (/dev/ui, excluded from production builds): renders every
 * foundation component for visual review. The values below are formatting
 * samples for the gallery, never shown in the product.
 */
const sample = (amount) => ({ amount, currency: 'UZS' });
const ROWS = [
  { id: 'r1', label: 'Sample row A', status: 'paid', amount: sample(1250000), date: '2026-03-14' },
  { id: 'r2', label: 'Sample row B', status: 'overdue', amount: sample(-480000), date: '2026-03-02' },
  { id: 'r3', label: 'Sample row C', status: 'draft', amount: sample(90000), date: '2026-02-27' },
];

export default function UIGallery() {
  const toast = useToast();
  const [tab, setTab] = useState('components');
  const [period, setPeriod] = useState({ period: 'this_month' });
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [on, setOn] = useState(true);
  const [selected, setSelected] = useState([]);
  const [sort, setSort] = useState({ field: 'date', direction: 'desc' });

  return (
    <>
      <PageHeader
        eyebrow="Development"
        title="Component gallery"
        description="Every foundation component in one place. Values are formatting samples only."
        actions={<><DateRangeSelector value={period} onChange={setPeriod} /><Button icon={Plus}>Primary action</Button></>}
      />

      <GlassCard size="hero" padding="lg" className={styles.hero}>
        <div className={styles.heroText}>
          <Badge tone="primary">Glass hero surface</Badge>
          <h2 className={styles.heroTitle}>Your company&apos;s financial command center</h2>
          <p className={styles.muted}>Translucent surfaces are reserved for hero areas, navigation and overlays. Data stays on solid cards.</p>
        </div>
        <div className={styles.heroStat}>
          <span className={styles.muted}>Formatting sample</span>
          <MoneyValue money={sample(184250000)} size="xl" />
          <TrendIndicator basisPoints={1240} label="vs previous period" />
        </div>
      </GlassCard>

      <div className={styles.grid4}>
        <StatCard label="Cash" icon={Wallet} money={sample(84250000)} change={-320} goodWhen="up" to="/dev/ui" />
        <StatCard label="Income" icon={TrendingUp} money={sample(32000000)} change={1106} goodWhen="up" to="/dev/ui" />
        <StatCard label="Expenses" icon={Banknote} money={sample(30620000)} change={2053} goodWhen="down" to="/dev/ui" />
        <StatCard label="Receivables" icon={FileText} loading />
      </div>

      <div className={styles.section}>
        <Tabs value={tab} onChange={setTab} tabs={[{ id: 'components', label: 'Components' }, { id: 'states', label: 'States' }, { id: 'finance', label: 'Financial', count: 6 }]} />
      </div>

      {tab === 'components' && (
        <div className={styles.grid2}>
          <Card>
            <CardHeader title="Buttons" description="Hierarchy, sizes and states." />
            <div className={styles.row}>
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="glass">Glass</Button>
              <Button variant="danger" icon={Trash2}>Delete</Button>
              <Button loading>Saving</Button>
              <Button size="sm" variant="secondary">Small</Button>
              <IconButton icon={Plus} label="Add" variant="secondary" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Inputs" />
            <div className={styles.stack}>
              <Field label="Company name" hint="As it appears on invoices." required>{(p) => <Input placeholder="Acme LLC" {...p} />}</Field>
              <Field label="Email" error="Must be a valid email address.">{(p) => <Input defaultValue="not-an-email" {...p} />}</Field>
              <Field label="Currency">{(p) => <Select {...p}><option>UZS</option><option>USD</option></Select>}</Field>
              <Field label="Notes">{(p) => <Textarea rows={3} {...p} />}</Field>
              <SearchInput value={search} onChange={setSearch} placeholder="Search transactions" />
              <div className={styles.row}><Checkbox label="Include uncategorized" defaultChecked /><Radio name="r" label="Income" defaultChecked /><Radio name="r" label="Expense" /></div>
              <Switch label="Overdue invoice alerts" description="In-app notifications" checked={on} onChange={setOn} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Overlays & feedback" />
            <div className={styles.row}>
              <Button variant="secondary" onClick={() => setModal(true)}>Modal</Button>
              <Button variant="secondary" onClick={() => setDrawer(true)}>Drawer</Button>
              <Button variant="secondary" onClick={() => setConfirm(true)}>Confirm dialog</Button>
              <Button variant="secondary" onClick={() => toast.success('Saved', 'Your changes were saved.')}>Toast success</Button>
              <Button variant="secondary" onClick={() => toast.error('Could not save', 'Please try again.')}>Toast error</Button>
              <Button variant="secondary" onClick={() => toast.warning('Check the period')}>Toast warning</Button>
            </div>
          </Card>
          <Card>
            <CardHeader title="Badges & pills" />
            <div className={styles.row}>
              {['neutral', 'primary', 'success', 'warning', 'danger', 'info'].map((tone) => <Badge key={tone} tone={tone} dot>{tone}</Badge>)}
            </div>
            <div className={`${styles.row} ${styles.top}`}>
              <Pill selected>All</Pill><Pill>Income</Pill><Pill>Expense</Pill>
            </div>
          </Card>
        </div>
      )}

      {tab === 'states' && (
        <div className={styles.grid2}>
          <Card><EmptyState title="No transactions yet" description="Record your first income or expense to see it here." action={<Button icon={Plus}>Add transaction</Button>} /></Card>
          <Card><ErrorState error={new NetworkError('Could not reach the IFRSmart server.')} onRetry={() => {}} /></Card>
          <CardSkeleton />
          <Card><div className={styles.center}><Spinner size={28} /></div></Card>
        </div>
      )}

      {tab === 'finance' && (
        <Card>
          <CardHeader title="Financial primitives" description="Formatting only — values come from the API." />
          <div className={styles.stack}>
            <div className={styles.row}><MoneyValue money={sample(12500000)} /><MoneyValue money={sample(-2549000)} semantic /><MoneyValue money={null} /><MoneyValue money={{ amount: 125000, currency: 'USD' }} /></div>
            <div className={styles.row}><PercentageValue basisPoints={1800} /><TrendIndicator basisPoints={3965} goodWhen="down" /><TrendIndicator basisPoints={-1106} /><TrendIndicator basisPoints={null} /></div>
            <div className={styles.row}>{['paid', 'sent', 'overdue', 'draft', 'needs_review', 'insufficient_data'].map((s) => <StatusBadge key={s} status={s} />)}</div>
            <div className={styles.row}>
              <CapabilityBadge capability={{ method: 'rule', confidence: null, degraded: true, note: 'Narrative generation unavailable: no AI provider is configured.' }} />
              <CapabilityBadge capability={{ method: 'statistics', confidence: 0.45, degraded: false }} />
              <CapabilityBadge capability={{ method: 'unavailable', degraded: true }} />
              <ConfidenceBadge confidence={0.93} />
            </div>
          </div>
        </Card>
      )}

      <div className={styles.section}>
        <SectionHeader title="Table" description="Server-sorted, paginated; stacked cards on mobile." />
        <FilterBar end={<Button variant="secondary" size="sm">Export</Button>}>
          <SearchInput value={search} onChange={setSearch} />
          <Pill selected>All</Pill><Pill>Paid</Pill>
        </FilterBar>
        <DataTable
          caption="Sample rows"
          columns={[
            { key: 'label', header: 'Name', primary: true, sortable: true },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            { key: 'date', header: 'Date', sortable: true },
            { key: 'amount', header: 'Amount', align: 'end', render: (row) => <MoneyValue money={row.amount} size="sm" semantic /> },
          ]}
          rows={ROWS}
          sort={sort}
          onSortChange={setSort}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
        />
        <Pagination meta={{ page: 1, totalPages: 3, total: 57, hasNext: true, hasPrevious: false }} onPageChange={() => {}} />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Modal title" description="A focused task." footer={<><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={() => setModal(false)}>Save</Button></>}>
        <Field label="Name">{(p) => <Input {...p} />}</Field>
      </Modal>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Drawer" description="Contextual details.">
        <p className={styles.muted}>Side panel on desktop, bottom sheet on mobile.</p>
      </Drawer>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => { setConfirm(false); toast.info('Confirmed'); }} destructive title="Delete this record?" description="This cannot be undone." confirmLabel="Delete" />
    </>
  );
}
