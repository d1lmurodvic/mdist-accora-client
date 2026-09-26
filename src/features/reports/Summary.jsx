import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { Scale, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { StatCard } from '../../components/finance/StatCard.jsx';
import { MoneyValue } from '../../components/finance/Finance.jsx';
import { Segmented } from '../ledger/inputs.jsx';
import { formatDate, formatMoney, formatPeriod } from '../../lib/format.js';
import { drilldownPath } from '../../lib/links.js';
import { useOverview, useRevenueVsExpenses } from './api.js';
import { CategoryRows, StatementHead } from './parts.jsx';
import styles from './Reports.module.css';

const BUCKET_LABEL = {
  day: (iso) => formatDate(iso, { month: 'short', day: 'numeric' }),
  week: (iso) => `Week of ${formatDate(iso, { month: 'short', day: 'numeric' })}`,
  month: (iso) => formatDate(iso, { month: 'short', year: 'numeric' }),
};

/** Income and expenses per bucket, exactly as the API grouped them. */
function RevenueChart({ data, granularity }) {
  const currency = data.currency;
  const points = data.series.map((bucket) => ({ start: bucket.start, income: bucket.income.amount, expenses: bucket.expenses.amount, net: bucket.net, drilldown: bucket.drilldown }));
  if (points.length === 0) return <p className={styles.chartEmpty}>No income or expenses in this period.</p>;
  const label = BUCKET_LABEL[granularity] ?? BUCKET_LABEL.month;
  return (
    <div className={styles.chart} role="img" aria-label={`Income and expenses by ${granularity}, ${formatPeriod(data.period)}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="var(--color-divider)" />
          <XAxis dataKey="start" tickFormatter={(iso) => (granularity === 'month' ? formatDate(iso, { month: 'short' }) : formatDate(iso, { month: 'short', day: 'numeric' }))} tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} minTickGap={12} />
          <YAxis width={64} tickFormatter={(v) => formatMoney({ amount: v, currency }, { compact: true }).replace(` ${currency}`, '')} tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'var(--color-surface-muted)' }}
            content={({ active, payload }) => (active && payload?.length ? (
              <div className={styles.tooltip}>
                <span>{label(payload[0].payload.start)}</span>
                <span>Income <strong className="tabular">{formatMoney({ amount: payload[0].payload.income, currency })}</strong></span>
                <span>Expenses <strong className="tabular">{formatMoney({ amount: payload[0].payload.expenses, currency })}</strong></span>
                <span>Net <strong className="tabular">{formatMoney(payload[0].payload.net)}</strong></span>
              </div>
            ) : null)}
          />
          <Bar dataKey="income" name="Income" fill="var(--color-success)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          <Bar dataKey="expenses" name="Expenses" fill="var(--color-danger)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CategoryCard({ title, lines, goodWhen, period, empty }) {
  return (
    <Card>
      <CardHeader title={title} description="Share of the period total. Select a category to see its transactions." />
      {lines.length === 0 ? <p className={styles.chartEmpty}>{empty}</p> : (
        <div className={styles.tableWrap}>
          <table className={styles.statement}>
            <StatementHead period={period} first="Category" />
            <tbody><CategoryRows lines={lines} goodWhen={goodWhen} withPrevious={false} /></tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/** The period at a glance: headline figures, income vs expenses over time, and where money came from and went. */
export function Summary({ period, granularity, onGranularity }) {
  const overview = useOverview(period);
  const breakdown = useRevenueVsExpenses(period, granularity);
  const o = overview.data?.data;
  const b = breakdown.data?.data;
  const hint = o ? `vs ${formatPeriod(o.previousPeriod)}` : undefined;
  const incomeLink = b && drilldownPath({ path: '/api/v1/transactions', query: { type: 'income', from: b.period.start, to: b.period.end } });
  const expenseLink = b && drilldownPath({ path: '/api/v1/transactions', query: { type: 'expense', from: b.period.start, to: b.period.end } });

  return (
    <div className={styles.stack}>
      {overview.isError ? <Card><ErrorState error={overview.error} onRetry={() => overview.refetch()} /></Card> : (
        <div className={styles.stats}>
          <StatCard loading={overview.isPending} label="Income" icon={TrendingUp} money={o?.income} change={o?.change.income.basisPoints} goodWhen="up" hint={hint} to={incomeLink} />
          <StatCard loading={overview.isPending} label="Expenses" icon={TrendingDown} money={o?.expenses} change={o?.change.expenses.basisPoints} goodWhen="down" hint={hint} to={expenseLink} />
          <StatCard loading={overview.isPending} label="Net result" icon={Scale} money={o?.netResult} change={o?.change.netResult.basisPoints} goodWhen="up" hint={o ? `${o.transactionCount} transactions · cash basis` : undefined} />
          <StatCard
            loading={overview.isPending}
            label="Cash at period end"
            icon={Wallet}
            money={o?.cash.closing}
            footer={o && <span className={styles.count}>Opening <MoneyValue money={o.cash.opening} size="sm" /> · movement <MoneyValue money={o.cash.netMovement} size="sm" signDisplay="exceptZero" /></span>}
          />
        </div>
      )}

      <Card>
        <CardHeader
          title="Income vs expenses"
          description={b ? formatPeriod(b.period) : undefined}
          action={(
            <Segmented
              label="Group by"
              value={granularity}
              onChange={onGranularity}
              options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]}
            />
          )}
        />
        <div className={styles.legend}>
          <span><i className={`${styles.swatch} ${styles.swatchIncome}`} />Income</span>
          <span><i className={`${styles.swatch} ${styles.swatchExpense}`} />Expenses</span>
        </div>
        {breakdown.isPending ? <CardSkeleton lines={5} />
          : breakdown.isError ? <ErrorState error={breakdown.error} compact onRetry={() => breakdown.refetch()} />
            : <RevenueChart data={b} granularity={granularity} />}
      </Card>

      {b && !breakdown.isError && (b.empty ? (
        <Card>
          <EmptyState
            title="No income or expenses in this period"
            description="Reports are built from your recorded transactions."
            action={<Link to="/app/transactions">Go to transactions</Link>}
          />
        </Card>
      ) : (
        <div className={styles.split}>
          <CategoryCard title="Income by category" lines={b.incomeByCategory} goodWhen="up" period={b.period} empty="No income in this period." />
          <CategoryCard title="Expenses by category" lines={b.expensesByCategory} goodWhen="down" period={b.period} empty="No expenses in this period." />
        </div>
      ))}
    </div>
  );
}
