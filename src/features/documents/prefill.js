import { minorToInput, rateToInput } from '../../lib/moneyInput.js';

const value = (fields, name) => fields?.[name]?.value ?? null;

/**
 * Starting values for the transaction form: read values copied as they are.
 * Money in another currency is left for the user to enter.
 */
export function transactionPrefill(fields, currency) {
  const prefill = {};
  if (!fields) return prefill;
  const total = value(fields, 'total');
  if (total && total.currency === currency) prefill.amount = minorToInput(total.amount, currency);
  if (value(fields, 'date')) prefill.date = value(fields, 'date');
  if (value(fields, 'vendor')) prefill.payee = value(fields, 'vendor');
  const lines = value(fields, 'lineItems');
  if (lines?.length === 1 && lines[0].description) prefill.description = lines[0].description;
  return prefill;
}

/** Starting values for the invoice form: a vendor on the document suggests a bill you owe. */
export function invoicePrefill(fields, currency) {
  if (!fields) return {};
  const vendor = value(fields, 'vendor');
  const customer = value(fields, 'customer');
  const type = vendor ? 'payable' : customer ? 'receivable' : undefined;
  const lines = value(fields, 'lineItems') ?? [];
  const sameCurrency = lines.every((line) => !line.unitPrice || line.unitPrice.currency === currency);
  return {
    type,
    contactName: type === 'payable' ? vendor : type === 'receivable' ? customer : undefined,
    number: value(fields, 'invoiceNumber') ?? undefined,
    dueDate: value(fields, 'dueDate') ?? undefined,
    issueDate: value(fields, 'date') ?? undefined,
    lines: sameCurrency
      ? lines.map((line) => ({
        description: line.description ?? '', quantity: line.quantity == null ? '' : String(line.quantity),
        unitPrice: line.unitPrice ? minorToInput(line.unitPrice.amount, currency) : '', taxRate: line.taxRate === 0 ? '0' : rateToInput(line.taxRate), taxRateRequired: line.taxRate == null,
      }))
      : [],
  };
}
