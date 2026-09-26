import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { MoneyValue, PercentageValue, TrendIndicator } from '../../components/finance/Finance.jsx';
import { formatPeriod } from '../../lib/format.js';
import { drilldownPath } from '../../lib/links.js';
import styles from './Reports.module.css';

/*
 * Statement building blocks. They lay out lines the API returned — totals,
 * shares, previous figures and changes are all server values.
 */

/** Column headings for a period statement: this period, the comparison period, change, share. */
export function StatementHead({ period, previousPeriod, share = true, first = 'Line' }) {
  return (
    <thead>
      <tr>
        <th scope="col">{first}</th>
        <th scope="col" className={styles.num}>{period ? formatPeriod(period) : 'This period'}</th>
        {previousPeriod !== undefined && <th scope="col" className={`${styles.num} ${styles.optional}`}>{previousPeriod ? formatPeriod(previousPeriod) : 'Previous'}</th>}
        {previousPeriod !== undefined && <th scope="col" className={`${styles.num} ${styles.optional}`}>Change</th>}
        {share && <th scope="col" className={styles.num}>Share</th>}
      </tr>
    </thead>
  );
}

export function SectionRow({ label, span }) {
  return <tr className={styles.sectionRow}><td colSpan={span}>{label}</td></tr>;
}

function Share({ basisPoints }) {
  if (basisPoints === null || basisPoints === undefined) return <span className={styles.muted}>—</span>;
  return (
    <span className={styles.share}>
      <span className={styles.shareBar} aria-hidden="true"><span style={{ width: `${Math.min(100, basisPoints / 100)}%` }} /></span>
      <PercentageValue basisPoints={basisPoints} />
    </span>
  );
}

/**
 * Category lines (API_CONTRACT.md §9.5 "Category line"), subcategories
 * indented under their parent. Each name links to the transactions behind it.
 */
export function CategoryRows({ lines, goodWhen, withPrevious = true, share = true }) {
  const row = (line, child) => {
    const to = drilldownPath(line.drilldown);
    return (
      <tr key={line.category.id} className={child ? styles.child : undefined}>
        <td>
          <span className={styles.lineName}>
            {to ? <Link to={to}>{line.category.name}</Link> : line.category.name}
            <span className={styles.count}>{line.transactionCount}</span>
          </span>
        </td>
        <td className={styles.num}><MoneyValue money={line.total} size="sm" /></td>
        {withPrevious && <td className={`${styles.num} ${styles.optional}`}><MoneyValue money={line.previousTotal} size="sm" /></td>}
        {withPrevious && <td className={`${styles.num} ${styles.optional}`}><TrendIndicator basisPoints={line.change?.basisPoints} goodWhen={goodWhen} /></td>}
        {share && <td className={styles.num}><Share basisPoints={line.shareBasisPoints} /></td>}
      </tr>
    );
  };
  return lines.map((line) => (
    <Fragment key={line.category.id}>
      {row(line, false)}
      {(line.children ?? []).map((child) => row(child, true))}
    </Fragment>
  ));
}

/** A total line: { amount, previous, change } from the API. */
export function TotalRow({ label, figure, goodWhen, withPrevious = true, share = true, grand = false }) {
  return (
    <tr className={grand ? styles.grandRow : styles.totalRow}>
      <td>{label}</td>
      <td className={styles.num}><MoneyValue money={figure.amount} size="sm" semantic={grand} /></td>
      {withPrevious && <td className={`${styles.num} ${styles.optional}`}><MoneyValue money={figure.previous} size="sm" /></td>}
      {withPrevious && <td className={`${styles.num} ${styles.optional}`}><TrendIndicator basisPoints={figure.change?.basisPoints} goodWhen={goodWhen} /></td>}
      {share && <td />}
    </tr>
  );
}

/** meta.notes: what the statement is and is not, as the API states it. */
export function Notes({ notes }) {
  if (!notes?.length) return null;
  return (
    <ul className={styles.notes}>
      {notes.map((note) => <li key={note}><Info size={13} aria-hidden="true" />{note}</li>)}
    </ul>
  );
}

/** A labelled figure block (dl) for statement headers. */
export function Figures({ items }) {
  return (
    <dl className={styles.figures}>
      {items.map((item) => (
        <div key={item.label} className={styles.figure}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
