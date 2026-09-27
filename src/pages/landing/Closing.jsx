import { Link } from 'react-router-dom';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { Brand } from '../../layouts/Brand.jsx';
import { useReveal } from './useReveal.js';
import styles from './Closing.module.css';

export function ClosingCta() {
  const [ref, visible] = useReveal();
  return (
    <section className={styles.ctaSection} aria-labelledby="cta-title">
      <div ref={ref} className={`${styles.cta} ${visible ? styles.visible : styles.hidden}`}>
        <div className={styles.ctaGlow} aria-hidden="true" />
        <p className={styles.flow}>Photo → Review → Approve → Understand</p>
        <h2 id="cta-title" className={styles.ctaTitle}>Put your paperwork to work.</h2>
        <p className={styles.ctaLead}>Create your workspace and start with an invoice or receipt. You can also explore with sample data.</p>
        <div className={styles.ctaActions}>
          <Link to="/register" className={styles.primary}>Get started <ArrowRight size={18} aria-hidden="true" /></Link>
          <Link to="/register" className={styles.secondary}><FlaskConical size={17} aria-hidden="true" /> Explore with demo data</Link>
        </div>
        <p className={styles.ctaNote}>Demo data is offered during setup and can be removed at any time.</p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <Brand to="/" />
          <p>Financial management for small and mid-sized businesses. Turn invoices and receipts into organized records and clearer finances.</p>
        </div>
        <nav className={styles.footerNav} aria-label="Footer">
          <div>
            <p className={styles.footerHeading}>Explore</p>
            <ul>
              <li><a href="#product">Product</a></li>
              <li><a href="#reports">Reports</a></li>
              <li><a href="#ai">Document processing</a></li>
            </ul>
          </div>
          <div>
            <p className={styles.footerHeading}>Account</p>
            <ul>
              <li><Link to="/login">Log in</Link></li>
              <li><Link to="/register">Get started</Link></li>
            </ul>
          </div>
        </nav>
      </div>
      <div className={styles.footerBottom}>
        <p>© {new Date().getFullYear()} Accora</p>
        <p>Practical owner-facing statements; not certified statutory filings or tax advice.</p>
      </div>
    </footer>
  );
}
