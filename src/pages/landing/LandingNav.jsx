import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import { Brand } from '../../layouts/Brand.jsx';
import { IconButton } from '../../components/ui/Button.jsx';
import { Drawer } from '../../components/ui/Overlay.jsx';
import { useTheme } from '../../providers/ThemeProvider.jsx';
import styles from './LandingNav.module.css';

export const LANDING_LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#how', label: 'How it works' },
  { href: '#intelligence', label: 'Intelligence' },
  { href: '#reports', label: 'Reports' },
];

/** A floating glass bar that gains a surface once the page scrolls. */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { resolved, setMode } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const themeToggle = (
    <IconButton
      icon={resolved === 'dark' ? Sun : Moon}
      label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
    />
  );

  return (
    <header className={`${styles.wrap} ${scrolled ? styles.scrolled : ''}`}>
      <nav className={styles.bar} aria-label="Main">
        <Brand to="/" />
        <ul className={styles.links}>
          {LANDING_LINKS.map((link) => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}
        </ul>
        <div className={styles.actions}>
          {themeToggle}
          <Link to="/login" className={styles.login}>Log in</Link>
          <Link to="/register" className={styles.cta}>Get started</Link>
          <IconButton icon={Menu} label="Open menu" className={styles.menuButton} onClick={() => setOpen(true)} aria-haspopup="dialog" />
        </div>
      </nav>

      <Drawer open={open} onClose={() => setOpen(false)} title="IFRSmart">
        <ul className={styles.mobileLinks}>
          {LANDING_LINKS.map((link) => (
            <li key={link.href}><a href={link.href} onClick={() => setOpen(false)}>{link.label}</a></li>
          ))}
        </ul>
        <div className={styles.mobileActions}>
          <Link to="/register" className={styles.cta}>Get started</Link>
          <Link to="/login" className={styles.mobileLogin}>Log in</Link>
        </div>
      </Drawer>
    </header>
  );
}
