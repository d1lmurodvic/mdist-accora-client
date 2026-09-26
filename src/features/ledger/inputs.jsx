import { forwardRef } from 'react';
import { Select } from '../../components/ui/Field.jsx';
import styles from './Ledger.module.css';

/**
 * Categories as the API lists them, grouped for a select. `type` limits the
 * choice to categories that fit a transaction's type (plus Uncategorized).
 */
export const CategorySelect = forwardRef(function CategorySelect({ categories = [], type, includeEmpty, emptyLabel = 'Choose a category', ...props }, ref) {
  const fits = (category) => category.isSystem || !type || category.type === type;
  const groups = [
    { label: null, items: categories.filter((c) => c.isSystem) },
    { label: 'Income', items: categories.filter((c) => c.type === 'income') },
    { label: 'Expense', items: categories.filter((c) => c.type === 'expense') },
  ].map((group) => ({ ...group, items: group.items.filter(fits) })).filter((group) => group.items.length > 0);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const option = (c) => <option key={c.id} value={c.id}>{c.parentId ? `  ${byId.get(c.parentId)?.name ?? ''} › ${c.name}` : c.name}</option>;
  return (
    <Select ref={ref} {...props}>
      {includeEmpty && <option value="">{emptyLabel}</option>}
      {groups.map((group) => (group.label
        ? <optgroup key={group.label} label={group.label}>{group.items.map(option)}</optgroup>
        : group.items.map(option)))}
    </Select>
  );
});

/** A money input with the currency shown beside it. The value is text; parse it with parseMoneyInput. */
export const AmountInput = forwardRef(function AmountInput({ currency, className = '', ...props }, ref) {
  return (
    <div className={`${styles.amount} ${className}`}>
      <input ref={ref} inputMode="decimal" autoComplete="off" className={styles.amountControl} {...props} />
      <span className={styles.amountCurrency} aria-hidden="true">{currency}</span>
    </div>
  );
});

/** Two or three mutually exclusive options as a compact segmented control. */
export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className={styles.segmented}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={`${styles.segment} ${value === option.value ? styles[`segment_${option.tone ?? 'on'}`] : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.icon && <option.icon size={15} aria-hidden="true" />}
          {option.label}
        </button>
      ))}
    </div>
  );
}
