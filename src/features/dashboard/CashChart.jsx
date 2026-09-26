import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDate, formatMoney } from '../../lib/format.js';
import styles from './Dashboard.module.css';

/**
 * The running cash balance the API returned for the period: the opening
 * balance at the period start, then each bucket's closing balance. Days
 * without movement are not returned, so the line steps between points.
 */
export function CashChart({ flow }) {
  if (!flow) return null;
  const currency = flow.currency;
  const points = [
    { date: flow.period.start, balance: flow.openingCash.amount },
    ...flow.series.map((bucket) => ({ date: bucket.start, balance: bucket.closingBalance.amount })),
  ];
  if (points.length < 2) return <p className={styles.chartEmpty}>No cash movement in this period yet.</p>;

  return (
    <div className={styles.chart} role="img" aria-label={`Cash balance from ${formatDate(points[0].date)} to ${formatDate(points.at(-1).date)}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Tooltip
            cursor={{ stroke: 'var(--color-border-strong)', strokeDasharray: '3 3' }}
            content={({ active, payload }) => (active && payload?.length ? (
              <div className={styles.tooltip}>
                <span>{formatDate(payload[0].payload.date)}</span>
                <strong className="tabular">{formatMoney({ amount: payload[0].payload.balance, currency })}</strong>
              </div>
            ) : null)}
          />
          <Area type="stepAfter" dataKey="balance" stroke="var(--color-primary)" strokeWidth={2} fill="url(#cashFill)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
