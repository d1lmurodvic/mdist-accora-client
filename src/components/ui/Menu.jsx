import { cloneElement, useEffect, useId, useRef, useState } from 'react';
import styles from './Menu.module.css';

/**
 * Dropdown menu. `trigger` is a button element; `items` are
 * { label, icon?, onSelect, tone?: 'danger', disabled? } or { separator: true }
 * or { heading }.
 */
export function Dropdown({ trigger, items, align = 'end', width = 220, header }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const onKey = (event) => {
      if (event.key === 'Escape') { setOpen(false); rootRef.current?.querySelector('[aria-haspopup]')?.focus(); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const items = [...rootRef.current.querySelectorAll('[role="menuitem"]:not([disabled])')];
        const index = items.indexOf(document.activeElement);
        const next = event.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
        items[next]?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    rootRef.current?.querySelector('[role="menuitem"]:not([disabled])')?.focus();
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      {cloneElement(trigger, {
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
        onClick: () => setOpen((value) => !value),
      })}
      {open && (
        <div id={menuId} role="menu" className={`${styles.menu} ${styles[align]}`} style={{ width }}>
          {header && <div className={styles.header}>{header}</div>}
          {items.map((item, index) => {
            if (item.separator) return <div key={index} className={styles.separator} role="separator" />;
            if (item.heading) return <div key={index} className={styles.heading}>{item.heading}</div>;
            const Icon = item.icon;
            return (
              <button
                key={index}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                aria-checked={item.checked}
                className={`${styles.item} ${item.tone === 'danger' ? styles.danger : ''} ${item.checked ? styles.checked : ''}`}
                onClick={() => { setOpen(false); item.onSelect?.(); }}
              >
                {Icon && <Icon size={16} aria-hidden="true" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Hover/focus tooltip for short supplementary text. */
export function Tooltip({ content, children, side = 'top' }) {
  const id = useId();
  return (
    <span className={styles.tooltipRoot}>
      {cloneElement(children, { 'aria-describedby': id })}
      <span role="tooltip" id={id} className={`${styles.tooltip} ${styles[side]}`}>{content}</span>
    </span>
  );
}

/** Tabs with arrow-key navigation. tabs: [{ id, label, count? }] */
export function Tabs({ tabs, value, onChange, label = 'Sections' }) {
  const onKeyDown = (event) => {
    const index = tabs.findIndex((tab) => tab.id === value);
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      onChange(next.id);
      event.currentTarget.querySelector(`[data-tab="${next.id}"]`)?.focus();
    }
  };
  return (
    <div role="tablist" aria-label={label} className={styles.tabs} onKeyDown={onKeyDown}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          data-tab={tab.id}
          aria-selected={tab.id === value}
          tabIndex={tab.id === value ? 0 : -1}
          className={styles.tab}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined && <span className={styles.count}>{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
