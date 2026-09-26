import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/Page.jsx';
import { Tabs } from '../../components/ui/Menu.jsx';
import { Field, Input } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { DateRangeSelector } from '../../components/ui/DateRangeSelector.jsx';
import { usePeriodParam } from '../../features/dashboard/api.js';
import { Summary } from '../../features/reports/Summary.jsx';
import { BalanceSheet, CashFlow, ExpenseReport, ProfitAndLoss } from '../../features/reports/Statements.jsx';
import styles from '../../features/reports/Reports.module.css';

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'profit-and-loss', label: 'Profit & loss' },
  { id: 'balance-sheet', label: 'Balance sheet' },
  { id: 'cash-flow', label: 'Cash flow' },
  { id: 'expenses', label: 'Expenses' },
];
const SHORT_PERIODS = new Set(['this_month', 'last_month', 'last_30_days']);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reports (PRODUCT_REQUIREMENTS.md #5–#7, #12): the period summary and the
 * owner-facing statements. The tab, period, grouping and balance-sheet date
 * live in the URL, so a report can be reloaded or shared as it is.
 */
export default function Reports() {
  const [params, setParams] = useSearchParams();
  const [period, setPeriod] = usePeriodParam();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'summary';
  const group = ['day', 'week', 'month'].includes(params.get('group')) ? params.get('group') : SHORT_PERIODS.has(period.period) ? 'week' : 'month';
  const asOf = ISO.test(params.get('asOf') ?? '') ? params.get('asOf') : undefined;

  const update = (changes) => setParams((current) => {
    const next = new URLSearchParams(current);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    return next;
  }, { replace: true });

  return (
    <>
      <PageHeader
        title="Reports"
        description="Your figures for any period and your financial statements, all calculated by IFRSmart from your transactions."
      />
      <div className={styles.controls}>
        <Tabs tabs={TABS} value={tab} onChange={(id) => update({ tab: id === 'summary' ? null : id })} label="Reports" />
        <div className={styles.controlsEnd}>
          {tab === 'balance-sheet' ? (
            <div className={styles.asOf}>
              <Field label="As of">{(p) => <Input type="date" value={asOf ?? ''} onChange={(e) => update({ asOf: ISO.test(e.target.value) ? e.target.value : null })} {...p} />}</Field>
              {asOf && <Button variant="ghost" size="sm" onClick={() => update({ asOf: null })}>Today</Button>}
            </div>
          ) : (
            <DateRangeSelector value={period} onChange={setPeriod} />
          )}
        </div>
      </div>

      {tab === 'summary' && <Summary period={period} granularity={group} onGranularity={(value) => update({ group: value })} />}
      {tab === 'profit-and-loss' && <ProfitAndLoss period={period} />}
      {tab === 'balance-sheet' && <BalanceSheet asOf={asOf} />}
      {tab === 'cash-flow' && <CashFlow period={period} />}
      {tab === 'expenses' && <ExpenseReport period={period} />}
    </>
  );
}
