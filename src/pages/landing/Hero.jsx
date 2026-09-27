import { Link } from 'react-router-dom';
import { ArrowRight, Camera, CheckCheck, FileScan } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import styles from './Hero.module.css';

/*
 * The hero and its product illustration. The illustration reuses the real
 * Accora components; every value in it is a labelled sample, not customer
 * data.
 */

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.copy}>
        <h1 id="hero-title" className={styles.title}>
          From receipts to <span className={styles.accent}>clear finances.</span>
        </h1>
        <div className={styles.ctas}>
          <Link to="/register" className={styles.primary}>Get started <ArrowRight size={18} aria-hidden="true" /></Link>
          <a href="#product" className={styles.secondary}>Explore the product</a>
        </div>
      </div>

      <HeroVisual />
    </section>
  );
}

function HeroVisual() {
  return (
    <div className={styles.visual} role="img" aria-label="Sample receipt review with extracted details and a suggested category for approval">
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.panel} aria-hidden="true">
        <div className={styles.panelTop}>
          <FileScan size={20} /><span className={styles.panelTitle}>Receipt review</span><Badge tone="warning">Sample preview</Badge>
        </div>
        <div className={styles.documentHeading}>
          <span className={styles.label}>Vendor</span><strong>Everyday Office Supplies</strong>
          <span className={styles.label}>12 September 2026 | INV-1042</span>
        </div>
        <div className={styles.documentItem}><span>Printer paper x 4</span><span>200,000 UZS</span></div>
        <dl className={styles.documentFields}>
          <div><dt>Subtotal</dt><dd>200,000 UZS</dd></div>
          <div><dt>Tax</dt><dd>24,000 UZS</dd></div>
          <div><dt>Total amount</dt><dd>224,000 UZS</dd></div>
          <div><dt>Currency</dt><dd>UZS</dd></div>
          <div><dt>Suggested category</dt><dd>Office supplies</dd></div>
        </dl>
        <div className={styles.reviewStatus}><CheckCheck size={16} /> Ready for your review</div>
      </div>
      <div className={[styles.float, styles.floatInsight].join(' ')} aria-hidden="true">
        <span className={styles.floatIcon}><Camera size={16} /></span>
        <div><p className={styles.floatTitle}>Photo or upload</p><p className={styles.floatText}>Start with an invoice or receipt.</p></div>
      </div>
      <div className={[styles.float, styles.floatForecast].join(' ')} aria-hidden="true">
        <span className={styles.floatIcon}><CheckCheck size={16} /></span>
        <div><p className={styles.floatTitle}>You approve it</p><p className={styles.floatText}>Then it becomes a transaction.</p></div>
      </div>
      <p className={styles.caption}>Product illustration with sample values.</p>
    </div>
  );
}
