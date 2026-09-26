import { AlertCircle, Inbox, RefreshCw, WifiOff } from 'lucide-react';
import { describeError } from '../../lib/api/errors.js';
import styles from './Feedback.module.css';

export function Spinner({ size = 18, label = 'Loading' }) {
  return (
    <span className={styles.spinner} style={{ width: size, height: size }} role={label ? 'status' : undefined} aria-label={label || undefined}>
      <span className={styles.spinnerRing} />
    </span>
  );
}

export function Skeleton({ width = '100%', height = 14, radius, className = '' }) {
  return <span className={`${styles.skeleton} ${className}`} style={{ width, height, borderRadius: radius }} aria-hidden="true" />;
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className={styles.cardSkeleton} aria-hidden="true">
      <Skeleton width="40%" height={12} />
      <Skeleton width="60%" height={28} radius={10} />
      {Array.from({ length: lines - 1 }, (_, i) => <Skeleton key={i} width={`${80 - i * 15}%`} />)}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 4 }) {
  return (
    <div className={styles.tableSkeleton} aria-hidden="true">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className={styles.tableRow} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, col) => <Skeleton key={col} width={col === 0 ? '70%' : '50%'} />)}
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className={styles.page} role="status" aria-label="Loading page">
      <Skeleton width="220px" height={28} radius={10} />
      <div className={styles.pageGrid}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}

/** A purposeful empty state with a next action — never a fake zero. */
export function EmptyState({ icon: Icon = Inbox, title, description, action, compact }) {
  return (
    <div className={`${styles.state} ${compact ? styles.compact : ''}`}>
      <span className={styles.stateIcon}><Icon size={22} aria-hidden="true" /></span>
      <h3 className={styles.stateTitle}>{title}</h3>
      {description && <p className={styles.stateText}>{description}</p>}
      {action && <div className={styles.stateAction}>{action}</div>}
    </div>
  );
}

/** A failure shown as a failure: message, optional retry, safe request id. */
export function ErrorState({ error, title, onRetry, compact }) {
  const network = error?.kind === 'network';
  const Icon = network ? WifiOff : AlertCircle;
  return (
    <div className={`${styles.state} ${styles.error} ${compact ? styles.compact : ''}`} role="alert">
      <span className={styles.stateIcon}><Icon size={22} aria-hidden="true" /></span>
      <h3 className={styles.stateTitle}>{title ?? (network ? 'You appear to be offline' : 'This could not be loaded')}</h3>
      <p className={styles.stateText}>{describeError(error)}</p>
      {onRetry && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          <RefreshCw size={15} aria-hidden="true" /> Try again
        </button>
      )}
      {error?.requestId && <p className={styles.reference}>Reference: {error.requestId}</p>}
    </div>
  );
}

/** An inline message inside a form or card. tone: info | success | warning | danger */
export function Alert({ tone = 'info', title, children }) {
  const Icon = tone === 'danger' ? AlertCircle : Inbox;
  return (
    <div className={`${styles.alert} ${styles[`alert_${tone}`]}`} role={tone === 'danger' ? 'alert' : 'status'}>
      {tone === 'danger' && <Icon size={18} aria-hidden="true" className={styles.alertIcon} />}
      <div>
        {title && <p className={styles.alertTitle}>{title}</p>}
        {children && <div className={styles.alertText}>{children}</div>}
      </div>
    </div>
  );
}
