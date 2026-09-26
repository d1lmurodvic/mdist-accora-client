import {
  ArrowRight, Bot, FileScan, FileSpreadsheet, FileText, FolderSearch, HeartPulse, Inbox, LayoutDashboard, LineChart,
  ListChecks, Receipt, Scale, ScanSearch, Sparkles, TrendingUp, Waves,
} from 'lucide-react';
import { Section } from './Section.jsx';
import styles from './Story.module.css';

const PROBLEMS = [
  { icon: FolderSearch, text: 'Transactions scattered across bank statements, notes and spreadsheets' },
  { icon: FileText, text: 'Invoices that are hard to follow from draft to paid' },
  { icon: FileSpreadsheet, text: 'Reports that take time to prepare and longer to understand' },
  { icon: Waves, text: 'Little visibility into where cash is heading' },
  { icon: ScanSearch, text: 'Unusual or duplicate payments noticed too late' },
];
const CHAIN = ['Transactions', 'Financial data', 'Reports', 'Intelligence', 'Forecast', 'Decision'];

export function ProblemSolution() {
  return (
    <Section
      id="why"
      eyebrow="Why IFRSmart"
      title="Financial data is everywhere. Clarity is not."
      lead="Owners of growing businesses have the numbers, but rarely the time to turn them into answers. IFRSmart brings them together — it supports your decisions and your accountant, it does not replace them."
    >
      <div className={styles.split}>
        <div className={styles.problem}>
          <p className={styles.sideLabel}>Without a system</p>
          <ul className={styles.problemList}>
            {PROBLEMS.map((item) => (
              <li key={item.text}><item.icon size={18} aria-hidden="true" />{item.text}</li>
            ))}
          </ul>
        </div>
        <div className={styles.arrow} aria-hidden="true"><ArrowRight size={22} /></div>
        <div className={styles.solution}>
          <p className={styles.sideLabel}>With IFRSmart</p>
          <ol className={styles.chain}>
            {CHAIN.map((step, index) => (
              <li key={step} style={{ '--i': index }}>
                <span className={styles.chainDot} aria-hidden="true" />
                {step}
              </li>
            ))}
          </ol>
          <p className={styles.solutionNote}>One ledger feeds every screen, so the dashboard, reports and forecast always agree.</p>
        </div>
      </div>
    </Section>
  );
}

const STEPS = [
  { icon: Inbox, title: 'Capture', text: 'Transactions, invoices and documents enter IFRSmart.' },
  { icon: ListChecks, title: 'Organize', text: 'Activity is structured and categorized, with your corrections remembered.' },
  { icon: LayoutDashboard, title: 'Understand', text: 'Reports, cash flow and financial health become visible.' },
  { icon: TrendingUp, title: 'Predict', text: 'Forecasts and unusual-transaction checks surface what needs attention.' },
  { icon: Sparkles, title: 'Decide', text: 'You act on clear, explained figures instead of guesses.' },
];

export function HowItWorks() {
  return (
    <Section id="how" eyebrow="How it works" title="Five steps from activity to action" tone="band">
      <ol className={styles.steps}>
        {STEPS.map((step, index) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.stepIcon}><step.icon size={20} aria-hidden="true" /></span>
            <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepText}>{step.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

const CAPABILITIES = [
  { icon: LayoutDashboard, title: 'Financial overview', text: 'Cash, income, expenses and net result for any period, with the change from the previous one.', wide: true },
  { icon: Receipt, title: 'Transactions', text: 'Track, search and review activity. Rules and your own corrections suggest categories — you confirm.' },
  { icon: FileText, title: 'Invoices', text: 'Receivables and payables from draft to paid. A payment becomes a real transaction.' },
  { icon: FileScan, title: 'Documents', text: 'Upload receipts and invoices. Fields are read automatically when an AI provider is configured; otherwise you enter them in the same review flow.' },
  { icon: HeartPulse, title: 'Financial health', text: 'Five transparent signals — cash, profitability, revenue, expenses, collection — with their thresholds.' },
  { icon: Bot, title: 'Assistant', text: 'Ask about your cash, profit, invoices or forecast and get answers from your own figures, within stated limits.', wide: true },
];

export function Capabilities() {
  return (
    <Section
      id="product"
      eyebrow="Product"
      title="Everything a growing business needs to see"
      lead="One workspace for the full financial picture — each capability states how its results are produced."
    >
      <div className={styles.capabilities}>
        {CAPABILITIES.map((item) => (
          <article key={item.title} className={`${styles.capability} ${item.wide ? styles.wide : ''}`}>
            <span className={styles.capIcon}><item.icon size={20} aria-hidden="true" /></span>
            <h3 className={styles.capTitle}>{item.title}</h3>
            <p className={styles.capText}>{item.text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

const STATEMENTS = [
  { icon: Scale, title: 'Profit & loss', text: 'Revenue and expenses by category, with the previous period.' },
  { icon: FileSpreadsheet, title: 'Balance sheet', text: 'Assets, liabilities and equity — with incomplete figures flagged, not hidden.' },
  { icon: Waves, title: 'Cash flow statement', text: 'Opening to closing cash, tied to the same ledger.' },
  { icon: LineChart, title: 'Expense report', text: 'Every expense exactly once, grouped by category.' },
];

export function Reports() {
  return (
    <Section
      id="reports"
      eyebrow="Reports"
      title="Statements you can actually read"
      lead="Practical, owner-facing financial statements generated on demand from your records — not certified statutory filings."
      align="start"
      tone="band"
    >
      <div className={styles.reports}>
        {STATEMENTS.map((item) => (
          <article key={item.title} className={styles.report}>
            <item.icon size={20} aria-hidden="true" className={styles.reportIcon} />
            <h3 className={styles.capTitle}>{item.title}</h3>
            <p className={styles.capText}>{item.text}</p>
            <span className={styles.reportLines} aria-hidden="true"><i /><i /><i /></span>
          </article>
        ))}
      </div>
    </Section>
  );
}
