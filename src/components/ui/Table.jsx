import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState, ErrorState, TableSkeleton } from './Feedback.jsx';
import styles from './Table.module.css';

/**
 * Data table for server-provided rows. The server sorts and paginates; this
 * component only renders and reports the user's choices.
 *
 * columns: [{ key, header, render?(row), align?: 'end', sortable?, width?, primary?, hideOnMobile? }]
 * On small screens rows become stacked cards; `primary` columns lead each card.
 */
export function DataTable({
  columns, rows, rowKey = 'id', loading, error, onRetry, empty, sort, onSortChange,
  selectable, selected = [], onSelectedChange, onRowClick, caption,
}) {
  if (loading) return <TableSkeleton columns={Math.min(columns.length, 5)} />;
  if (error) return <div className={styles.frame}><ErrorState error={error} onRetry={onRetry} compact /></div>;
  if (!rows?.length) return <div className={styles.frame}>{empty ?? <EmptyState title="Nothing here yet" compact />}</div>;

  const allSelected = selectable && rows.every((row) => selected.includes(row[rowKey]));
  const toggleAll = () => onSelectedChange?.(allSelected ? [] : rows.map((row) => row[rowKey]));
  const toggle = (id) => onSelectedChange?.(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const cell = (column, row) => (column.render ? column.render(row) : row[column.key]);

  const sortButton = (column) => {
    const active = sort?.field === column.key;
    const next = active && sort.direction === 'desc' ? 'asc' : 'desc';
    const Arrow = active && sort.direction === 'asc' ? ArrowUp : ArrowDown;
    return (
      <button type="button" className={`${styles.sort} ${active ? styles.sortActive : ''}`} onClick={() => onSortChange?.({ field: column.key, direction: next })}>
        {column.header}
        <Arrow size={13} aria-hidden="true" className={styles.sortIcon} />
      </button>
    );
  };

  return (
    <div className={styles.frame}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {selectable && (
                <th className={styles.check} scope="col">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all rows" />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={{ width: column.width }}
                  className={column.align === 'end' ? styles.end : undefined}
                  aria-sort={sort?.field === column.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {column.sortable ? sortButton(column) : column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = row[rowKey];
              return (
                <tr key={id} className={onRowClick ? styles.clickable : undefined} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                  {selectable && (
                    <td className={styles.check} onClick={(event) => event.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(id)} onChange={() => toggle(id)} aria-label="Select row" />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className={column.align === 'end' ? styles.end : undefined}>{cell(column, row)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className={styles.cards} aria-label={caption}>
        {rows.map((row) => {
          const id = row[rowKey];
          const primary = columns.filter((column) => column.primary);
          const rest = columns.filter((column) => !column.primary && !column.hideOnMobile);
          return (
            <li key={id} className={`${styles.card} ${onRowClick ? styles.clickable : ''}`} onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {selectable && (
                <input type="checkbox" className={styles.cardCheck} checked={selected.includes(id)} onChange={() => toggle(id)} onClick={(event) => event.stopPropagation()} aria-label="Select row" />
              )}
              <div className={styles.cardPrimary}>{primary.map((column) => <div key={column.key}>{cell(column, row)}</div>)}</div>
              <dl className={styles.cardFields}>
                {rest.map((column) => (
                  <div key={column.key} className={styles.cardField}>
                    <dt>{column.header}</dt>
                    <dd>{cell(column, row)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Pagination driven by the API meta: { page, totalPages, total, hasNext, hasPrevious }. */
export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <span className={styles.pageInfo}>Page {meta.page} of {meta.totalPages} · {meta.total} total</span>
      <div className={styles.pageButtons}>
        <button type="button" className={styles.pageButton} disabled={!meta.hasPrevious} onClick={() => onPageChange(meta.page - 1)} aria-label="Previous page">
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <button type="button" className={styles.pageButton} disabled={!meta.hasNext} onClick={() => onPageChange(meta.page + 1)} aria-label="Next page">
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
