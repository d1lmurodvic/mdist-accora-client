import styles from './Badge.module.css';

/** tone: neutral | primary | success | warning | danger | info */
export function Badge({ tone = 'neutral', icon: Icon, dot, children, className = '', ...props }) {
  return (
    <span className={`${styles.badge} ${styles[tone]} ${className}`} {...props}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </span>
  );
}

/** A selectable pill (filters, segmented choices). */
export function Pill({ selected, children, className = '', ...props }) {
  return (
    <button type="button" aria-pressed={selected} className={`${styles.pill} ${selected ? styles.pillSelected : ''} ${className}`} {...props}>
      {children}
    </button>
  );
}
