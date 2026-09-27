import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/Page.jsx';
import { Tabs } from '../../components/ui/Menu.jsx';
import { DateRangeSelector } from '../../components/ui/DateRangeSelector.jsx';
import { usePeriodParam } from '../../features/dashboard/api.js';
import { AnomaliesPanel, InsightsPanel } from '../../features/intelligence/Findings.jsx';
import { ForecastPanel, HealthPanel } from '../../features/intelligence/Outlook.jsx';
import { AssistantPanel } from '../../features/intelligence/Assistant.jsx';
import styles from '../../features/reports/Reports.module.css';

const TABS = [
  { id: 'insights', label: 'Insights' },
  { id: 'anomalies', label: 'Unusual activity' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'health', label: 'Health' },
  { id: 'assistant', label: 'Assistant' },
];
const WITH_PERIOD = new Set(['insights', 'anomalies', 'health']);

/**
 * Intelligence (PRODUCT_REQUIREMENTS.md #13–#17): insights, unusual
 * transactions, the cash forecast, financial health and the assistant. Each
 * shows the method the backend used — rules and statistics, not an AI model.
 */
export default function Intelligence() {
  const [params, setParams] = useSearchParams();
  const [period, setPeriod] = usePeriodParam();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'insights';
  const horizon = [30, 60, 90].includes(Number(params.get('horizon'))) ? Number(params.get('horizon')) : 30;
  const update = (changes) => setParams((current) => {
    const next = new URLSearchParams(current);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, String(value)) : next.delete(key)));
    return next;
  }, { replace: true });

  return (
    <>
      <PageHeader
        title="Intelligence"
        description="What changed, what looks unusual, where cash is heading and how healthy the business is — each from your own records, with the method shown."
      />
      <div className={styles.controls}>
        <Tabs tabs={TABS} value={tab} onChange={(id) => update({ tab: id === 'insights' ? null : id })} label="Intelligence" />
        {WITH_PERIOD.has(tab) && <DateRangeSelector value={period} onChange={setPeriod} />}
      </div>
      {tab === 'insights' && <InsightsPanel period={period} />}
      {tab === 'anomalies' && <AnomaliesPanel period={period} />}
      {tab === 'forecast' && <ForecastPanel horizon={horizon} onHorizon={(h) => update({ horizon: h === 30 ? null : h })} />}
      {tab === 'health' && <HealthPanel period={period} />}
      {tab === 'assistant' && <AssistantPanel />}
    </>
  );
}
