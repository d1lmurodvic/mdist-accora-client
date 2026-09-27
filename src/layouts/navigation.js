import {
  Bell, Calculator, FileText, FileScan, LayoutDashboard, LineChart, Receipt, Settings, Sparkles, UserRoundSearch,
} from 'lucide-react';

/** The single navigation map: sidebar, mobile bar and page titles read it. */
export const NAV_GROUPS = [
  { id: 'overview', label: null, items: [{ to: '/app/dashboard', label: 'Overview', icon: LayoutDashboard }] },
  {
    id: 'manage',
    label: 'Manage',
    items: [
      { to: '/app/transactions', label: 'Transactions', icon: Receipt },
      { to: '/app/invoices', label: 'Invoices', icon: FileText },
      { to: '/app/documents', label: 'Documents', icon: FileScan },
    ],
  },
  {
    id: 'analyze',
    label: 'Analyze',
    items: [
      { to: '/app/reports', label: 'Reports', icon: LineChart },
      { to: '/app/intelligence', label: 'Intelligence', icon: Sparkles },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    items: [
      { to: '/app/tax', label: 'Tax', icon: Calculator },
      { to: '/app/accountant', label: 'Accountant', icon: UserRoundSearch },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { to: '/app/notifications', label: 'Notifications', icon: Bell },
      { to: '/app/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

/** The four destinations on the mobile bar; everything else is under "More". */
export const MOBILE_PRIMARY = ['/app/dashboard', '/app/transactions', '/app/invoices', '/app/reports'];

export function titleFor(pathname) {
  return NAV_ITEMS.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))?.label ?? 'Accora';
}
