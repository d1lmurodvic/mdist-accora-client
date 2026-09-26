import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { Button, IconButton } from './Button.jsx';
import styles from './Overlay.module.css';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Open dialogs, innermost last: only the top one handles Escape and Tab. */
const dialogStack = [];

/** Focus trap, Escape to close, scroll lock, focus restore. */
function useDialogBehaviour(open, onClose, panelRef) {
  // The latest onClose, so a new callback each render does not re-run the effect (and steal focus).
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const panel = panelRef.current;
    const first = panel?.querySelector('[data-autofocus]') ?? panel?.querySelector(FOCUSABLE) ?? panel;
    first?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const token = {};
    dialogStack.push(token);

    function onKeyDown(event) {
      if (dialogStack[dialogStack.length - 1] !== token) return;
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) { event.preventDefault(); return; }
      const [head, tail] = [items[0], items[items.length - 1]];
      if (event.shiftKey && document.activeElement === head) { event.preventDefault(); tail.focus(); }
      else if (!event.shiftKey && document.activeElement === tail) { event.preventDefault(); head.focus(); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      dialogStack.splice(dialogStack.indexOf(token), 1);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, panelRef]);
}

function Shell({ open, onClose, kind, size = 'md', title, description, children, footer, dismissible = true }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useDialogBehaviour(open, dismissible ? onClose : undefined, panelRef);
  if (!open) return null;
  return createPortal(
    <div className={`${styles.root} ${styles[kind]}`}>
      <div className={styles.backdrop} onClick={dismissible ? onClose : undefined} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`${styles.panel} ${styles[`${kind}Panel`]} ${styles[size]}`}
      >
        {(title || dismissible) && (
          <div className={styles.header}>
            <div className={styles.headerText}>
              {title && <h2 id={titleId} className={styles.title}>{title}</h2>}
              {description && <p id={descriptionId} className={styles.description}>{description}</p>}
            </div>
            {dismissible && <IconButton icon={X} label="Close" size="sm" onClick={onClose} />}
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** size: sm | md | lg */
export function Modal(props) {
  return <Shell kind="modal" {...props} />;
}

/** A side panel (bottom sheet on mobile). */
export function Drawer(props) {
  return <Shell kind="drawer" {...props} />;
}

/** Confirmation for consequential or destructive actions. */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive, loading }) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      size="sm"
      dismissible={!loading}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading} data-autofocus>{cancelLabel}</Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      )}
    >
      <div className={styles.confirm}>
        {destructive && <span className={styles.confirmIcon}><AlertTriangle size={20} aria-hidden="true" /></span>}
        <div>
          <h2 className={styles.title}>{title}</h2>
          {description && <p className={styles.confirmText}>{description}</p>}
        </div>
      </div>
    </Modal>
  );
}
