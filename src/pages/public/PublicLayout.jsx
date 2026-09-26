import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Brand } from '../../layouts/Brand.jsx';
import { Spinner } from '../../components/ui/Feedback.jsx';
import styles from './PublicLayout.module.css';

/** Frame for signed-out and onboarding screens: atmosphere + one glass panel. */
export function PublicLayout() {
  return (
    <div className={styles.page}>
      <div className={styles.orb} aria-hidden="true" />
      <header className={styles.top}><Brand to="/" /></header>
      <main className={styles.main}>
        <Suspense fallback={<div className={styles.loading}><Spinner size={24} /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <footer className={styles.footer}>Your company&apos;s financial command center.</footer>
    </div>
  );
}

/** The glass panel used by login, registration and onboarding. */
export function PublicPanel({ title, description, children, wide }) {
  return (
    <section className={`${styles.panel} ${wide ? styles.wide : ''}`}>
      <div className={styles.panelHead}>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {children}
    </section>
  );
}
