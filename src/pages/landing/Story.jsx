import { ArrowRight, Camera, CheckCheck, FileScan, FileSpreadsheet, FileText, FolderSearch, LayoutDashboard, LineChart, ListChecks, Receipt, Scale, Tags, TrendingUp, Users, Waves } from 'lucide-react';
import { Section } from './Section.jsx';
import styles from './Story.module.css';

const PROBLEMS = [
  { icon: FolderSearch, text: 'Receipts spread across phones, inboxes and folders' },
  { icon: FileText, text: 'Vendor details and invoice totals typed in by hand' },
  { icon: Tags, text: 'Expenses waiting to be categorized' },
  { icon: FileSpreadsheet, text: 'Financial reports waiting on unfinished paperwork' },
];
const CHAIN = ['Photo or upload', 'Extracted document details', 'Your review and approval', 'Saved transaction', 'Updated financial reports'];

export function ProblemSolution() {
  return (
    <Section
      id="why"
      eyebrow="Why Accora"
      title="Less paperwork. A clearer financial picture."
      lead="Accora helps small and mid-sized businesses turn invoices and receipts into organized financial data, with less manual entry."
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
          <p className={styles.sideLabel}>With Accora</p>
          <ol className={styles.chain}>
            {CHAIN.map((step, index) => (
              <li key={step} style={{ '--i': index }}>
                <span className={styles.chainDot} aria-hidden="true" />
                {step}
              </li>
            ))}
          </ol>
          <p className={styles.solutionNote}>Review the extracted details and suggested category. After you approve, Accora saves a transaction and updates your company’s financial data.</p>
        </div>
      </div>
    </Section>
  );
}

const STEPS = [
  { icon: Camera, title: 'Capture', text: 'Take a photo of an invoice or receipt, or upload a document.' },
  { icon: FileScan, title: 'Extract', text: 'Accora reads the vendor, date, amount, tax, currency, invoice number and line items.' },
  { icon: ListChecks, title: 'Review', text: 'Check the extracted information and suggested category. Correct anything that needs attention.' },
  { icon: CheckCheck, title: 'Approve', text: 'Approve the details to save the document as a transaction.' },
  { icon: LayoutDashboard, title: 'Understand', text: 'Your financial data updates, helping you track spending and understand your business.' },
];

export function HowItWorks() {
  return (
    <Section id="how" eyebrow="How it works" title="From a document to a transaction" tone="band">
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
  { icon: FileScan, title: 'Invoice & receipt processing', text: 'Turn photos and uploads into structured financial data. Review extracted details and category suggestions before approving.', wide: true },
  { icon: Receipt, title: 'Transactions', text: 'Track income and expenses in one place, with organized categories and records you can review.' },
  { icon: FileText, title: 'Customer invoices', text: 'Create and manage customer invoices, follow due dates and track payments.' },
  { icon: LineChart, title: 'Reports', text: 'Understand profit and loss, cash flow and expense breakdowns from your financial records.' },
  { icon: TrendingUp, title: 'Forecast', text: 'See expected income, expenses and future cash balance, with the assumptions behind the projection.' },
  { icon: Users, title: 'Accountant access', text: 'Planned: a simple way for your business and accountant to work with the same financial information.', wide: true },
];

export function Capabilities() {
  return (
    <Section
      id="product"
      eyebrow="Product"
      title="Start with a receipt. See the bigger picture."
      lead="Document processing is the starting point. Transactions, invoices, reports and forecasts help you manage what comes next."
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
      lead="See how your business is doing with profit and loss, cash flow and expense breakdowns based on your records."
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
