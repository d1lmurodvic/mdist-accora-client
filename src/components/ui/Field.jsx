import { forwardRef, useId } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import styles from './Field.module.css';

/** Label, hint and error around one control; wires ids for accessibility. */
export function Field({ label, hint, error, required, children, className = '' }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`${styles.field} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true"> *</span>}
        </label>
      )}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required })}
      {hint && !error && <p id={hintId} className={styles.hint}>{hint}</p>}
      {error && <p id={errorId} className={styles.error} role="alert">{error}</p>}
    </div>
  );
}

export const Input = forwardRef(function Input({ className = '', invalid, ...props }, ref) {
  return <input ref={ref} className={`${styles.control} ${invalid ? styles.invalid : ''} ${className}`} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className = '', rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={`${styles.control} ${styles.textarea} ${className}`} {...props} />;
});

export const Select = forwardRef(function Select({ className = '', children, ...props }, ref) {
  return (
    <div className={`${styles.selectWrap} ${className}`}>
      <select ref={ref} className={`${styles.control} ${styles.select}`} {...props}>{children}</select>
      <ChevronDown className={styles.selectIcon} size={16} aria-hidden="true" />
    </div>
  );
});

export function Checkbox({ label, className = '', ...props }) {
  return (
    <label className={`${styles.choice} ${className}`}>
      <input type="checkbox" className={styles.checkbox} {...props} />
      <span>{label}</span>
    </label>
  );
}

export function Radio({ label, className = '', ...props }) {
  return (
    <label className={`${styles.choice} ${className}`}>
      <input type="radio" className={styles.radio} {...props} />
      <span>{label}</span>
    </label>
  );
}

export function Switch({ label, checked, onChange, disabled, className = '', description }) {
  const id = useId();
  return (
    <div className={`${styles.switchRow} ${className}`}>
      <span className={styles.switchText}>
        <label htmlFor={id} className={styles.switchLabel}>{label}</label>
        {description && <span className={styles.hint}>{description}</span>}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={styles.switch}
        onClick={() => onChange?.(!checked)}
      >
        <span className={styles.thumb} />
      </button>
    </div>
  );
}

export const SearchInput = forwardRef(function SearchInput({ value, onChange, placeholder = 'Search', className = '', label = 'Search', ...props }, ref) {
  return (
    <div className={`${styles.search} ${className}`}>
      <Search className={styles.searchIcon} size={16} aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        aria-label={label}
        className={`${styles.control} ${styles.searchControl}`}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        {...props}
      />
      {value ? (
        <button type="button" className={styles.clear} onClick={() => onChange?.('')} aria-label="Clear search">
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
});
