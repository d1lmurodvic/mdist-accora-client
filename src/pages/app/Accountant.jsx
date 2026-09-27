import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Check, Pencil, Plus, UserRoundSearch } from 'lucide-react';
import { PageHeader } from '../../components/ui/Page.jsx';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Checkbox, Field, Input, Select, Textarea } from '../../components/ui/Field.jsx';
import { Alert, CardSkeleton, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { Modal } from '../../components/ui/Overlay.jsx';
import { MoneyValue, StatusBadge } from '../../components/finance/Finance.jsx';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { api } from '../../lib/api/client.js';
import { describeError } from '../../lib/api/errors.js';
import { formatDate, formatPeriod, formatRelativeTime } from '../../lib/format.js';
import { Figures } from '../../features/reports/parts.jsx';
import ledger from '../../features/ledger/Ledger.module.css';
import styles from '../../features/intelligence/Intelligence.module.css';

const TOPICS = [
  { id: 'bookkeeping', label: 'Bookkeeping' },
  { id: 'tax_preparation', label: 'Tax preparation' },
  { id: 'financial_statements', label: 'Financial statements' },
  { id: 'advisory', label: 'Advice' },
  { id: 'other', label: 'Something else' },
];
const STATUS_LABEL = { requested: 'Requested', in_contact: 'In contact', closed: 'Closed' };

const addDays = (iso, days) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * 86400000).toISOString().slice(0, 10);
};

function useRequests() {
  return useQuery({ queryKey: ['accountant', 'requests'], queryFn: async ({ signal }) => api.get('/accountants/requests', { signal }) });
}
function useShareScope() {
  return useQuery({ queryKey: ['accountant', 'scope'], queryFn: async ({ signal }) => api.get('/accountants/share-scope', { signal }), staleTime: 5 * 60_000 });
}
function useSaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => (id ? api.patch(`/accountants/requests/${id}`, body) : api.post('/accountants/requests', body)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accountant'] }),
  });
}

function ScopeList({ title, items, icon: Icon }) {
  return (
    <div>
      <p className={styles.meta}>{title}</p>
      <ul className={`${styles.thresholds} ${styles.scopeList}`}>{items.map((item) => <li key={item}><Icon size={13} aria-hidden="true" /><span>{item}</span></li>)}</ul>
    </div>
  );
}

