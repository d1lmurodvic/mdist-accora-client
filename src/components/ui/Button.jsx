import { forwardRef } from 'react';
import { Spinner } from './Feedback.jsx';
import styles from './Button.module.css';

/**
 * variant: primary | secondary | ghost | danger | glass
 * size: sm | md | lg
 */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, icon: Icon, iconEnd: IconEnd, fullWidth, className = '', children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.full : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size={size === 'sm' ? 14 : 16} label="" /> : Icon && <Icon size={size === 'sm' ? 15 : 17} aria-hidden="true" />}
      {children && <span className={styles.label}>{children}</span>}
      {IconEnd && !loading && <IconEnd size={size === 'sm' ? 15 : 17} aria-hidden="true" />}
    </button>
  );
});

/** A square button with only an icon; `label` is required for screen readers. */
export const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, variant = 'ghost', size = 'md', className = '', badge, type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} aria-label={label} title={label} className={`${styles.iconButton} ${styles[variant]} ${styles[`icon_${size}`]} ${className}`} {...props}>
      <Icon size={size === 'sm' ? 16 : 18} aria-hidden="true" />
      {badge ? <span className={styles.badge} aria-hidden="true">{badge > 99 ? '99+' : badge}</span> : null}
    </button>
  );
});
