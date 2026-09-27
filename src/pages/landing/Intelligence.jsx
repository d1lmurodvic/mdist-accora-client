import {
  AlertTriangle, BadgeCheck, Calculator, Database, Eye, FileScan, HandHeart, HeartPulse, Lightbulb, MessagesSquare,
  Ruler, Sigma, Tags, TrendingUp, Workflow,
} from 'lucide-react';
import { Section } from './Section.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import styles from './Intelligence.module.css';

const CHAIN = ['Data', 'Context', 'Insight', 'Forecast', 'Decision'];

export function IntelligenceSection() {
  return (
    <Section
      id="intelligence"
      eyebrow="Financial intelligence"
      title="Your numbers should explain what is happening — not just record it."
      lead="Accora compares periods, watches for unusual activity and projects cash ahead, then tells you why each signal appeared and what it is based on."
    >
      <ol className={styles.chain} aria-label="From data to decision">
        {CHAIN.map((step, index) => (
          <li key={step} className={styles.chainStep}>
            <span className={styles.chainIndex}>{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>

      <div className={styles.cards}>
        <article className={`${styles.card} ${styles.insight}`}>
          <header className={styles.cardHead}>
            <span className={styles.cardIcon}><Lightbulb size={18} aria-hidden="true" /></span>
            <span className={styles.cardKind}>Insight</span>
            <Badge tone="neutral">Example</Badge>
          </header>
          <p className={styles.cardTitle}>Expenses rose against the previous month</p>
          <p className={styles.cardText}>Each insight names the figures behind it, the period it compares, and a next step to consider.</p>
          <p className={styles.method}><Calculator size={14} aria-hidden="true" /> Rule-based · cites its records</p>
        </article>

        <article className={`${styles.card} ${styles.anomaly}`}>
          <header className={styles.cardHead}>
            <span className={styles.cardIcon}><AlertTriangle size={18} aria-hidden="true" /></span>
            <span className={styles.cardKind}>Unusual transaction</span>
            <Badge tone="neutral">Example</Badge>
          </header>
          <p className={styles.cardTitle}>Possible duplicate payment</p>
          <p className={styles.cardText}>Same payee and amount within three days. Flags are review items — nothing is changed or deleted automatically.</p>
          <p className={styles.method}><Sigma size={14} aria-hidden="true" /> Statistics over your own history</p>
        </article>

        <article className={`${styles.card} ${styles.forecast}`}>
          <header className={styles.cardHead}>
            <span className={styles.cardIcon}><TrendingUp size={18} aria-hidden="true" /></span>
            <span className={styles.cardKind}>Forecast</span>
            <Badge tone="neutral">Example</Badge>
          </header>
          <p className={styles.cardTitle}>Cash projected for 30, 60 or 90 days</p>
          <svg className={styles.spark} viewBox="0 0 200 48" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 30 C30 26 50 34 80 24 S130 18 160 22 S190 12 200 10" fill="none" stroke="var(--color-primary)" strokeWidth="2" />
            <path d="M120 21 C140 20 160 22 170 19 S190 12 200 10" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
          <p className={styles.cardText}>Recurring patterns and invoice due dates, with every assumption listed and confidence that falls with distance.</p>
          <p className={styles.method}><Sigma size={14} aria-hidden="true" /> Deterministic projection</p>
        </article>

        <article className={`${styles.card} ${styles.health}`}>
          <header className={styles.cardHead}>
            <span className={styles.cardIcon}><HeartPulse size={18} aria-hidden="true" /></span>
            <span className={styles.cardKind}>Financial health</span>
            <Badge tone="neutral">Example</Badge>
          </header>
          <p className={styles.cardTitle}>Five signals, shown with their thresholds</p>
          <ul className={styles.signals}>
            {['Cash position', 'Profitability', 'Revenue trend', 'Expense control', 'Invoice collection'].map((signal) => <li key={signal}>{signal}</li>)}
          </ul>
          <p className={styles.method}><Calculator size={14} aria-hidden="true" /> An estimate — never a guessed score</p>
        </article>
      </div>
    </Section>
  );
}

const AI_POINTS = [
  { icon: Calculator, title: 'Numbers come from the engine', text: 'Totals, balances, reports and forecasts are calculated exactly from your records. A language model never produces a figure.' },
  { icon: FileScan, title: 'AI where language helps', text: 'Reading receipts and invoices uses an AI provider when one is configured. Without one, Accora says so and you enter the details.' },
  { icon: Tags, title: 'Rules you can see', text: 'Categories are suggested from your rules and past corrections, labelled with how they were chosen, and always need your confirmation.' },
  { icon: MessagesSquare, title: 'Grounded answers', text: 'The assistant answers from your company’s own figures and says when a question is outside what it can answer.' },
];

export function AiSection() {
  return (
    <Section
      id="ai"
      eyebrow="Our approach to AI"
      title="AI interprets. The math stays exact."
      lead="Every result in Accora shows how it was produced — rule, statistics or AI — so you always know what you are looking at."
      align="start"
      tone="band"
    >
      <div className={styles.ai}>
        <div className={styles.aiPanel}>
          <p className={styles.aiPanelLabel}>Every result is labelled</p>
          <ul className={styles.methods}>
            <li><Badge tone="neutral" icon={Calculator}>Rule-based</Badge><span>Fixed, explainable rules</span></li>
            <li><Badge tone="info" icon={Sigma}>Statistics</Badge><span>Your own history</span></li>
            <li><Badge tone="primary" icon={Workflow}>AI</Badge><span>Only when a provider is configured</span></li>
            <li><Badge tone="neutral">Unavailable</Badge><span>Stated plainly, never simulated</span></li>
          </ul>
        </div>
        <div className={styles.aiPoints}>
          {AI_POINTS.map((point) => (
            <div key={point.title} className={styles.aiPoint}>
              <point.icon size={20} aria-hidden="true" className={styles.aiIcon} />
              <div>
                <h3 className={styles.aiTitle}>{point.title}</h3>
                <p className={styles.aiText}>{point.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

const PRINCIPLES = [
  { icon: Database, title: 'Grounded', text: 'Insights come from your company’s data.' },
  { icon: Eye, title: 'Transparent', text: 'AI capability states are always visible.' },
  { icon: Ruler, title: 'Precise', text: 'Money is handled in exact integer units.' },
  { icon: BadgeCheck, title: 'Practical', text: 'Built around real small-business workflows.' },
  { icon: HandHeart, title: 'Human-friendly', text: 'For owners who are not accountants.' },
];

export function Principles() {
  return (
    <Section id="principles" eyebrow="Principles" title="Built to be trusted with your numbers">
      <ul className={styles.principles}>
        {PRINCIPLES.map((item) => (
          <li key={item.title} className={styles.principle}>
            <item.icon size={22} aria-hidden="true" />
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