/** Create or edit a request (while it is still `requested`). The period is optional; its end is inclusive here and exclusive in the API. */
function RequestForm({ request, onClose }) {
  const { user } = useAuth();
  const toast = useToast();
  const save = useSaveRequest();
  const [form, setForm] = useState(() => ({
    contactName: request?.contactName ?? user?.name ?? '',
    contactEmail: request?.contactEmail ?? user?.email ?? '',
    contactPhone: request?.contactPhone ?? '',
    topic: request?.topic ?? 'bookkeeping',
    description: request?.description ?? '',
    from: request?.periodStart ?? '',
    through: request?.periodEnd ? addDays(request.periodEnd, -1) : '',
    shareSummary: request?.shareSummary ?? false,
  }));
  const [touched, setTouched] = useState(false);
  const set = (key) => (e) => { const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e; setForm((c) => ({ ...c, [key]: value })); if (save.error) save.reset(); };
  const server = save.error?.fieldErrors?.() ?? {};
  const hasPeriod = Boolean(form.from && form.through);
  const periodError = (form.from || form.through) && !hasPeriod ? 'Choose both dates, or neither.'
    : hasPeriod && form.through < form.from ? 'Must be on or after the start date.' : undefined;
  const errors = {
    contactName: (touched && !form.contactName.trim() ? 'Enter your name.' : undefined) || server.contactName,
    contactEmail: (touched && !form.contactEmail.trim() ? 'Enter an email.' : undefined) || server.contactEmail,
    contactPhone: server.contactPhone,
    description: (touched && !form.description.trim() ? 'Describe what you need.' : undefined) || server.description,
    period: (touched ? periodError : undefined) || server.periodStart || server.periodEnd,
  };
  const general = save.error && !Object.values(errors).some(Boolean) ? describeError(save.error) : null;

  const submit = () => {
    setTouched(true);
    if (!form.contactName.trim() || !form.contactEmail.trim() || !form.description.trim() || periodError) return;
    const body = {
      contactName: form.contactName.trim(), contactEmail: form.contactEmail.trim(), contactPhone: form.contactPhone.trim() || null,
      topic: form.topic, description: form.description.trim(),
      periodStart: hasPeriod ? form.from : null, periodEnd: hasPeriod ? addDays(form.through, 1) : null,
      shareSummary: hasPeriod && form.shareSummary,
    };
    save.mutate({ id: request?.id, body }, {
      onSuccess: () => { toast.success(request ? 'Request updated' : 'Request recorded', 'Nobody is contacted automatically yet.'); onClose(); },
    });
  };

  return (
    <Modal
      open
      size="lg"
      onClose={save.isPending ? undefined : onClose}
      title={request ? 'Edit request' : 'Request an accountant'}
      description="Tell us what you need. Only what is listed under “What is shared” goes with it."
      footer={<><Button variant="secondary" onClick={onClose} disabled={save.isPending}>Cancel</Button><Button onClick={submit} loading={save.isPending}>{request ? 'Save changes' : 'Send request'}</Button></>}
    >
      <form className={ledger.form} onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        {general && <Alert tone="danger" title={general} />}
        <div className={ledger.grid2}>
          <Field label="Your name" required error={errors.contactName}>{(p) => <Input maxLength={200} value={form.contactName} onChange={set('contactName')} {...p} />}</Field>
          <Field label="Email" required error={errors.contactEmail}>{(p) => <Input type="email" maxLength={254} value={form.contactEmail} onChange={set('contactEmail')} {...p} />}</Field>
        </div>
        <div className={ledger.grid2}>
          <Field label="Phone" error={errors.contactPhone}>{(p) => <Input type="tel" maxLength={50} value={form.contactPhone} onChange={set('contactPhone')} {...p} />}</Field>
          <Field label="Topic" required>{(p) => <Select value={form.topic} onChange={set('topic')} {...p}>{TOPICS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</Select>}</Field>
        </div>
        <Field label="What do you need?" required error={errors.description}>{(p) => <Textarea rows={4} maxLength={2000} value={form.description} onChange={set('description')} {...p} />}</Field>
        <div className={ledger.grid2}>
          <Field label="Period from" error={errors.period}>{(p) => <Input type="date" value={form.from} onChange={set('from')} {...p} />}</Field>
          <Field label="Period to (inclusive)">{(p) => <Input type="date" min={form.from || undefined} value={form.through} onChange={set('through')} {...p} />}</Field>
        </div>
        <Checkbox
          label="Share a summary of this period (income, expenses and net result)"
          checked={hasPeriod && form.shareSummary}
          disabled={!hasPeriod}
          onChange={set('shareSummary')}
        />
      </form>
    </Modal>
  );
}

/**
 * Accountant connection (PRODUCT_REQUIREMENTS.md #23): a request, recorded
 * in Accora, with exactly what would be shared. No accountant network is
 * connected, and the page says so.
 */
export default function Accountant() {
  const requests = useRequests();
  const scope = useShareScope();
  const [editing, setEditing] = useState(null);
  const rows = requests.data?.data ?? [];
  const note = requests.data?.meta?.note ?? scope.data?.meta?.note;

  return (
    <>
      <PageHeader
        title="Accountant"
        description="Ask a human accountant for help with bookkeeping, tax preparation or statements."
        actions={<Button icon={Plus} onClick={() => setEditing('new')}>Request an accountant</Button>}
      />
      {note && <div className={styles.stack}><Alert tone="info" title="How requests work today">{note}</Alert></div>}
      <div className={`${styles.split} ${styles.spaced}`}>
        <div className={styles.stack}>
          {requests.isPending ? <CardSkeleton lines={4} />
            : requests.isError ? <Card><ErrorState error={requests.error} onRetry={() => requests.refetch()} /></Card>
              : rows.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={UserRoundSearch}
                    title="No requests yet"
                    description="Describe what you need; you choose whether a period summary goes with it."
                    action={<Button icon={Plus} onClick={() => setEditing('new')}>Request an accountant</Button>}
                  />
                </Card>
              ) : rows.map((r) => (
                <Card key={r.id} className={styles.item}>
                  <div className={styles.itemHead}>
                    <h3 className={styles.itemTitle}>{TOPICS.find((t) => t.id === r.topic)?.label ?? r.topic}</h3>
                    <StatusBadge status={r.status} label={STATUS_LABEL[r.status]} />
                  </div>
                  <p className={styles.body}>{r.description}</p>
                  <span className={styles.meta}>
                    {r.contactName} · {r.contactEmail}{r.contactPhone ? ` · ${r.contactPhone}` : ''} · sent {formatRelativeTime(r.createdAt)}
                    {r.periodStart ? ` · period ${formatPeriod({ start: r.periodStart, end: r.periodEnd })}` : ''}
                  </span>
                  {r.shareSummary && r.shareScope?.summary && (
                    <>
                      <p className={styles.meta}>Summary shared with this request ({formatDate(r.shareScope.summary.period.start)} – {formatDate(addDays(r.shareScope.summary.period.end, -1))}):</p>
                      <Figures
                        items={[
                          { label: 'Income', value: <MoneyValue money={r.shareScope.summary.income} size="sm" /> },
                          { label: 'Expenses', value: <MoneyValue money={r.shareScope.summary.expenses} size="sm" /> },
                          { label: 'Net result', value: <MoneyValue money={r.shareScope.summary.netResult} size="sm" semantic /> },
                        ]}
                      />
                    </>
                  )}
                  {r.status === 'requested' && <div className={styles.itemActions}><Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(r)}>Edit</Button></div>}
                </Card>
              ))}
        </div>
        <Card>
          <CardHeader title="What is shared" description="Nothing is shared automatically." />
          {scope.isPending ? <CardSkeleton lines={4} /> : scope.isError ? <ErrorState error={scope.error} compact onRetry={() => scope.refetch()} /> : (
            <div className={styles.stack}>
              <ScopeList title="Always, with a request" items={scope.data.data.alwaysIncluded} icon={Check} />
              <ScopeList title="Only if you choose to share a summary" items={scope.data.data.includedWhenShareSummary} icon={Check} />
              <ScopeList title="Never" items={scope.data.data.neverIncluded} icon={Ban} />
            </div>
          )}
        </Card>
      </div>
      {editing && <RequestForm request={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
