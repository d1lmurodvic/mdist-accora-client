import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowDownLeft, ArrowUpRight, Copy, FileText, HeartPulse, Lightbulb, Receipt, ScanLine, ShieldAlert, TrendingDown, Upload, UserPlus,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState } from '../../components/ui/Feedback.jsx';
import { CapabilityBadge, ConfidenceBadge, MoneyValue, StatusBadge } from '../../components/finance/Finance.jsx';
import { formatDate, formatRelativeTime } from '../../lib/format.js';
import { appPathFor } from '../../lib/links.js';
import styles from './Dashboard.module.css';

/*
 * Dashboard cards. Each renders exactly what GET /dashboard returned and
 * links to the screen that explains it. No figure is derived here.
 */

function ViewLink({ link, children = 'View all' }) {
  const to = appPathFor(link);
  return to ? <Link to={to} className={styles.viewLink}>{children}</Link> : null;
}

const SEVERITY_TONE = { high: 'danger', medium: 'warning', low: 'neutral', info: 'info' };

export function OutstandingCard({ outstanding }) {
  const row = (label, figures, Icon) => (
    <div className={styles.outRow}>
      <span className={styles.outIcon}><Icon size={16} aria-hidden="true" /></span>
      <div className={styles.outText}>
        <span className={styles.outLabel}>{label}</span>
        <span className={styles.outMeta}>
          {figures.count} unpaid
          {figures.overdueCount > 0 && <Badge tone="danger">{figures.overdueCount} overdue</Badge>}
        </span>
      </div>
      <MoneyValue money={figures.total} size="md" />
    </div>
  );
  return (
    <Card className={styles.fill}>
      <CardHeader title="Outstanding invoices" description={`Unpaid as of ${formatDate(outstanding.asOf)}`} action={<ViewLink link={outstanding.link} />} />
      <div className={styles.outList}>
        {row('Owed to you', outstanding.receivable, ArrowDownLeft)}
        {row('You owe', outstanding.payable, ArrowUpRight)}
      </div>
      <p className={styles.footnote}>Unpaid invoices are not income or expenses until they are paid.</p>
    </Card>
  );
}

