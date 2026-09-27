/**
 * The API returns links to the resource that explains a figure
 * (e.g. "/api/v1/financials/cash-flow"). This maps them onto the app screen
 * that presents that resource.
 */

const ROUTES = [
  ['/api/v1/financials/health', '/app/intelligence?tab=health'],
  ['/api/v1/financials', '/app/reports'],
  ['/api/v1/reports', '/app/reports'],
  ['/api/v1/ai/anomalies', '/app/intelligence?tab=anomalies'],
  ['/api/v1/ai/assistant', '/app/intelligence?tab=assistant'],
  ['/api/v1/ai', '/app/intelligence'],
  ['/api/v1/forecast', '/app/intelligence?tab=forecast'],
  ['/api/v1/invoices', '/app/invoices'],
  ['/api/v1/transactions', '/app/transactions'],
  ['/api/v1/documents', '/app/documents', true],
  ['/api/v1/notifications', '/app/notifications'],
  ['/api/v1/tax', '/app/tax'],
  ['/api/v1/accountants', '/app/accountant'],
];

export function appPathFor(apiLink) {
  if (!apiLink) return null;
  const route = ROUTES.find(([prefix]) => apiLink.startsWith(prefix));
  if (!route) return null;
  const [prefix, screen, keepsId] = route;
  // Screens that show a single record by id (e.g. /app/documents/:id).
  return keepsId ? `${screen}${apiLink.slice(prefix.length).split('?')[0]}` : screen;
}

/**
 * A figure's drill-down reference ({ path: '/api/v1/transactions', query })
 * → the Transactions screen filtered the same way. Null when it cannot be shown.
 */
export function drilldownPath(drilldown) {
  if (drilldown?.path !== '/api/v1/transactions') return null;
  const { type, categoryId, from, to } = drilldown.query ?? {};
  if (!from || !to) return null;
  const search = new URLSearchParams({ from, to });
  if (type) search.set('type', type);
  if (categoryId) search.set('categoryId', Array.isArray(categoryId) ? categoryId[0] : categoryId);
  return `/app/transactions?${search}`;
}
