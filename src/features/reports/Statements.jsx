import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Alert, CardSkeleton, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { MoneyValue, PercentageValue, TrendIndicator } from '../../components/finance/Finance.jsx';
import { formatDate, formatPeriod } from '../../lib/format.js';
import { drilldownPath } from '../../lib/links.js';
import { CashChart } from '../dashboard/CashChart.jsx';
import { useBalanceSheet, useCashFlowStatement, useCashSeries, useExpenseReport, useProfitAndLoss } from './api.js';
import { CategoryRows, Figures, Notes, SectionRow, StatementHead, TotalRow } from './parts.jsx';
import styles from './Reports.module.css';

/** Loading, failure and the statement itself — never a zero standing in for a failure. */
function Loaded({ query, children }) {
  if (query.isPending) return <Card><CardSkeleton lines={8} /></Card>;
  if (query.isError) return <Card><ErrorState error={query.error} onRetry={() => query.refetch()} /></Card>;
  return children(query.data.data, query.data.meta);
}

function NoActivity() {
  return (
    <EmptyState
      title="No transactions in this period"
      description="Statements are built from your recorded transactions. Choose another period or record income and expenses."
      action={<Link to="/app/transactions">Go to transactions</Link>}
    />
  );
}

const RESULT_LABEL = { profit: 'Profit', loss: 'Loss', break_even: 'Break-even' };

/** GET /reports/profit-and-loss: revenue and expenses by category, net result, margin. */
export function ProfitAndLoss({ period }) {
  const query = useProfitAndLoss(period);
  return (
    <Loaded query={query}>
      {(data, meta) => (
        <Card>
          <CardHeader
            title={`Profit & loss · ${data.company.name}`}
            description={`${formatPeriod(data.period)} compared with ${formatPeriod(data.previousPeriod)} · cash basis`}
            action={<Badge tone={data.netResult.result === 'loss' ? 'danger' : data.netResult.result === 'profit' ? 'success' : 'neutral'}>{RESULT_LABEL[data.netResult.result]}</Badge>}
          />
          {data.empty ? <NoActivity /> : (
            <>
              <Figures
                items={[
                  { label: 'Revenue', value: <MoneyValue money={data.revenue.amount} size="md" /> },
                  { label: 'Expenses', value: <MoneyValue money={data.expenses.amount} size="md" /> },
                  { label: 'Net result', value: <MoneyValue money={data.netResult.amount} size="md" semantic /> },
                  { label: 'Net margin', value: <span className={styles.figureText}><PercentageValue basisPoints={data.netMarginBasisPoints} /></span> },
                ]}
              />
              <div className={styles.tableWrap}>
                <table className={styles.statement}>
                  <caption className="sr-only">Profit and loss</caption>
                  <StatementHead period={data.period} previousPeriod={data.previousPeriod} />
                  <tbody>
                    <SectionRow label="Revenue" span={5} />
                    <CategoryRows lines={data.revenue.lines} goodWhen="up" />
                    <TotalRow label="Total revenue" figure={data.revenue} goodWhen="up" />
                    <SectionRow label="Expenses" span={5} />
                    <CategoryRows lines={data.expenses.lines} goodWhen="down" />
                    <TotalRow label="Total expenses" figure={data.expenses} goodWhen="down" />
                    <TotalRow label={`Net result (${RESULT_LABEL[data.netResult.result].toLowerCase()})`} figure={data.netResult} goodWhen="up" grand />
                  </tbody>
                </table>
              </div>
            </>
          )}
          <Notes notes={meta?.notes} />
        </Card>
      )}
    </Loaded>
  );
}

function AccountRows({ lines }) {
  return lines.map((line, index) => {
    const name = line.account?.name ?? line.label;
    const to = drilldownPath(line.drilldown);
    return (
      <tr key={line.account?.id ?? `${line.label}-${index}`}>
        <td><span className={styles.lineName}>{to ? <Link to={to}>{name}</Link> : name}</span></td>
        <td className={styles.num}><MoneyValue money={line.balance ?? line.amount} size="sm" /></td>
      </tr>
    );
  });
}

