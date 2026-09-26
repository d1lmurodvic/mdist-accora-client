/**
 * Money typed by a person ↔ integer minor units the API expects
 * (API_CONTRACT.md §2). Pure string/BigInt handling — never floating point —
 * so "0.1 + 0.2" style errors cannot enter the ledger. This converts a unit;
 * it does not calculate any financial figure.
 */

import { exponentFor } from './format.js';

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * "1,250.50" (USD) → { minor: 125050 }. Grouping commas and spaces are ignored.
 * Returns { error } for an empty, malformed, too precise, non-positive or too large value.
 */
export function parseMoneyInput(text, currency, { allowZero = false, allowNegative = false } = {}) {
  const exponent = exponentFor(currency);
  const raw = String(text ?? '').trim().replace(/[\s,]/g, '');
  if (raw === '') return { error: 'Enter an amount.' };
  const match = /^(-)?(\d+)(?:\.(\d+))?$/.exec(raw);
  if (!match) return { error: 'Enter a number, e.g. 1250' + (exponent ? '.50' : '') + '.' };
  const [, minus, whole, fraction = ''] = match;
  if (minus && !allowNegative) return { error: 'Enter a positive amount.' };
  if (fraction.length > exponent) {
    return { error: exponent === 0 ? `${currency} amounts have no decimal places.` : `Use at most ${exponent} decimal places.` };
  }
  let minor = BigInt(whole) * 10n ** BigInt(exponent) + BigInt((fraction + '0'.repeat(exponent)).slice(0, exponent) || '0');
  if (minus) minor = -minor;
  if (minor > MAX_SAFE || minor < -MAX_SAFE) return { error: 'This amount is too large.' };
  if (minor === 0n && !allowZero) return { error: 'Enter an amount greater than zero.' };
  return { minor: Number(minor) };
}

/** Minor units → the plain editable text for an input ("125050" USD → "1250.50"). */
export function minorToInput(minor, currency) {
  if (minor === null || minor === undefined) return '';
  const exponent = exponentFor(currency);
  const value = BigInt(minor);
  const sign = value < 0n ? '-' : '';
  const digits = (value < 0n ? -value : value).toString().padStart(exponent + 1, '0');
  if (exponent === 0) return sign + digits;
  return `${sign}${digits.slice(0, -exponent)}.${digits.slice(-exponent)}`;
}

/** Today's date as YYYY-MM-DD in the user's local calendar (for date inputs). */
export function todayLocalIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/**
 * A tax rate typed as a percentage ("12", "12.5", "7.25") → integer basis
 * points (1200, 1250, 725), as the API expects. String handling only.
 */
export function parseRateInput(text) {
  const raw = String(text ?? '').trim().replace(/%$/, '').trim();
  if (raw === '') return { bp: 0 };
  const match = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(raw);
  if (!match) return { error: 'Enter a percentage with at most 2 decimals.' };
  const bp = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0') || 0);
  if (bp > 10000) return { error: 'A rate cannot exceed 100%.' };
  return { bp };
}

/** Basis points → percentage text for an input (1250 → "12.5"). */
export function rateToInput(bp) {
  if (!bp) return '';
  const whole = Math.trunc(bp / 100);
  const rest = String(bp % 100).padStart(2, '0').replace(/0+$/, '');
  return rest ? `${whole}.${rest}` : String(whole);
}
