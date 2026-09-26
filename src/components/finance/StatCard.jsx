import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { CardSkeleton, ErrorState } from '../ui/Feedback.jsx';
import { FinancialStat } from './Finance.jsx';
import styles from './StatCard.module.css';

/**
 * A dashboard figure card. Every card links to the screen that explains it
 * (PRODUCT_REQUIREMENTS.md #4: no dead cards). Loading and failure are shown
 * as such, never as zero.
 */
export function StatCard({ label, money, change, goodWhen, icon, to, hint, loading, error, onRetry, footer }) {
  if (loading) return <CardSkeleton />;
  return (
    <Card size="md" interactive={Boolean(to)} className={styles.card}>
      {error ? (
        <ErrorState error={error} onRetry={onRetry} compact title={`${label} unavailable`} />
      ) : (
        <>
          <FinancialStat label={label} money={money} change={change} goodWhen={goodWhen} icon={icon} hint={hint} />
          {footer && <div className={styles.footer}>{footer}</div>}
          {to && (
            <Link to={to} className={styles.link} aria-label={`Open ${label}`}>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          )}
        </>
      )}
    </Card>
  );
}
