import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.jsx';
import { ErrorState, Spinner } from '../components/ui/Feedback.jsx';
import styles from './guards.module.css';

function FullPageStatus({ children }) {
  return <div className={styles.center}>{children}</div>;
}

function Checking() {
  return <FullPageStatus><Spinner size={28} label="Checking your session" /></FullPageStatus>;
}

function SessionError() {
  const { error, refresh } = useAuth();
  return <FullPageStatus><ErrorState error={error} onRetry={refresh} title="We could not check your session" /></FullPageStatus>;
}

/**
 * The four session states (AuthProvider): anonymous → /login,
 * onboarding → /onboarding, ready → the app. `need` says what a route needs.
 */
export function RequireSession({ need = 'ready' }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Checking />;
  if (status === 'error') return <SessionError />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (need === 'ready' && status === 'onboarding') return <Navigate to="/onboarding" replace />;
  if (need === 'onboarding' && status === 'ready') return <Navigate to="/app/dashboard" replace />;
  return <Outlet />;
}

/** Login and registration are for anonymous visitors only. */
export function RequireAnonymous() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Checking />;
  if (status === 'ready') return <Navigate to={location.state?.from ?? '/app/dashboard'} replace />;
  if (status === 'onboarding') return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

/**
 * "/": visitors see the landing page; a signed-in user keeps going straight
 * to their workspace (dashboard, or onboarding when it is unfinished).
 */
export function RootRoute({ landing }) {
  const { status } = useAuth();
  if (status === 'loading') return <Checking />;
  if (status === 'ready') return <Navigate to="/app/dashboard" replace />;
  if (status === 'onboarding') return <Navigate to="/onboarding" replace />;
  return landing;
}
