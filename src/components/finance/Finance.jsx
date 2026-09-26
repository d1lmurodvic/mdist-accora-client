import { ArrowDownRight, ArrowUpRight, Bot, Calculator, CircleSlash, FlaskConical, Minus, Sigma } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { Tooltip } from '../ui/Menu.jsx';
import { formatBasisPoints, formatConfidence, formatMoney } from '../../lib/format.js';
import styles from './Finance.module.css';

/*
 * Financial presentation primitives. They FORMAT values the backend computed
 * and never calculate one. Missing values render as an em dash with an
 * accessible "Not available" — never as a fake zero.
 */

function Missing() {
  return <span className={styles.missing} aria-label="Not available">—</span>;
}

/**
 * money: { amount, currency } in minor units.
 * tone: 'auto' colours negatives only when `semantic` is set; size: sm | md | lg | xl
 */
export function MoneyValue({ money, size = 'md', semantic = false, signDisplay, compact, className = '' }) {
  const text = formatMoney(money, { signDisplay, compact });
  if (text === null) return <Missing />;
  const tone = semantic ? (money.amount < 0 ? styles.negative : money.amount > 0 ? styles.positive : '') : '';
  const number = text.slice(0, text.lastIndexOf(' '));
  return (
    <span className={`${styles.money} ${styles[size]} ${tone} tabular ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{number}</span>
      <span className={styles.currency} aria-hidden="true">{money.currency}</span>
    </span>
  );
}

/** basisPoints: integer (1800 = 18.00%). */
export function PercentageValue({ basisPoints, signDisplay, digits, className = '' }) {
  const text = formatBasisPoints(basisPoints, { signDisplay, digits });
  if (text === null) return <Missing />;
  return <span className={`tabular ${className}`}>{text}</span>;
}

/**
 * Direction of a change the backend reported. `goodWhen` says whether an
 * increase is good (income) or bad (expenses), which only affects colour.
 * basisPoints null (no previous figure) shows "No comparison".
 */
export function TrendIndicator({ basisPoints, goodWhen = 'up', label }) {
  if (basisPoints === null || basisPoints === undefined) {
    return <span className={`${styles.trend} ${styles.flat}`}><Minus size={14} aria-hidden="true" />No comparison</span>;
  }
  const up = basisPoints > 0;
  const flat = basisPoints === 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const good = flat ? null : (up === (goodWhen === 'up'));
  const tone = good === null ? styles.flat : good ? styles.good : styles.bad;
  return (
    <span className={`${styles.trend} ${tone}`}>
      <Icon size={14} aria-hidden="true" />
      <span className="tabular">{formatBasisPoints(basisPoints, { signDisplay: 'exceptZero' })}</span>
      {label && <span className={styles.trendLabel}>{label}</span>}
    </span>
  );
}

/** A labelled financial figure with an optional change line. */
export function FinancialStat({ label, money, change, goodWhen, size = 'lg', hint, icon: Icon }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>
        {Icon && <span className={styles.statIcon}><Icon size={15} aria-hidden="true" /></span>}
        {label}
      </span>
      <MoneyValue money={money} size={size} />
      {change !== undefined && <TrendIndicator basisPoints={change} goodWhen={goodWhen} label="vs previous period" />}
      {hint && <span className={styles.statHint}>{hint}</span>}
    </div>
  );
}

export function CurrencyBadge({ currency }) {
  return <Badge tone="neutral">{currency}</Badge>;
}

const STATUS_TONES = {
  paid: 'success', confirmed: 'success', ready: 'success', resolved: 'success', healthy: 'success', good: 'success',
  sent: 'info', requested: 'info', in_contact: 'info', processing: 'info',
  overdue: 'danger', failed: 'danger', at_risk: 'danger', poor: 'danger', high: 'danger',
  needs_review: 'warning', open: 'warning', fair: 'warning', medium: 'warning', warning: 'warning',
  draft: 'neutral', cancelled: 'neutral', closed: 'neutral', false_positive: 'neutral', low: 'neutral', info: 'neutral', insufficient_data: 'neutral',
};

/** A status string from the backend, shown with a consistent tone. */
export function StatusBadge({ status, label }) {
  if (!status) return null;
  const text = label ?? status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'} dot>{text}</Badge>;
}

/** A 0–1 confidence the backend supplied. Nothing is shown when it did not. */
export function ConfidenceBadge({ confidence }) {
  const text = formatConfidence(confidence);
  if (text === null) return null;
  const tone = confidence >= 0.8 ? 'success' : confidence >= 0.5 ? 'warning' : 'danger';
  return <Badge tone={tone}>{text} confidence</Badge>;
}

const METHODS = {
  ai: { label: 'AI', icon: Bot, tone: 'primary' },
  rule: { label: 'Rule-based', icon: Calculator, tone: 'neutral' },
  statistics: { label: 'Statistics', icon: Sigma, tone: 'info' },
  simulated: { label: 'Simulated', icon: FlaskConical, tone: 'warning' },
  unavailable: { label: 'Unavailable', icon: CircleSlash, tone: 'neutral' },
};

/**
 * How a result was produced — straight from meta.capability
 * ({ method, confidence, degraded, note }). Never inferred on the client.
 */
export function CapabilityBadge({ capability, showNote = true }) {
  if (!capability?.method) return null;
  const method = METHODS[capability.method] ?? { label: capability.method, icon: Calculator, tone: 'neutral' };
  const badge = (
    <span className={styles.capability} tabIndex={capability.note && showNote ? 0 : undefined}>
      <Badge tone={method.tone} icon={method.icon}>{method.label}</Badge>
      {capability.degraded && <Badge tone="warning">Limited</Badge>}
      <ConfidenceBadge confidence={capability.confidence} />
    </span>
  );
  return capability.note && showNote ? <Tooltip content={capability.note}>{badge}</Tooltip> : badge;
}
