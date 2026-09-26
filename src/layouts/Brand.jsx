import { useId } from 'react';
import { Link } from 'react-router-dom';
import styles from './Brand.module.css';

/** The IFRSmart mark and wordmark. */
export function Brand({ compact = false, rail = false, to = '/app/dashboard' }) {
  // A unique gradient id per instance: a hidden copy (e.g. the mobile-hidden sidebar) must not break the visible one.
  const gradientId = `ifrsmart-mark-${useId().replace(/:/g, '')}`;
  return (
    <Link to={to} className={styles.brand} aria-label="IFRSmart home">
      <svg className={styles.mark} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#38BDF8" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill={`url(#${gradientId})`} />
        <path d="M18 42 L28 30 L36 36 L46 22" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && <span className={`${styles.word} ${rail ? styles.railWord : ''}`}>IFRS<span className={styles.accent}>mart</span></span>}
    </Link>
  );
}
