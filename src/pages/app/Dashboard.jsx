import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, Receipt, Scale, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { PageHeader } from '../../components/ui/Page.jsx';
import { GlassCard } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert, CardSkeleton, EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx';
import { DateRangeSelector } from '../../components/ui/DateRangeSelector.jsx';
import { MoneyValue } from '../../components/finance/Finance.jsx';
import { StatCard } from '../../components/finance/StatCard.jsx';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { describeError } from '../../lib/api/errors.js';
import { formatDate, formatPeriod } from '../../lib/format.js';
import { appPathFor } from '../../lib/links.js';
import { useActivity, useCashFlow, useDashboard, useLoadDemoData, usePeriodParam } from '../../features/dashboard/api.js';
import { ActivityCard, AnomaliesCard, ForecastCard, HealthCard, InsightsCard, OutstandingCard } from '../../features/dashboard/widgets.jsx';
import styles from '../../features/dashboard/Dashboard.module.css';

// The chart library is loaded separately, so the figures render first.
const CashChart = lazy(() => import('../../features/dashboard/CashChart.jsx').then((module) => ({ default: module.CashChart })));

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

/**
 * The home screen (PRODUCT_REQUIREMENTS.md #4): one GET /dashboard for the
 * figures, plus the cash-flow series for the chart and the activity feed.
 * Every card links to the screen that explains it.
 */
export default function Dashboard() {
  const { user, role } = useAuth();
  const [period, setPeriod] = usePeriodParam();
  const dashboard = useDashboard(period);
  const data = dashboard.data?.data;
  const cashFlow = useCashFlow(period, { enabled: Boolean(data) && !data.empty });
  const activity = useActivity();
  const firstName = user?.name?.split(/\s+/)[0];

  const header = (
    <PageHeader
      eyebrow={data?.company?.name}
      title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
      description={data ? `Showing ${formatPeriod(data.period)}, compared with ${formatPeriod(data.previousPeriod)}.` : 'Your financial position at a glance.'}
      actions={<DateRangeSelector value={period} onChange={setPeriod} resolved={data?.period} />}
    />
  );

  if (dashboard.isPending) return <>{header}<DashboardSkeleton /></>;
  if (dashboard.isError) return <>{header}<GlassCard><ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} title="The dashboard could not be loaded" /></GlassCard></>;

  const { capabilities } = dashboard.data.meta ?? {};
  return (
    <>
      {header}
      {data.company.isDemo && (
        <div className={styles.demo}>
          <Alert tone="warning" title="Demo data">This is a fictional company loaded for demonstration. Every figure is calculated from its records; remove it in Settings.</Alert>
        </div>
      )}

      {data.empty ? (
        <EmptyWorkspace canLoadDemo={role === 'owner'} />
      ) : (
        <div className={`${styles.layout} ${dashboard.isFetching ? styles.refreshing : ''}`}>
          <GlassCard size="hero" padding="lg" className={styles.hero}>
            <div className={styles.heroMain}>
              <span className={styles.heroLabel}><Wallet size={16} aria-hidden="true" /> Cash position</span>
              <MoneyValue money={data.cash.current} size="xl" />
              <span className={styles.heroSub}>Cash and bank accounts, as of {formatDate(data.cash.asOf)}</span>
              <dl className={styles.heroFacts}>
                <div><dt>Period opening</dt><dd><MoneyValue money={data.cash.opening} size="sm" /></dd></div>
                <div><dt>Period closing</dt><dd><MoneyValue money={data.cash.closing} size="sm" /></dd></div>
              </dl>
              <Link to={appPathFor(data.cash.link)} className={styles.heroLink}>Cash flow →</Link>
            </div>
            <div className={styles.heroChart}>
              {cashFlow.isPending ? <Skeleton height="100%" radius={20} /> : cashFlow.isError ? <p className={styles.chartEmpty}>The cash chart could not be loaded.</p> : <Suspense fallback={<Skeleton height="100%" radius={20} />}><CashChart flow={cashFlow.data} /></Suspense>}
            </div>
          </GlassCard>

          <div className={styles.stats}>
            <StatCard label="Income" icon={TrendingUp} money={data.income.amount} change={data.income.change.basisPoints} goodWhen="up" to={appPathFor(data.income.link)} />
            <StatCard label="Expenses" icon={TrendingDown} money={data.expenses.amount} change={data.expenses.change.basisPoints} goodWhen="down" to={appPathFor(data.expenses.link)} />
            <StatCard
              label="Net result"
              icon={Scale}
              money={data.netResult.amount}
              change={data.netResult.change.basisPoints}
              goodWhen="up"
              to={appPathFor(data.netResult.link)}
              hint={`${data.transactionCount} transactions · cash basis`}
            />
          </div>

          <div className={styles.row3}>
            <OutstandingCard outstanding={data.outstandingInvoices} />
            <ForecastCard forecast={data.forecast} capability={capabilities?.forecast} />
            <HealthCard health={data.health} />
          </div>

          <div className={styles.row2}>
            <InsightsCard insights={data.insights} />
            <div className={styles.stack}>
              <AnomaliesCard anomalies={data.anomalies} />
              <ActivityCard query={activity} />
            </div>
          </div>

          <p className={styles.disclaimer}>
            Changes compare with the previous period. Figures are calculated by Accora from your records on a cash basis.
          </p>
        </div>
      )}
    </>
  );
}

function EmptyWorkspace({ canLoadDemo }) {
  const loadDemo = useLoadDemoData();
  const toast = useToast();
  return (
    <GlassCard size="hero" padding="lg">
      <EmptyState
        icon={Receipt}
        title="Your books are empty"
        description="Record your accounts and transactions to see cash, income, expenses and insights here. Nothing is shown until there is real data."
        action={(
          <>
            <Link to="/app/transactions?new=1" className={styles.emptyLink}>Record a transaction</Link>
            {canLoadDemo && (
              <Button
                icon={FlaskConical}
                loading={loadDemo.isPending}
                onClick={() => loadDemo.mutate(undefined, {
                  onSuccess: () => toast.success('Demo data loaded', 'A fictional company is now shown. You can remove it later.'),
                  onError: (error) => toast.error('Demo data could not be loaded', describeError(error)),
                })}
              >
                Explore with demo data
              </Button>
            )}
          </>
        )}
      />
      {canLoadDemo && <p className={styles.emptyNote}><Badge tone="warning">Fictional</Badge> Demo data is clearly labelled and only loads into an empty workspace.</p>}
    </GlassCard>
  );
}

function DashboardSkeleton() {
  return (
    <div className={styles.layout} aria-busy="true" aria-label="Loading dashboard">
      <div className={styles.heroSkeleton}><Skeleton width="30%" height={14} /><Skeleton width="55%" height={44} radius={12} /><Skeleton height={120} radius={20} /></div>
      <div className={styles.stats}><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      <div className={styles.row3}><CardSkeleton lines={4} /><CardSkeleton lines={4} /><CardSkeleton lines={4} /></div>
    </div>
  );
}
