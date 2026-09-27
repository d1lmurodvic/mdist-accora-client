import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, EyeOff, Lightbulb, RefreshCw, ScanSearch, ShieldCheck, X } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge, Pill } from '../../components/ui/Badge.jsx';
import { Checkbox, Field, Textarea } from '../../components/ui/Field.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { Modal } from '../../components/ui/Overlay.jsx';
import { Pagination } from '../../components/ui/Table.jsx';
import { CapabilityBadge, MoneyValue, StatusBadge } from '../../components/finance/Finance.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { describeError } from '../../lib/api/errors.js';
import { formatDate, formatPeriod, formatRelativeTime } from '../../lib/format.js';
import { refPath, useAnomalies, useDetectAnomalies, useDismissInsight, useGenerateInsights, useInsights, useUpdateAnomaly } from './api.js';
import styles from './Intelligence.module.css';

const SEVERITY_TONE = { info: 'neutral', low: 'neutral', medium: 'warning', high: 'danger' };

export function Capability({ meta }) {
  if (!meta?.capability) return null;
  return (
    <div className={styles.capability}>
      <CapabilityBadge capability={meta.capability} showNote={false} />
      {meta.capability.note && <span>{meta.capability.note}</span>}
    </div>
  );
}

function Evidence({ items }) {
  if (!items?.length) return null;
  return (
    <ul className={styles.evidence} aria-label="Evidence">
      {items.map((item) => {
        const to = refPath(item.ref);
        return <li key={item.ref}>{to ? <Link to={to}>{item.label}</Link> : <span>{item.label}</span>}</li>;
      })}
    </ul>
  );
}