export function InsightsCard({ insights }) {
  return (
    <Card className={styles.fill}>
      <CardHeader title="Insights" description="What changed and what to consider." action={<ViewLink link={insights.link} />} />
      <div className={styles.method}><CapabilityBadge capability={insights.capability} /></div>
      {insights.items.length === 0 ? (
        <EmptyState compact icon={Lightbulb} title="No findings for this period" description="Insights appear when your figures show a notable change. None are invented." />
      ) : (
        <ul className={styles.insightList}>
          {insights.items.map((item) => (
            <li key={`${item.type}-${item.title}`} className={styles.insight}>
              <div className={styles.insightHead}>
                <Badge tone={SEVERITY_TONE[item.severity] ?? 'neutral'} dot>{item.severity}</Badge>
                <ConfidenceBadge confidence={item.method === 'rule' ? null : item.confidence} />
              </div>
              <p className={styles.insightTitle}>{item.title}</p>
              <p className={styles.insightBody}>{item.body}</p>
              <p className={styles.insightAction}>{item.action}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function ForecastCard({ forecast, capability }) {
  const crosses = forecast.belowZero.crosses;
  return (
    <Card className={styles.fill}>
      <CardHeader title="Cash forecast" description={`Next ${forecast.horizonDays} days · a projection, not a guarantee`} action={<ViewLink link={forecast.link} />} />
      {capability?.method && <div className={styles.method}><CapabilityBadge capability={capability} /></div>}
      {crosses && (
        <div className={styles.warning} role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          Cash is projected to fall below zero on {formatDate(forecast.belowZero.firstDate)}.
        </div>
      )}
      <dl className={styles.facts}>
        <div>
          <dt>Lowest point</dt>
          <dd><MoneyValue money={forecast.minimum.balance} semantic={crosses} /></dd>
          <dd className={styles.factSub}>{formatDate(forecast.minimum.date)}</dd>
        </div>
        <div>
          <dt>In {forecast.horizonDays} days</dt>
          <dd><MoneyValue money={forecast.endingBalance} /></dd>
          <dd className={styles.factSub}>Runway: {forecast.runway.beyondHorizon ? `beyond ${forecast.horizonDays} days` : `${forecast.runway.days} days`}</dd>
        </div>
      </dl>
      {forecast.note && <p className={styles.footnote}>{forecast.note}</p>}
    </Card>
  );
}

const HEALTH_LABEL = { healthy: 'Healthy', fair: 'Fair', at_risk: 'At risk', insufficient_data: 'Not enough data' };

export function HealthCard({ health }) {
  const score = health.score;
  const circumference = 2 * Math.PI * 42;
  return (
    <Card className={styles.fill}>
      <CardHeader title="Financial health" description="An estimate, not an assessment." action={<ViewLink link={health.link}>Details</ViewLink>} />
      <div className={styles.health}>
        <svg viewBox="0 0 100 100" className={`${styles.ring} ${styles[`ring_${health.status}`] ?? ''}`} aria-hidden="true">
          <circle cx="50" cy="50" r="42" className={styles.ringTrack} />
          {score !== null && (
            <circle cx="50" cy="50" r="42" className={styles.ringValue} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score / 100)} />
          )}
        </svg>
        <div className={styles.healthText}>
          <span className={styles.healthScore}>{score === null ? <HeartPulse size={28} aria-hidden="true" /> : <span className="tabular">{score}</span>}</span>
          <StatusBadge status={health.status} label={HEALTH_LABEL[health.status]} />
        </div>
      </div>
      <p className={styles.footnote}>
        {score === null
          ? 'Health needs income, expenses or invoices to measure. Excluded components are never guessed.'
          : `From ${health.componentsUsed} of 5 components${health.componentsExcluded.length ? `; ${health.componentsExcluded.length} without enough data were excluded` : ''}.`}
      </p>
    </Card>
  );
}

const RULE_ICON = { amount_outlier: TrendingDown, first_time_payee: UserPlus, possible_duplicate: Copy, large_expense: ShieldAlert };

export function AnomaliesCard({ anomalies }) {
  return (
    <Card className={styles.fill}>
      <CardHeader
        title="Unusual transactions"
        description={anomalies.open === 0 ? 'No open flags' : `${anomalies.open} open to review`}
        action={<ViewLink link={anomalies.link} />}
      />
      {anomalies.latest.length === 0 ? (
        <EmptyState compact icon={ShieldAlert} title="Nothing to review" description="Run detection from Intelligence. With little history, few or no flags appear." />
      ) : (
        <ul className={styles.list}>
          {anomalies.latest.map((item) => {
            const Icon = RULE_ICON[item.rule.id] ?? ShieldAlert;
            return (
              <li key={item.id} className={styles.listItem}>
                <span className={`${styles.listIcon} ${styles[`sev_${item.severity}`]}`}><Icon size={16} aria-hidden="true" /></span>
                <div className={styles.listText}>
                  <span className={styles.listTitle}>{item.transaction.payee ?? item.transaction.description ?? 'Transaction'}</span>
                  <span className={styles.listMeta}>{item.rule.label} · {formatDate(item.transaction.date)}</span>
                </div>
                <MoneyValue money={item.transaction.amount} size="sm" />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

const ACTIVITY = {
  transaction_recorded: { icon: Receipt, label: (row) => `${row.detail === 'income' ? 'Income' : 'Expense'} recorded` },
  invoice_created: { icon: FileText, label: () => 'Invoice created' },
  invoice_sent: { icon: FileText, label: () => 'Invoice sent' },
  invoice_cancelled: { icon: FileText, label: () => 'Invoice cancelled' },
  document_uploaded: { icon: Upload, label: () => 'Document uploaded' },
};

export function ActivityCard({ query }) {
  const rows = query.data ?? [];
  return (
    <Card className={styles.fill}>
      <CardHeader title="Recent activity" />
      {query.isError ? (
        <p className={styles.footnote}>Activity could not be loaded.</p>
      ) : rows.length === 0 && !query.isPending ? (
        <EmptyState compact icon={ScanLine} title="No activity yet" />
      ) : (
        <ul className={styles.list}>
          {rows.map((row) => {
            const kind = ACTIVITY[row.kind] ?? { icon: Receipt, label: () => row.kind };
            return (
              <li key={`${row.kind}-${row.entity.id}`} className={styles.listItem}>
                <span className={styles.listIcon}><kind.icon size={16} aria-hidden="true" /></span>
                <div className={styles.listText}>
                  <span className={styles.listTitle}>{row.label ?? kind.label(row)}</span>
                  <span className={styles.listMeta}>{kind.label(row)} · {formatRelativeTime(row.at)}</span>
                </div>
                {row.amount && <MoneyValue money={row.amount} size="sm" />}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
