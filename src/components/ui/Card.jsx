import styles from './Card.module.css';

/**
 * Card: opaque surface for data. GlassCard: translucent, for hero areas,
 * floating panels and selected premium surfaces — not for dense data.
 * size: md (main cards) | sm (secondary) | hero
 */
export function Card({ as: Tag = 'section', size = 'md', padding = 'md', interactive, className = '', children, ...props }) {
  return (
    <Tag className={`${styles.card} ${styles[size]} ${styles[`pad_${padding}`]} ${interactive ? styles.interactive : ''} ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export function GlassCard({ className = '', ...props }) {
  return <Card className={`${styles.glass} ${className}`} {...props} />;
}

export function CardHeader({ title, description, action, className = '' }) {
  return (
    <div className={`${styles.header} ${className}`}>
      <div className={styles.headerText}>
        {title && <h3 className={styles.title}>{title}</h3>}
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

/** A section heading inside a page, with an optional action. */
export function SectionHeader({ title, description, action, as: Tag = 'h2' }) {
  return (
    <div className={styles.section}>
      <div className={styles.headerText}>
        <Tag className={styles.sectionTitle}>{title}</Tag>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
