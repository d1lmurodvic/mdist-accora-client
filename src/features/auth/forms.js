/**
 * Small form helpers. Client checks are a convenience; the server's
 * VALIDATION_ERROR details are authoritative and mapped onto the fields.
 */

import { ApiError } from '../../lib/api/errors.js';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Field errors from a failed request, keyed by field name. */
export function serverFieldErrors(error) {
  return error instanceof ApiError && error.kind === 'validation' ? error.fieldErrors() : {};
}

/** A sentence for a validation issue from the API ("must be at least 8 characters"). */
export function sentence(issue) {
  if (!issue) return undefined;
  const text = String(issue);
  return text.charAt(0).toUpperCase() + text.slice(1) + (text.endsWith('.') ? '' : '.');
}
