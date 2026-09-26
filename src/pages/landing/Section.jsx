import { useReveal } from './useReveal.js';
import styles from './Section.module.css';

/** A landing section with a heading block; content fades in once visible. */
export function Section({ id, eyebrow, title, lead, children, tone = 'plain', align = 'center', className = '' }) {
  const [ref, visible] = useReveal();
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={`${styles.section} ${styles[tone]} ${className}`}>
      <div ref={ref} className={`${styles.inner} ${visible ? styles.visible : styles.hidden}`}>
        {(eyebrow || title) && (
          <header className={`${styles.head} ${styles[align]}`}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            {title && <h2 id={headingId} className={styles.title}>{title}</h2>}
            {lead && <p className={styles.lead}>{lead}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
