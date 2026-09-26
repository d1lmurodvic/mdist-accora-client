import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { initials } from '../../lib/format.js';
import styles from './Page.module.css';

/** The top of every screen: breadcrumb, title, description, actions. */
export function PageHeader({ title, description, actions, breadcrumb, eyebrow }) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageText}>
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={styles.pageTitle}>{title}</h1>
        {description && <p className={styles.pageDescription}>{description}</p>}
      </div>
      {actions && <div className={styles.pageActions}>{actions}</div>}
    </header>
  );
}

/** items: [{ label, to? }] — the last item is the current page. */
export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className={styles.breadcrumb}>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className={styles.crumb}>
              {item.to && !last ? <Link to={item.to}>{item.label}</Link> : <span aria-current={last ? 'page' : undefined}>{item.label}</span>}
              {!last && <ChevronRight size={14} aria-hidden="true" className={styles.crumbIcon} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Avatar({ name, size = 36 }) {
  return (
    <span className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

/** A horizontal bar for filters and search above lists; wraps on small screens. */
export function FilterBar({ children, end }) {
  return (
    <div className={styles.filterBar}>
      <div className={styles.filters}>{children}</div>
      {end && <div className={styles.filterEnd}>{end}</div>}
    </div>
  );
}