function SheetTotal({ label, money, grand }) {
  return (
    <tr className={grand ? styles.grandRow : styles.totalRow}>
      <td>{label}</td>
      <td className={styles.num}><MoneyValue money={money} size="sm" /></td>
    </tr>
  );
}

/** GET /reports/balance-sheet?asOf: assets = liabilities + equity, with what is incomplete said plainly. */
export function BalanceSheet({ asOf }) {
  const query = useBalanceSheet(asOf);
  return (
    <Loaded query={query}>
      {(data, meta) => (
        <div className={styles.stack}>
          {!data.completeness.complete && (
            <Alert tone="warning" title="Some figures are incomplete">
              <ul className={styles.issues}>{data.completeness.issues.map((issue) => <li key={issue.code}>{issue.message}</li>)}</ul>
            </Alert>
          )}
          <Card>
            <CardHeader
              title={`Balance sheet · ${data.company.name}`}
              description={`As of ${formatDate(data.asOf)} · cash basis`}
              action={<Badge tone={data.balanced ? 'success' : 'danger'} dot>{data.balanced ? 'Balanced' : 'Not balanced'}</Badge>}
            />
            <div className={styles.tableWrap}>
              <table className={styles.statement}>
                <caption className="sr-only">Balance sheet</caption>
                <thead><tr><th scope="col">Account</th><th scope="col" className={styles.num}>Balance</th></tr></thead>
                <tbody>
                  <SectionRow label="Assets" span={2} />
                  {data.assets.lines.length ? <AccountRows lines={data.assets.lines} /> : <tr><td colSpan={2} className={styles.muted}>No cash or bank accounts.</td></tr>}
                  <SheetTotal label="Total assets" money={data.assets.total} />
                  <SectionRow label="Liabilities" span={2} />
                  {data.liabilities.lines.length ? <AccountRows lines={data.liabilities.lines} /> : <tr><td colSpan={2} className={styles.muted}>No liability accounts.</td></tr>}
                  <SheetTotal label="Total liabilities" money={data.liabilities.total} />
                  <SectionRow label="Equity" span={2} />
                  <AccountRows lines={data.equity.lines} />
                  <SheetTotal label="Total equity" money={data.equity.total} />
                  <SheetTotal label="Total liabilities and equity" money={data.totalLiabilitiesAndEquity} grand />
                </tbody>
              </table>
            </div>
            <Notes notes={meta?.notes} />
          </Card>
          <Card>
            <CardHeader title="Memo: unpaid invoices" description="Not on a cash-basis balance sheet; shown for reference." action={<Link to="/app/invoices">Invoices</Link>} />
            <Figures
              items={[
                { label: `Owed to you · ${data.memo.unpaidReceivables.count}`, value: <MoneyValue money={data.memo.unpaidReceivables.total} size="md" /> },
                { label: `You owe · ${data.memo.unpaidPayables.count}`, value: <MoneyValue money={data.memo.unpaidPayables.total} size="md" /> },
              ]}
            />
          </Card>
        </div>
      )}
    </Loaded>
  );
}

function FlowRow({ label, money, strong, sign }) {
  return (
    <tr className={strong ? styles.totalRow : undefined}>
      <td>{label}</td>
      <td className={styles.num}><MoneyValue money={money} size="sm" signDisplay={sign} /></td>
    </tr>
  );
}