/** Rule-based findings for the period (GET/POST /ai/insights), with their evidence. */
export function InsightsPanel({ period }) {
  const toast = useToast();
  const [showDismissed, setShowDismissed] = useState(false);
  const query = useInsights(period, showDismissed);
  const generate = useGenerateInsights();
  const dismiss = useDismissInsight();
  const rows = query.data?.data ?? [];

  const run = () => generate.mutate(period, {
    onSuccess: (response) => toast.success('Insights updated', `${response.data.length} finding${response.data.length === 1 ? '' : 's'} for ${formatPeriod(response.meta.period)}.`),
    onError: (error) => toast.error('Could not generate insights', describeError(error)),
  });

  return (
    <>
      <div className={styles.toolbar}>
        <Checkbox label="Show dismissed" checked={showDismissed} onChange={(e) => setShowDismissed(e.target.checked)} />
        <Button icon={RefreshCw} loading={generate.isPending} onClick={run}>Generate insights</Button>
      </div>
      <Capability meta={query.data?.meta} />
      {query.isPending ? <CardSkeleton lines={4} />
        : query.isError ? <Card><ErrorState error={query.error} onRetry={() => query.refetch()} /></Card>
          : rows.length === 0 ? (
            <Card>
              <EmptyState
                icon={Lightbulb}
                title="No insights for this period"
                description="Insights are generated from your records with fixed rules. Generate them for this period; when nothing notable is found, none are created."
                action={<Button icon={RefreshCw} loading={generate.isPending} onClick={run}>Generate insights</Button>}
              />
            </Card>
          ) : (
            <div className={styles.list}>
              {rows.map((insight) => (
                <Card key={insight.id} className={styles.item}>
                  <div className={styles.itemHead}>
                    <h3 className={styles.itemTitle}>{insight.title}</h3>
                    <div className={styles.badges}>
                      <Badge tone={SEVERITY_TONE[insight.severity]} dot>{insight.severity}</Badge>
                      <CapabilityBadge capability={{ method: insight.method, confidence: insight.method === 'rule' ? null : insight.confidence }} showNote={false} />
                      {insight.dismissed && <Badge>Dismissed</Badge>}
                    </div>
                  </div>
                  <p className={styles.body}>{insight.body}</p>
                  {insight.action && <p className={styles.action}>{insight.action}</p>}
                  <Evidence items={insight.evidence} />
                  <div className={styles.itemHead}>
                    <span className={styles.meta}>{formatPeriod(insight.period)} · updated {formatRelativeTime(insight.updatedAt)}</span>
                    {!insight.dismissed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={EyeOff}
                        loading={dismiss.isPending && dismiss.variables === insight.id}
                        onClick={() => dismiss.mutate(insight.id, { onError: (error) => toast.error('Could not dismiss', describeError(error)) })}
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
    </>
  );
}

const STATUS_FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'false_positive', label: 'Not a problem' },
  { id: '', label: 'All' },
];
const REVIEW_ACTIONS = {
  confirmed: { label: 'Confirm issue', title: 'Confirm this is a real issue', icon: ShieldCheck },
  false_positive: { label: 'Not a problem', title: 'Mark as not a problem', icon: X },
  resolved: { label: 'Resolved', title: 'Mark as resolved', icon: Check },
};

/** Flagged transactions (GET /ai/anomalies) and their review. Nothing is changed automatically. */
export function AnomaliesPanel({ period }) {
  const toast = useToast();
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const [review, setReview] = useState(null);
  const [note, setNote] = useState('');
  useEffect(() => { setPage(1); }, [status]);
  const query = useAnomalies({ page, limit: 20, status: status ? [status] : undefined });
  const detect = useDetectAnomalies();
  const update = useUpdateAnomaly();
  const rows = query.data?.data ?? [];

  const run = () => detect.mutate(period, {
    onSuccess: (response) => {
      const d = response.data;
      toast.success(`${d.newFlags} new flag${d.newFlags === 1 ? '' : 's'}`, `${d.transactionsChecked} transactions checked in ${formatPeriod(d.period)}.${d.history?.note ? ` ${d.history.note}` : ''}`);
    },
    onError: (error) => toast.error('Detection failed', describeError(error)),
  });
  const save = () => update.mutate({ id: review.anomaly.id, status: review.status, note: note.trim() || undefined }, {
    onSuccess: () => { toast.success('Review saved'); setReview(null); setNote(''); },
    onError: (error) => toast.error('Could not save', describeError(error)),
  });

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup} role="group" aria-label="Status">
          {STATUS_FILTERS.map((s) => <Pill key={s.id || 'all'} selected={status === s.id} onClick={() => setStatus(s.id)}>{s.label}</Pill>)}
        </div>
        <Button icon={ScanSearch} loading={detect.isPending} onClick={run}>Check this period</Button>
      </div>
      <Capability meta={query.data?.meta} />
      {query.isPending ? <CardSkeleton lines={4} />
        : query.isError ? <Card><ErrorState error={query.error} onRetry={() => query.refetch()} /></Card>
          : rows.length === 0 ? (
            <Card>
              <EmptyState
                icon={ScanSearch}
                title={status === 'open' ? 'Nothing needs review' : 'No flags with this status'}
                description="Run a check for the selected period. Flags are review items; a transaction is never changed, merged or deleted."
                action={<Button icon={ScanSearch} loading={detect.isPending} onClick={run}>Check this period</Button>}
              />
            </Card>
          ) : (
            <div className={styles.list}>
              {rows.map((anomaly) => (
                <Card key={anomaly.id} className={styles.item}>
                  <div className={styles.itemHead}>
                    <h3 className={styles.itemTitle}>{anomaly.rule.label}</h3>
                    <div className={styles.badges}>
                      <Badge tone={SEVERITY_TONE[anomaly.severity]} dot>{anomaly.severity}</Badge>
                      <StatusBadge status={anomaly.status} label={STATUS_FILTERS.find((s) => s.id === anomaly.status)?.label} />
                    </div>
                  </div>
                  <div className={styles.txn}>
                    <strong>{anomaly.transaction.payee ?? anomaly.transaction.description ?? 'Transaction'}</strong>
                    <span>{formatDate(anomaly.transaction.date)}</span>
                    <MoneyValue money={anomaly.transaction.amount} size="sm" />
                    <Link to={`/app/transactions?open=${anomaly.transaction.id}`}>Open</Link>
                    {anomaly.relatedTransactionId && <Link to={`/app/transactions?open=${anomaly.relatedTransactionId}`}>Open the similar one</Link>}
                  </div>
                  <p className={styles.body}>{anomaly.explanation}</p>
                  {anomaly.note && <p className={styles.meta}>Note: {anomaly.note}</p>}
                  <div className={styles.itemHead}>
                    <span className={styles.meta}>Flagged {formatRelativeTime(anomaly.detectedAt)}</span>
                    <div className={styles.itemActions}>
                      {Object.entries(REVIEW_ACTIONS).filter(([id]) => id !== anomaly.status).map(([id, a]) => (
                        <Button key={id} variant={id === 'confirmed' ? 'secondary' : 'ghost'} size="sm" icon={a.icon} onClick={() => { setNote(anomaly.note ?? ''); setReview({ anomaly, status: id }); }}>{a.label}</Button>
                      ))}
                      {anomaly.status !== 'open' && <Button variant="ghost" size="sm" onClick={() => { setNote(anomaly.note ?? ''); setReview({ anomaly, status: 'open' }); }}>Reopen</Button>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
      <Pagination meta={query.data?.meta} onPageChange={setPage} />
      <Modal
        open={Boolean(review)}
        size="sm"
        onClose={update.isPending ? undefined : () => setReview(null)}
        title={review ? (REVIEW_ACTIONS[review.status]?.title ?? 'Reopen this flag') : ''}
        description={review ? `${review.anomaly.rule.label} · ${review.anomaly.transaction.payee ?? 'transaction'}` : undefined}
        footer={<><Button variant="secondary" onClick={() => setReview(null)} disabled={update.isPending}>Cancel</Button><Button onClick={save} loading={update.isPending}>Save</Button></>}
      >
        <Field label="Note" hint="Optional. Kept with the flag.">{(p) => <Textarea rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} {...p} />}</Field>
      </Modal>
    </>
  );
}
