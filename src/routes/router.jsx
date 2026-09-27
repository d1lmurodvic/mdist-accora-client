import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../layouts/AppShell.jsx';
import { PublicLayout } from '../pages/public/PublicLayout.jsx';
import { RequireAnonymous, RequireSession, RootRoute } from './guards.jsx';
import { RouteError } from '../pages/RouteError.jsx';
import { NotFound } from '../pages/NotFound.jsx';

const Login = lazy(() => import('../pages/public/Login.jsx'));
const Register = lazy(() => import('../pages/public/Register.jsx'));
const Onboarding = lazy(() => import('../pages/public/Onboarding.jsx'));
const Landing = lazy(() => import('../pages/landing/Landing.jsx'));
const Dashboard = lazy(() => import('../pages/app/Dashboard.jsx'));
const Transactions = lazy(() => import('../pages/app/Transactions.jsx'));
const Invoices = lazy(() => import('../pages/app/Invoices.jsx'));
const Intelligence = lazy(() => import('../pages/app/Intelligence.jsx'));
const Tax = lazy(() => import('../pages/app/Tax.jsx'));
const Accountant = lazy(() => import('../pages/app/Accountant.jsx'));
const Notifications = lazy(() => import('../pages/app/Notifications.jsx'));
const Settings = lazy(() => import('../pages/app/Settings.jsx'));
const Reports = lazy(() => import('../pages/app/Reports.jsx'));
const Documents = lazy(() => import('../pages/app/Documents.jsx'));
const DocumentReview = lazy(() => import('../pages/app/DocumentReview.jsx'));


// Development-only component gallery; the whole branch is removed from production builds.
let devRoutes = [];
if (import.meta.env.DEV) {
  const UIGallery = lazy(() => import('../pages/dev/UIGallery.jsx'));
  devRoutes = [{ path: '/dev/ui', element: <AppShell preview><UIGallery /></AppShell> }];
}

export const router = createBrowserRouter([
  { path: '/', element: <RootRoute landing={<Suspense fallback={null}><Landing /></Suspense>} />, errorElement: <RouteError /> },
  {
    element: <PublicLayout />,
    errorElement: <RouteError />,
    children: [
      { element: <RequireAnonymous />, children: [{ path: '/login', element: <Login /> }, { path: '/register', element: <Register /> }] },
      { element: <RequireSession need="onboarding" />, children: [{ path: '/onboarding', element: <Onboarding /> }] },
    ],
  },
  {
    path: '/app',
    element: <RequireSession need="ready" />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/app/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'transactions', element: <Transactions /> },
          { path: 'invoices', element: <Invoices /> },
          { path: 'documents', element: <Documents /> },
          { path: 'reports', element: <Reports /> },
          { path: 'intelligence', element: <Intelligence /> },
          { path: 'tax', element: <Tax /> },
          { path: 'accountant', element: <Accountant /> },
          { path: 'notifications', element: <Notifications /> },
          { path: 'settings', element: <Settings /> },
          { path: 'documents/:documentId', element: <DocumentReview /> },
          { path: '*', element: <NotFound inShell /> },
        ],
      },
    ],
  },
  ...devRoutes,
  { path: '*', element: <NotFound /> },
]);
