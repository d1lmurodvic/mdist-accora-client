import test from 'node:test';
import assert from 'node:assert/strict';
import { invoicePrefill, transactionPrefill } from '../src/features/documents/prefill.js';
const field = (value) => ({ value, confidence: 0.95 });
test('invoice metadata and fractional quantities survive prefilling without rounding', () => {
  const result = invoicePrefill({ invoiceNumber: field('INV-1'), dueDate: field('2026-10-01'), date: field('2026-09-27'), vendor: field('Shop'), lineItems: field([{ description: 'Paper', quantity: 1.5, unitPrice: { amount: 1250, currency: 'USD' }, taxRate: null }]) }, 'USD');
  assert.equal(result.number, 'INV-1');
  assert.equal(result.dueDate, '2026-10-01');
  assert.equal(result.lines[0].quantity, '1.5');
  assert.equal(result.lines[0].unitPrice, '12.50');
  assert.equal(result.lines[0].taxRateRequired, true);
});
test('incomplete lines remain empty and historical records remain supported', () => {
  const result = invoicePrefill({ lineItems: field([{ description: null, quantity: null, unitPrice: null, taxRate: null }]) }, 'UZS');
  assert.equal(result.lines[0].quantity, '');
  assert.equal(result.lines[0].unitPrice, '');
  assert.equal(result.lines[0].description, '');
  assert.equal(result.number, undefined);
  assert.deepEqual(invoicePrefill(null, 'UZS'), {});
});
test('foreign-currency amounts are never copied into company-currency inputs', () => {
  const fields = { total: field({ amount: 1250, currency: 'USD' }), lineItems: field([{ description: 'Paper', quantity: 1, unitPrice: { amount: 1250, currency: 'USD' }, taxRate: 0 }]) };
  assert.equal(transactionPrefill(fields, 'UZS').amount, undefined);
  assert.deepEqual(invoicePrefill(fields, 'UZS').lines, []);
  assert.equal(invoicePrefill(fields, 'USD').lines[0].taxRate, '0');
});
