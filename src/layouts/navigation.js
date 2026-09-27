import { FileText, FileScan, LayoutDashboard, LineChart, Receipt } from 'lucide-react';

/** Shared MVP navigation for desktop and mobile. */
export const NAV_GROUPS = [
  { id: 'overview', label: null, items: [{ to: '/app/dashboard', label: 'Overview', icon: LayoutDashboard }] },
  { id: 'manage', label: 'Workspace', items: [
    { to: '/app/documents', label: 'Documents', icon: FileScan },
    { to: '/app/transactions', label: 'Transactions', icon: Receipt },
    { to: '/app/invoices', label: 'Invoices', icon: FileText },
    { to: '/app/reports', label: 'Reports', icon: LineChart },
  ] },
];
export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);
export const MOBILE_PRIMARY = ['/app/dashboard', '/app/documents', '/app/transactions', '/app/invoices'];
export function titleFor(pathname) {
  return NAV_ITEMS.find((item) => pathname === item.to || pathname.startsWith(item.to + '/'))?.label ?? 'Accora';
}
