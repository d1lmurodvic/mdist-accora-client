import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Check, ChevronsLeft, ChevronsRight, LogOut, Monitor, Moon, MoreHorizontal, Sun,
} from 'lucide-react';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useTheme } from '../providers/ThemeProvider.jsx';
import { IconButton } from '../components/ui/Button.jsx';
import { Dropdown } from '../components/ui/Menu.jsx';
import { Drawer } from '../components/ui/Overlay.jsx';
import { Avatar } from '../components/ui/Page.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { PageSkeleton } from '../components/ui/Feedback.jsx';
import { local } from '../lib/storage.js';
import { MOBILE_PRIMARY, NAV_GROUPS, NAV_ITEMS, titleFor } from './navigation.js';
import { Brand } from './Brand.jsx';
import styles from './AppShell.module.css';

const COLLAPSE_KEY = 'accora.sidebar';

/**
 * The signed-in application frame: sidebar (desktop), compact rail (tablet),
 * bottom bar + "More" sheet (mobile), a quiet header, and the page outlet.
 * `preview` renders the frame without a session (development gallery only).
 */
export function AppShell({ preview = false, children }) {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => local.get(COLLAPSE_KEY) === '1');
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => { setMoreOpen(false); }, [pathname]);
  const toggleCollapsed = () => setCollapsed((value) => { local.set(COLLAPSE_KEY, value ? '0' : '1'); return !value; });

  return (
    <div className={`${styles.shell} ${collapsed ? styles.collapsed : ''}`}>
      <a href="#main" className={styles.skip}>Skip to content</a>

      <aside className={styles.sidebar} aria-label="Primary">
        <div className={styles.sidebarTop}>
          <Brand compact={collapsed} rail />
        </div>
        <nav className={styles.nav}>
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className={styles.group}>
              {group.label && <p className={styles.groupLabel}>{group.label}</p>}
              <ul className={styles.list}>
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`} title={collapsed ? item.label : undefined}>
                      <item.icon size={18} aria-hidden="true" className={styles.linkIcon} />
                      <span className={styles.linkLabel}>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <button type="button" className={styles.collapse} onClick={toggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-pressed={collapsed}>
          {collapsed ? <ChevronsRight size={16} aria-hidden="true" /> : <ChevronsLeft size={16} aria-hidden="true" />}
          <span className={styles.linkLabel}>Collapse</span>
        </button>
      </aside>

      <div className={styles.main}>
        <Header preview={preview} />
        <main id="main" className={styles.content} tabIndex={-1}>
          <Suspense fallback={<PageSkeleton />}>{children ?? <Outlet />}</Suspense>
        </main>
      </div>

      <nav className={styles.mobileNav} aria-label="Primary">
        {MOBILE_PRIMARY.map((to) => {
          const item = NAV_ITEMS.find((entry) => entry.to === to);
          return (
            <NavLink key={to} to={to} className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.mobileActive : ''}`}>
              <item.icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        <button type="button" className={styles.mobileLink} onClick={() => setMoreOpen(true)} aria-haspopup="dialog">
          <MoreHorizontal size={20} aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <ul className={styles.moreList}>
          {NAV_ITEMS.filter((item) => !MOBILE_PRIMARY.includes(item.to)).map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={({ isActive }) => `${styles.moreLink} ${isActive ? styles.active : ''}`}>
                <item.icon size={20} aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </Drawer>
    </div>
  );
}

function Header({ preview }) {
  const { pathname } = useLocation();
  const auth = useAuth();
  const { mode, setMode } = useTheme();
  const user = preview ? { name: 'Preview', email: 'Development gallery' } : auth.user;
  const ThemeIcon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Monitor;
  const themeItem = (id, label, icon) => ({ label, icon: mode === id ? Check : icon, checked: mode === id, onSelect: () => setMode(id) });

  return (
    <header className={styles.header}>
      <div className={styles.headerStart}>
        <span className={styles.mobileBrand}><Brand compact /></span>
        <h1 className={styles.headerTitle}>{titleFor(pathname)}</h1>
        {auth.company && !preview && <span className={styles.company}>{auth.company.name}</span>}
      </div>
      <div className={styles.headerEnd}>
        <Dropdown
          trigger={<IconButton icon={ThemeIcon} label="Theme" />}
          width={200}
          items={[{ heading: 'Appearance' }, themeItem('light', 'Light', Sun), themeItem('dark', 'Dark', Moon), themeItem('system', 'System', Monitor)]}
        />
        <Dropdown
          width={240}
          header={user && (
            <div className={styles.userHeader}>
              <p className={styles.userName}>{user.name}</p>
              <p className={styles.userEmail}>{user.email}</p>
              {auth.role && <Badge tone="primary">{auth.role === 'owner' ? 'Owner' : 'Member'}</Badge>}
            </div>
          )}
          trigger={(
            <button type="button" className={styles.avatarButton} aria-label="Account menu">
              <Avatar name={user?.name} size={34} />
            </button>
          )}
          items={[
            { label: 'Sign out', icon: LogOut, tone: 'danger', disabled: preview, onSelect: () => auth.signOut() },
          ]}
        />
      </div>
    </header>
  );
}