/** GET /reports/cash-flow-statement plus the running balance (GET /financials/cash-flow). */
export function CashFlow({ period }) {
  const query = useCashFlowStatement(period);
  const series = useCashSeries(period);
  return (
    <Loaded query={query}>
      {(data, meta) => {
        const operating = data.activities.operating;
        const obligations = series.data?.upcomingObligations;
        return (
          <div className={styles.stack}>
            <Card>
              <CardHeader title="Cash balance" description={formatPeriod(data.period)} />
              {series.isPending ? <CardSkeleton lines={4} /> : series.isError ? <ErrorState error={series.error} compact onRetry={() => series.refetch()} /> : <div className={styles.cashChart}><CashChart flow={series.data} /></div>}
              {obligations?.warning && <Alert tone="warning" title="Bills fall due before the period ends">{obligations.note}</Alert>}
              {obligations?.from && (
                <Figures
                  items={[
                    { label: `Bills due ${formatDate(obligations.from)} – ${formatDate(obligations.to)} · ${obligations.payables.count}`, value: <MoneyValue money={obligations.payables.total} size="md" /> },
                    { label: `Receivables due · ${obligations.receivables.count}`, value: <MoneyValue money={obligations.receivables.total} size="md" /> },
                  ]}
                />
              )}
            </Card>
            <Card>
              <CardHeader
                title={`Cash flow statement · ${data.company.name}`}
                description={`${formatPeriod(data.period)} · cash basis`}
                action={<Badge tone={data.reconciles ? 'success' : 'danger'} dot>{data.reconciles ? 'Reconciles' : 'Does not reconcile'}</Badge>}
              />
              <div className={styles.tableWrap}>
                <table className={styles.statement}>
                  <caption className="sr-only">Cash flow statement</caption>
                  <thead><tr><th scope="col">Line</th><th scope="col" className={styles.num}>Amount</th></tr></thead>
                  <tbody>
                    <FlowRow label="Opening cash" money={data.openingCash} strong />
                    <SectionRow label="Operating activities" span={2} />
                    {operating.inflows.map((line) => <FlowRow key={`in-${line.category.id}`} label={<CategoryLabel line={line} prefix="Received ·" />} money={line.total} />)}
                    <FlowRow label="Cash in" money={operating.cashIn} strong />
                    {operating.outflows.map((line) => <FlowRow key={`out-${line.category.id}`} label={<CategoryLabel line={line} prefix="Paid ·" />} money={line.total} />)}
                    <FlowRow label="Cash out" money={operating.cashOut} strong />
                    <FlowRow label="Net cash from operating activities" money={operating.netCash} sign="exceptZero" strong />
                    <SectionRow label="Investing activities" span={2} />
                    <tr><td colSpan={2} className={styles.muted}>{data.activities.investing === null ? 'Not classified — see the note below.' : ''}</td></tr>
                    <SectionRow label="Financing activities" span={2} />
                    <tr><td colSpan={2} className={styles.muted}>{data.activities.financing === null ? 'Not classified — see the note below.' : ''}</td></tr>
                    <FlowRow label="Net change in cash" money={data.netChange} sign="exceptZero" strong />
                    <tr className={styles.grandRow}><td>Closing cash</td><td className={styles.num}><MoneyValue money={data.closingCash} size="sm" /></td></tr>
                  </tbody>
                </table>
              </div>
              <Notes notes={[data.mapping?.description, ...(meta?.notes ?? [])].filter(Boolean)} />
            </Card>
          </div>
        );
      }}
    </Loaded>
  );
}

function CategoryLabel({ line, prefix }) {
  const to = drilldownPath(line.drilldown);
  return <span className={styles.lineName}>{prefix} {to ? <Link to={to}>{line.category.name}</Link> : line.category.name}</span>;
}

/** GET /reports/expense-report: every expense of the period, once, by category. */
export function ExpenseReport({ period }) {
  const query = useExpenseReport(period);
  return (
    <Loaded query={query}>
      {(data, meta) => (
        <Card>
          <CardHeader title="Expense report" description={`${formatPeriod(data.period)} compared with ${formatPeriod(data.previousPeriod)}`} />
          {data.empty ? <NoActivity /> : (
            <>
              <Figures
                items={[
                  { label: 'Total expenses', value: <MoneyValue money={data.total.amount} size="md" /> },
                  { label: 'Previous period', value: <MoneyValue money={data.total.previous} size="md" /> },
                  { label: 'Change', value: <TrendIndicator basisPoints={data.total.change.basisPoints} goodWhen="down" /> },
                  { label: 'Transactions', value: <span className="tabular">{data.transactionCount}</span> },
                ]}
              />
              <div className={styles.tableWrap}>
                <table className={styles.statement}>
                  <caption className="sr-only">Expenses by category</caption>
                  <StatementHead period={data.period} previousPeriod={data.previousPeriod} first="Category" />
                  <tbody>
                    <CategoryRows lines={data.groups} goodWhen="down" />
                    <TotalRow label="Total" figure={data.total} goodWhen="down" />
                  </tbody>
                </table>
              </div>
            </>
          )}
          <Notes notes={meta?.notes} />
        </Card>
      )}
    </Loaded>
  );
}
