/**
 * Formatting of backend values for display. Formatting only: the frontend
 * never calculates a financial figure (API_CONTRACT.md §11.4).
 *
 * Money arrives as { amount, currency } in integer minor units
 * (API_CONTRACT.md §2). The exponent per currency matches the backend
 * (UZS = 0, locked by D9).
 */

// Same table as backend/src/lib/money.js (UZS = 0 is locked, D9).
const EXPONENTS = {
  UZS: 0, JPY: 0, KRW: 0, VND: 0, CLP: 0, ISK: 0, PYG: 0, RWF: 0, UGX: 0, XAF: 0, XOF: 0, XPF: 0,
  BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,
};

/** Currencies the backend accepts for a company (backend/src/lib/money.js). */
export const SUPPORTED_CURRENCIES = [
  'UZS', 'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'CNY', 'INR', 'KRW', 'TRY',
  'RUB', 'BRL', 'MXN', 'ZAR', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'UAH', 'KZT',
  'AED', 'SAR', 'ILS', 'EGP', 'NGN', 'KES', 'PKR', 'BDT', 'LKR', 'VND', 'THB', 'MYR', 'IDR',
  'PHP', 'GHS', 'MAD', 'DZD', 'AZN', 'GEL', 'AMD', 'BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND',
];
const LOCALE = 'en-US';

export function exponentFor(currency) {
  return EXPONENTS[currency] ?? 2;
}

/**
 * @param {{ amount: number, currency: string } | null | undefined} money
 * @param {{ signDisplay?: 'auto' | 'always' | 'exceptZero' | 'never', compact?: boolean }} [options]
 * @returns {string | null} null when there is no value (never a fake zero)
 */
export function formatMoney(money, { signDisplay = 'auto', compact = false } = {}) {
  if (!money || typeof money.amount !== 'number' || !money.currency) return null;
  const exponent = exponentFor(money.currency);
  const major = money.amount / 10 ** exponent;
  const number = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: compact ? 0 : exponent,
    maximumFractionDigits: compact ? 1 : exponent,
    notation: compact ? 'compact' : 'standard',
    signDisplay,
  }).format(major);
  return `${number} ${money.currency}`;
}

/** Integer basis points (1800 = 18.00%) → "18.00%". null stays null. */
export function formatBasisPoints(basisPoints, { signDisplay = 'auto', digits = 1 } = {}) {
  if (basisPoints === null || basisPoints === undefined) return null;
  return new Intl.NumberFormat(LOCALE, {
    style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits, signDisplay,
  }).format(basisPoints / 10000);
}

/** A 0–1 confidence → "88%". */
export function formatConfidence(confidence) {
  if (confidence === null || confidence === undefined) return null;
  return new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0 }).format(confidence);
}

/** 'YYYY-MM-DD' → "Mar 14, 2026" without timezone shifts. */
export function formatDate(isoDate, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** An end-exclusive period { start, end } → "Mar 1 – Mar 31, 2026". */
export function formatPeriod(period) {
  if (!period?.start || !period?.end) return null;
  const [y, m, d] = period.end.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m - 1, d) - 86400000).toISOString().slice(0, 10);
  const sameYear = period.start.slice(0, 4) === lastDay.slice(0, 4);
  const start = formatDate(period.start, sameYear ? { month: 'short', day: 'numeric' } : undefined);
  return `${start} – ${formatDate(lastDay)}`;
}

/** An ISO timestamp → "2 hours ago" style relative time. */
export function formatRelativeTime(timestamp, now = Date.now()) {
  if (!timestamp) return null;
  const seconds = Math.round((Date.parse(timestamp) - now) / 1000);
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(seconds, 'second');
}

/** Initials for an avatar: "Aziz Karimov" → "AK". */
export function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}
