import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb, LineChart, ShieldCheck, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { MoneyValue, TrendIndicator } from '../../components/finance/Finance.jsx';
import styles from './Hero.module.css';

/*
 * The hero and its product illustration. The illustration reuses the real
 * Accora components; every value in it is a labelled sample, not customer
 * data.
 */
const sample = (amount) => ({ amount, currency: 'UZS' });

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.copy}>
        <Badge tone="primary" icon={Sparkles}>The Smart Future of Accounting</Badge>
        <h1 id="hero-title" className={styles.title}>
          From transactions to <span className={styles.accent}>financial decisions.</span>
        </h1>
        <p className={styles.lead}>
          Accora turns a growing business&apos;s everyday financial activity into clear reports, grounded insights and
          forward-looking forecasts — built for owners, not just accountants.
        </p>
        <div className={styles.ctas}>
          <Link to="/register" className={styles.primary}>Get started <ArrowRight size={18} aria-hidden="true" /></Link>
          <a href="#product" className={styles.secondary}>Explore the product</a>
        </div>
        <ul className={styles.points}>
          <li><ShieldCheck size={16} aria-hidden="true" /> Exact, deterministic calculations</li>
          <li><LineChart size={16} aria-hidden="true" /> Reports, forecast and health in one place</li>
        </ul>
      </div>

      <HeroVisual />
    </section>
  );
}

function HeroVisual() {
  return (
    <div className={styles.visual} role="img" aria-label="Illustration of the Accora dashboard with sample figures">
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.panel} aria-hidden="true">
        <div className={styles.panelTop}>
          <span className={styles.dots}><i /><i /><i /></span>
          <span className={styles.panelTitle}>Overview</span>
          <Badge tone="warning">Sample preview</Badge>
        </div>
        <div className={styles.cash}>
          <span className={styles.label}><Wallet size={14} /> Cash position</span>
          <MoneyValue money={sample(84250000)} size="lg" />
        </div>
        <svg className={styles.chart} viewBox="0 0 320 90" preserveAspectRatio="none">
          <defs>
            <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-accent)" stopOpacity="0.32" />
              <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 62 L40 62 L40 54 L90 54 L90 66 L130 66 L130 44 L180 44 L180 50 L220 50 L220 30 L270 30 L270 22 L320 22 L320 90 L0 90 Z" fill="url(#hero-fill)" />
          <path className={styles.line} d="M0 62 L40 62 L40 54 L90 54 L90 66 L130 66 L130 44 L180 44 L180 50 L220 50 L220 30 L270 30 L270 22 L320 22" fill="none" stroke="var(--color-primary)" strokeWidth="2" />
        </svg>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.label}>Income</span>
            <MoneyValue money={sample(32000000)} size="sm" />
            <TrendIndicator basisPoints={640} />
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Expenses</span>
            <MoneyValue money={sample(27400000)} size="sm" />
            <TrendIndicator basisPoints={210} goodWhen="down" />
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Receivables</span>
            <MoneyValue money={sample(8600000)} size="sm" />
            <span className={styles.muted}>1 overdue</span>
          </div>
        </div>
      </div>

      <div className={`${styles.float} ${styles.floatInsight}`} aria-hidden="true">
        <span className={styles.floatIcon}><Lightbulb size={16} /></span>
        <div>
          <p className={styles.floatTitle}>Marketing is up on last month</p>
          <p className={styles.floatText}>Review the largest payments in this category.</p>
        </div>
      </div>

      <div className={`${styles.float} ${styles.floatForecast}`} aria-hidden="true">
        <span className={styles.floatIcon}><TrendingUp size={16} /></span>
        <div>
          <p className={styles.floatTitle}>30-day forecast</p>
          <p className={styles.floatText}>Stays above zero · assumptions listed</p>
        </div>
      </div>

      <p className={styles.caption}>Product illustration with sample values.</p>
    </div>
  );
}
