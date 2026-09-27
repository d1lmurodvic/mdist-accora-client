import { Link } from 'react-router-dom';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, LineChart, RefreshCw } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Alert, CardSkeleton, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { ConfidenceBadge, MoneyValue, PercentageValue, StatusBadge } from '../../components/finance/Finance.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { describeError } from '../../lib/api/errors.js';
import { formatDate, formatMoney, formatPeriod, formatRelativeTime } from '../../lib/format.js';
import { appPathFor } from '../../lib/links.js';
import { Segmented } from '../ledger/inputs.jsx';
import { useForecast, useGenerateForecast, useHealth } from './api.js';
import { Capability } from './Findings.jsx';
import styles from './Intelligence.module.css';

function Stat({ label, children }) {
  return <div className={styles.stat}><dt>{label}</dt><dd>{children}</dd></div>;
}

function ForecastChart({ forecast }) {
  const currency = forecast.currency;
  const points = [
    { date: forecast.asOf, balance: forecast.startingCash.amount, confidence: null },
    ...forecast.series.map((day) => ({ date: day.date, balance: day.balance.amount, inflow: day.inflow, outflow: day.outflow, confidence: day.confidence })),
  ];
  return (
    <div className={styles.chart} role="img" aria-label={`Projected cash from ${formatDate(forecast.asOf)} to ${formatDate(points.at(-1).date)}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tickFormatter={(iso) => formatDate(iso, { month: 'short', day: 'numeric' })} tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis width={64} tickFormatter={(v) => formatMoney({ amount: v, currency }, { compact: true }).replace(` ${currency}`, '')} tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
          <ReferenceLine y={0} stroke="var(--color-danger)" strokeDasharray="4 4" />
          <Tooltip
            content={({ active, payload }) => (active && payload?.length ? (
              <div className={styles.tooltip}>
                <span>{formatDate(payload[0].payload.date)}</span>
                <strong className="tabular">{formatMoney({ amount: payload[0].payload.balance, currency })}</strong>
                {payload[0].payload.confidence !== null && <span>{Math.round(payload[0].payload.confidence * 100)}% confidence</span>}
              </div>
            ) : null)}
          />
          <Area type="monotone" dataKey="balance" stroke="var(--color-primary)" strokeWidth={2} fill="url(#forecastFill)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const EXCLUDED_REASON = { overdue_receivable: 'Overdue receivable — not counted on' };

/** POST /forecast and GET /forecast/latest: a deterministic projection with every assumption shown. */
export function ForecastPanel({ horizon, onHorizon }) {
  const toast = useToast();
  const query = useForecast();
  const generate = useGenerateForecast();
  const f = query.data?.data;
  const run = () => generate.mutate(horizon, {
    onSuccess: () => toast.success('Forecast updated', `${horizon}-day projection from today's balances.`),
    onError: (error) => toast.error('Could not build the forecast', describeError(error)),
  });
  const different = f && f.horizonDays !== horizon;

  return (
    <>
      <div className={styles.toolbar}>
        <Segmented label="Horizon" value={horizon} onChange={onHorizon} options={[30, 60, 90].map((d) => ({ value: d, label: `${d} days` }))} />
        <Button icon={RefreshCw} loading={generate.isPending} onClick={run}>{f ? 'Rebuild forecast' : 'Build forecast'}</Button>
      </div>
      <Capability meta={query.data?.meta} />
      {query.isPending ? <CardSkeleton lines={6} />
        : query.isError ? <Card><ErrorState error={query.error} onRetry={() => query.refetch()} /></Card>
          : !f ? (
            <Card>
              <EmptyState
                icon={LineChart}
                title="No forecast yet"
                description="Build a projection from your current cash, recurring income and expenses, and unpaid invoices. Every assumption is shown."
                action={<Button icon={RefreshCw} loading={generate.isPending} onClick={run}>Build forecast</Button>}
              />
            </Card>
          ) : (
            <div className={styles.stack}>
              {f.stale && <Alert tone="warning" title="This forecast is out of date">Your records or the date changed since it was built. Rebuild it to include them.</Alert>}
              {different && !f.stale && <Alert tone="info" title={`Showing the latest ${f.horizonDays}-day forecast`}>Rebuild to project {horizon} days.</Alert>}
              {f.belowZero.crosses && <Alert tone="danger" title={`Cash is projected to fall below zero on ${formatDate(f.belowZero.firstDate)}`}>Review the upcoming bills and recurring expenses below.</Alert>}
              {f.assumptions.lowHistoryNote && <Alert tone="warning" title="Limited history">{f.assumptions.lowHistoryNote}</Alert>}
              <Card>
                <CardHeader
                  title={`${f.horizonDays}-day cash projection`}
                  description={`From ${formatDate(f.asOf)} · built ${formatRelativeTime(f.generatedAt)}`}
                  action={<ConfidenceBadge confidence={f.confidence} />}
                />
                <dl className={styles.stats}>
                  <Stat label="Cash today"><MoneyValue money={f.startingCash} size="md" /></Stat>
                  <Stat label={`In ${f.horizonDays} days`}><MoneyValue money={f.endingBalance} size="md" semantic /></Stat>
                  <Stat label="Lowest point"><MoneyValue money={f.minimum.balance} size="md" semantic /><span className={styles.meta}>{formatDate(f.minimum.date)}</span></Stat>
                  <Stat label="Runway">
                    <span className={styles.statText}>{f.runway.beyondHorizon ? `Beyond ${f.horizonDays} days` : `${f.runway.days} days`}</span>
                    {f.runway.date && <span className={styles.meta}>until {formatDate(f.runway.date)}</span>}
                  </Stat>
                </dl>
                <ForecastChart forecast={f} />
                <p className={styles.meta}>Confidence at the horizon: {Math.round(f.confidence * 100)}%. It falls the further ahead a day is. A projection, not a prediction.</p>
              </Card>
              <div className={styles.split}>
                <Card>
                  <CardHeader title="Recurring payments used" description="Counterparties seen on a steady cadence." />
                  {f.assumptions.recurring.length === 0 ? <p className={styles.meta}>None detected.</p> : (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead><tr><th>Counterparty</th><th>Cadence</th><th className={styles.num}>Amount</th></tr></thead>
                        <tbody>
                          {f.assumptions.recurring.map((r) => (
                            <tr key={`${r.counterparty}-${r.type}`}>
                              <td>{r.counterparty}<div className={styles.meta}>{r.type} · next {r.projectedDates[0] ? formatDate(r.projectedDates[0]) : '—'}</div></td>
                              <td>{r.cadence}</td>
                              <td className={styles.num}><MoneyValue money={r.amount} size="sm" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {f.assumptions.lapsedPatterns.length > 0 && <p className={styles.meta}>{f.assumptions.lapsedPatterns.length} lapsed pattern(s) left out.</p>}
                </Card>
                <Card>
                  <CardHeader title="Invoices" description="Unpaid invoices on their due dates." />
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Invoice</th><th>Expected</th><th className={styles.num}>Total</th></tr></thead>
                      <tbody>
                        {f.assumptions.invoicesIncluded.map((i) => (
                          <tr key={i.id}>
                            <td><Link to={`/app/invoices?open=${i.id}`}>{i.number}</Link><div className={styles.meta}>{i.type === 'payable' ? 'You pay' : 'You receive'} · {i.contact}</div></td>
                            <td>{formatDate(i.expectedDate)}</td>
                            <td className={styles.num}><MoneyValue money={i.total} size="sm" /></td>
                          </tr>
                        ))}
                        {f.assumptions.invoicesExcluded.map((i) => (
                          <tr key={i.id}>
                            <td><Link to={`/app/invoices?open=${i.id}`}>{i.number}</Link><div className={styles.meta}>{EXCLUDED_REASON[i.reason] ?? i.reason} · {i.contact}</div></td>
                            <td><Badge>Excluded</Badge></td>
                            <td className={styles.num}><MoneyValue money={i.total} size="sm" /></td>
                          </tr>
                        ))}
                        {f.assumptions.invoicesIncluded.length + f.assumptions.invoicesExcluded.length === 0 && <tr><td colSpan={3} className={styles.meta}>No unpaid invoices.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
              <Card>
                <CardHeader
                  title="How it is calculated"
                  description={`Other income and expenses: the daily average of the last ${f.assumptions.baseline.windowDays} days.`}
                />
                <dl className={styles.stats}>
                  <Stat label="Average daily income"><MoneyValue money={f.assumptions.baseline.income.dailyAverage} size="md" /><span className={styles.meta}>{f.assumptions.baseline.income.transactions} transactions</span></Stat>
                  <Stat label="Average daily expenses"><MoneyValue money={f.assumptions.baseline.expense.dailyAverage} size="md" /><span className={styles.meta}>{f.assumptions.baseline.expense.transactions} transactions</span></Stat>
                  <Stat label="History used"><span className={styles.statText}>{f.history.days} days</span><span className={styles.meta}>{f.history.transactions} transactions</span></Stat>
                </dl>
                <ol className={styles.rules}>{f.assumptions.rules.map((rule) => <li key={rule}>{rule}</li>)}</ol>
              </Card>
            </div>
          )}
    </>
  );
}

function ComponentValue({ component }) {
  const v = component.value;
  switch (component.id) {
    case 'cash_position':
      return <><span className={styles.statText}>{v.runwayMonths} months of expenses</span><span className={styles.meta}>Cash <MoneyValue money={v.cash} size="sm" /> · average monthly expenses <MoneyValue money={v.averageMonthlyExpenses} size="sm" /></span></>;
    case 'profitability':
      return <><span className={styles.statText}><PercentageValue basisPoints={v.netMarginBasisPoints} /> net margin</span><span className={styles.meta}>Net <MoneyValue money={v.netResult} size="sm" /> of income <MoneyValue money={v.income} size="sm" /></span></>;
    case 'revenue_trend':
      return <><span className={styles.statText}><PercentageValue basisPoints={v.changeBasisPoints} signDisplay="exceptZero" /> income</span><span className={styles.meta}><MoneyValue money={v.income} size="sm" /> vs <MoneyValue money={v.previousIncome} size="sm" /></span></>;
    case 'expense_control':
      return <><span className={styles.statText}><PercentageValue basisPoints={v.changeBasisPoints} signDisplay="exceptZero" /> expenses</span><span className={styles.meta}><MoneyValue money={v.expenses} size="sm" /> vs <MoneyValue money={v.previousExpenses} size="sm" /></span></>;
    case 'invoice_collection':
      return <><span className={styles.statText}><PercentageValue basisPoints={v.overdueShareBasisPoints} /> overdue</span><span className={styles.meta}><MoneyValue money={v.overdue} size="sm" /> of <MoneyValue money={v.outstanding} size="sm" /> outstanding · {v.overdueCount} invoice(s)</span></>;
    default:
      return null;
  }
}

const OVERALL_LABEL = { healthy: 'Healthy', fair: 'Fair', at_risk: 'At risk', insufficient_data: 'Not enough data' };

/** GET /financials/health: five rule-based components with their thresholds. */
export function HealthPanel({ period }) {
  const query = useHealth(period);
  const h = query.data?.data;
  if (query.isPending) return <CardSkeleton lines={6} />;
  if (query.isError) return <Card><ErrorState error={query.error} onRetry={() => query.refetch()} /></Card>;
  return (
    <div className={styles.stack}>
      <Capability meta={query.data.meta} />
      <Card>
        <div className={styles.overall}>
          <span className={`${styles.score} ${styles[`score_${h.overall.status}`] ?? ''}`} aria-label={h.overall.score === null ? 'No score' : `Score ${h.overall.score} of 100`}>
            {h.overall.score ?? '—'}
          </span>
          <div>
            <CardHeader title={`Financial health · ${OVERALL_LABEL[h.overall.status] ?? h.overall.status}`} description={`${formatPeriod(h.period)} · ${h.overall.componentsUsed} of 5 components used · equal weights`} />
            <p className={styles.meta}>{h.disclaimer}</p>
          </div>
        </div>
      </Card>
      <div className={styles.components}>
        {h.components.map((c) => {
          const to = appPathFor(c.link);
          return (
            <Card key={c.id} className={styles.component}>
              <div className={styles.itemHead}>
                <h3 className={styles.itemTitle}>{c.label}</h3>
                {c.available ? <StatusBadge status={c.status} /> : <Badge>Not enough data</Badge>}
              </div>
              {c.available ? (
                <>
                  <div className={styles.componentValue}><ComponentValue component={c} /></div>
                  <ul className={styles.thresholds}>
                    {Object.entries(c.thresholds).map(([level, text]) => <li key={level}><strong>{level}:</strong> {text}</li>)}
                  </ul>
                  <span className={styles.meta}>Score {c.score} · weight {c.weightPercent}%</span>
                </>
              ) : <p className={styles.body}>{c.reason}</p>}
              {to && <Link to={to} className={styles.seeLink}><Activity size={13} aria-hidden="true" /> See the figures</Link>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
