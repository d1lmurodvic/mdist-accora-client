import { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { Dropdown } from './Menu.jsx';
import { Modal } from './Overlay.jsx';
import { Button } from './Button.jsx';
import { Field, Input } from './Field.jsx';
import { formatPeriod } from '../../lib/format.js';
import styles from './DateRangeSelector.module.css';

/**
 * Period selection exactly as the API accepts it (API_CONTRACT.md §7):
 * a preset, or `custom` with periodStart / periodEnd, end EXCLUSIVE.
 * The user picks an inclusive last day; it is converted to the exclusive end.
 *
 * value: { period, periodStart?, periodEnd? }; with `allowAll`, { period: 'all' } means no period filter. The server resolves presets
 * and echoes the actual dates in meta.period, which callers can pass as
 * `resolved` for the label.
 */
export const PERIOD_PRESETS = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'this_quarter', label: 'This quarter' },
  { id: 'this_year', label: 'This year' },
  { id: 'last_30_days', label: 'Last 30 days' },
];

function nextDay(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + 86400000).toISOString().slice(0, 10);
}
function previousDay(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) - 86400000).toISOString().slice(0, 10);
}

export function DateRangeSelector({ value, onChange, resolved, allowAll = false }) {
  const [customOpen, setCustomOpen] = useState(false);
  const [from, setFrom] = useState(value?.periodStart ?? '');
  const [through, setThrough] = useState(value?.periodEnd ? previousDay(value.periodEnd) : '');
  const preset = PERIOD_PRESETS.find((item) => item.id === value?.period);
  const label = value?.period === 'custom'
    ? formatPeriod({ start: value.periodStart, end: value.periodEnd })
    : value?.period === 'all' ? 'All time' : preset?.label ?? 'This month';
  const invalid = from && through && through < from;

  return (
    <>
      <Dropdown
        align="start"
        trigger={(
          <button type="button" className={styles.trigger}>
            <CalendarRange size={16} aria-hidden="true" />
            <span className={styles.label}>{label}</span>
            {resolved && !['custom', 'all'].includes(value?.period) && <span className={styles.range}>{formatPeriod(resolved)}</span>}
          </button>
        )}
        items={[
          ...(allowAll ? [{ label: 'All time', checked: value?.period === 'all', onSelect: () => onChange({ period: 'all' }) }] : []),
          ...PERIOD_PRESETS.map((item) => ({ label: item.label, checked: value?.period === item.id, onSelect: () => onChange({ period: item.id }) })),
          { separator: true },
          { label: 'Custom range…', checked: value?.period === 'custom', onSelect: () => setCustomOpen(true) },
        ]}
      />
      <Modal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        size="sm"
        title="Custom period"
        description="Both days are included."
        footer={(
          <>
            <Button variant="secondary" onClick={() => setCustomOpen(false)}>Cancel</Button>
            <Button
              disabled={!from || !through || invalid}
              onClick={() => { onChange({ period: 'custom', periodStart: from, periodEnd: nextDay(through) }); setCustomOpen(false); }}
            >
              Apply
            </Button>
          </>
        )}
      >
        <div className={styles.fields}>
          <Field label="From">{(props) => <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} {...props} />}</Field>
          <Field label="To" error={invalid ? 'Must be on or after the start date.' : undefined}>
            {(props) => <Input type="date" value={through} min={from || undefined} onChange={(e) => setThrough(e.target.value)} {...props} />}
          </Field>
        </div>
      </Modal>
    </>
  );
}
