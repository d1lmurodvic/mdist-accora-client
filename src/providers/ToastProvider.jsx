import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import styles from './Toast.module.css';

/** Transient feedback: success, error, warning, info. Never alert(). */
const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info };
const DURATION_MS = 5000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((toast) => toast.id !== id)), []);

  const show = useCallback((tone, title, description) => {
    counter.current += 1;
    const id = counter.current;
    setToasts((list) => [...list.slice(-3), { id, tone, title, description }]);
    setTimeout(() => dismiss(id), DURATION_MS);
    return id;
  }, [dismiss]);

  const api = useMemo(() => ({
    success: (title, description) => show('success', title, description),
    error: (title, description) => show('error', title, description),
    warning: (title, description) => show('warning', title, description),
    info: (title, description) => show('info', title, description),
    dismiss,
  }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region} aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone];
          return (
            <div key={toast.id} className={`${styles.toast} ${styles[toast.tone]}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
              <Icon className={styles.icon} size={18} aria-hidden="true" />
              <div className={styles.text}>
                <p className={styles.title}>{toast.title}</p>
                {toast.description && <p className={styles.description}>{toast.description}</p>}
              </div>
              <button type="button" className={styles.close} onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
