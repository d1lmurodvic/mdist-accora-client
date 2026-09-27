import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Calculator, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Overlay.jsx';
import { Button, IconButton } from '../../components/ui/Button.jsx';
import { Field, Input, Select, Textarea } from '../../components/ui/Field.jsx';
import { Alert } from '../../components/ui/Feedback.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { describeError } from '../../lib/api/errors.js';
import { minorToInput, parseMoneyInput, parseRateInput, rateToInput, todayLocalIso } from '../../lib/moneyInput.js';
import { AmountInput, Segmented } from '../ledger/inputs.jsx';
import { CONTACT_TYPE_FOR, useContacts, useSaveInvoice } from './api.js';
import { ContactForm } from './ContactForm.jsx';
import ledger from '../ledger/Ledger.module.css';
import styles from './Invoices.module.css';

const MAX_LINES = 200;
const emptyLine = () => ({ key: Math.random().toString(36).slice(2), description: '', quantity: '1', unitPrice: '', taxRate: '' });

function addDaysIso(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * 86400000).toISOString().slice(0, 10);
}

function fromInvoice(invoice, type, prefill) {
  if (!invoice) {
    const issueDate = prefill?.issueDate ?? todayLocalIso();
    return {
      type: prefill?.type ?? type, number: prefill?.number ?? '', contactId: '', issueDate, dueDate: prefill?.dueDate ?? addDaysIso(issueDate, 30), notes: '',
      lines: prefill?.lines?.length ? prefill.lines.map((line) => ({ ...emptyLine(), ...line })) : [emptyLine()],
    };
  }
  return {
    type: invoice.type,
    number: invoice.number,
    contactId: invoice.contact.id,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    notes: invoice.notes ?? '',
    lines: invoice.lineItems.map((line) => ({
      key: line.id, description: line.description, quantity: String(line.quantity),
      unitPrice: minorToInput(line.unitPrice.amount, line.unitPrice.currency), taxRate: rateToInput(line.taxRate),
    })),
  };
}

/** Parse every line; return the API line items or per-line errors. */
function parseLines(lines, currency) {
  const errors = {};
  const items = lines.map((line) => {
    const price = parseMoneyInput(line.unitPrice, currency);
    const rate = parseRateInput(line.taxRate);
    const quantity = /^\d+$/.test(line.quantity.trim()) ? Number(line.quantity.trim()) : NaN;
    const problem = line.taxRateRequired && !line.taxRate.trim() ? 'Check the tax rate from the document. Enter 0 if no tax applies.' : !line.description.trim() ? 'Describe the item.'
      : !(quantity >= 1 && quantity <= 1_000_000) ? 'Quantity must be a whole number from 1 to 1,000,000.'
        : price.error ? `Unit price: ${price.error}` : rate.error ? `Tax: ${rate.error}` : null;
    if (problem) errors[line.key] = problem;
    return { description: line.description.trim(), quantity, unitPrice: { amount: price.minor, currency }, taxRate: rate.bp ?? 0 };
  });
  return { items, errors };
}

/**
 * Create or edit an invoice (POST/PATCH /invoices). Totals are not computed
 * here: the server derives line totals, tax and the total on save.
 *
 * A document confirmation reuses this form: `prefill` holds the values read
 * from the document ({ type, issueDate, lines, contactName }) and `mutation`
 * sends the same body to the document instead.
 */
export function InvoiceForm({ invoice, defaultType = 'receivable', currency, onClose, onSaved, prefill, mutation: sendWith, title, description }) {
  const editing = Boolean(invoice);
  const ownSave = useSaveInvoice();
  const save = sendWith ?? ownSave;
  const toast = useToast();
  const [form, setForm] = useState(() => fromInvoice(invoice, defaultType, prefill));
  const [touched, setTouched] = useState(false);
  const [addingContact, setAddingContact] = useState(false);
  const contactType = CONTACT_TYPE_FOR[form.type];
  const contacts = useContacts({ type: contactType });
  const { items, errors: lineErrors } = parseLines(form.lines, currency);

  // A name read from a document selects the contact with exactly that name, if there is one.
  const readName = prefill?.contactName?.trim().toLowerCase();
  useEffect(() => {
    if (!readName || form.contactId || !contacts.data) return;
    const matches = contacts.data.filter((c) => c.name.trim().toLowerCase() === readName);
    if (matches.length === 1) setForm((c) => (c.contactId ? c : { ...c, contactId: matches[0].id }));
  }, [readName, contacts.data, form.contactId]);

  const set = (key) => (value) => { setForm((c) => ({ ...c, [key]: value?.target ? value.target.value : value })); if (save.error) save.reset(); };
  const setLine = (key, field) => (event) => {
    const value = event.target.value;
    setForm((c) => ({ ...c, lines: c.lines.map((line) => (line.key === key ? { ...line, [field]: value } : line)) }));
    if (save.error) save.reset();
  };
  const server = {};
  for (const item of Array.isArray(save.error?.details) ? save.error.details : []) {
    const field = String(item.field ?? '').split('.')[0].split('[')[0];
    if (field && !server[field]) server[field] = `${item.issue.charAt(0).toUpperCase()}${item.issue.slice(1)}.`;
  }
  const errors = {
    number: (touched && !form.number.trim() ? 'Enter an invoice number.' : undefined)
      || (save.error?.kind === 'conflict' && server.number ? 'This number is already used by another invoice.' : undefined) || server.number,
    contactId: (touched && !form.contactId ? `Choose a ${contactType}.` : undefined) || server.contactId,
    issueDate: (touched && !form.issueDate ? 'Choose a date.' : undefined) || server.issueDate,
    dueDate: (touched && form.dueDate && form.issueDate && form.dueDate < form.issueDate ? 'Must be on or after the issue date.' : undefined)
      || (touched && !form.dueDate ? 'Choose a date.' : undefined) || server.dueDate,
    lineItems: server.lineItems,
  };
  const general = save.error && !Object.values(errors).some(Boolean)
    ? (['unprocessable', 'conflict'].includes(save.error.kind) ? save.error.message : describeError(save.error)) : null;

  const submit = () => {
    setTouched(true);
    if (!form.number.trim() || !form.contactId || !form.issueDate || !form.dueDate || form.dueDate < form.issueDate || Object.keys(lineErrors).length) return;
    const body = {
      number: form.number.trim(), contactId: form.contactId, issueDate: form.issueDate, dueDate: form.dueDate,
      notes: form.notes.trim() || null, lineItems: items,
    };
    if (!editing) body.type = form.type;
    save.mutate({ id: invoice?.id, body }, {
      onSuccess: (response) => {
        toast.success(editing ? 'Invoice updated' : 'Draft invoice created', 'Totals were calculated by Accora.');
        onSaved?.(response.data);
        onClose();
      },
    });
  };

  return (
    <>
      <Modal
        open
        size="lg"
        onClose={save.isPending ? undefined : onClose}
        title={title ?? (editing ? `Edit invoice ${invoice.number}` : 'New invoice')}
        description={description ?? (editing ? 'Line items replace the existing ones; totals are recalculated on save.' : 'Saved as a draft. You send it when it is ready.')}
        footer={<><Button variant="secondary" onClick={onClose} disabled={save.isPending}>Cancel</Button><Button onClick={submit} loading={save.isPending}>{editing ? 'Save changes' : 'Create draft'}</Button></>}
      >
        <form className={ledger.form} onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
          {general && <Alert tone="danger" title={general} />}
          {!editing && (
            <Segmented
              label="Invoice type"
              value={form.type}
              onChange={(value) => setForm((c) => ({ ...c, type: value, contactId: '' }))}
              options={[
                { value: 'receivable', label: 'You bill a customer', icon: ArrowDownLeft, tone: 'income' },
                { value: 'payable', label: 'A vendor bills you', icon: ArrowUpRight, tone: 'expense' },
              ]}
            />
          )}
          <div className={ledger.grid2}>
            <Field label="Invoice number" required error={errors.number}>
              {(p) => <Input autoFocus={!editing} maxLength={50} placeholder="e.g. INV-2026-001" value={form.number} onChange={set('number')} {...p} />}
            </Field>
            <Field
              label={contactType === 'customer' ? 'Customer' : 'Vendor'}
              required
              error={errors.contactId}
              hint={prefill?.contactName && !form.contactId ? `The document names "${prefill.contactName}".` : undefined}
            >
              {(p) => (
                <div>
                  <Select value={form.contactId} onChange={set('contactId')} {...p}>
                    <option value="">{contacts.isPending ? 'Loading…' : `Choose a ${contactType}`}</option>
                    {(contacts.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  <button type="button" className={styles.inlineAdd} onClick={() => setAddingContact(true)}>+ New {contactType}</button>
                </div>
              )}
            </Field>
          </div>
          <div className={ledger.grid2}>
            <Field label="Issue date" required error={errors.issueDate}>{(p) => <Input type="date" value={form.issueDate} onChange={set('issueDate')} {...p} />}</Field>
            <Field label="Due date" required error={errors.dueDate}>{(p) => <Input type="date" min={form.issueDate || undefined} value={form.dueDate} onChange={set('dueDate')} {...p} />}</Field>
          </div>

          <div className={styles.lines} role="group" aria-label="Line items">
            <div className={styles.linesHead} aria-hidden="true"><span>Description</span><span>Qty</span><span>Unit price</span><span>Tax %</span><span /></div>
            {form.lines.map((line, index) => (
              <div key={line.key} className={styles.line}>
                <Input aria-label={`Item ${index + 1} description`} maxLength={500} placeholder="Item or service" value={line.description} onChange={setLine(line.key, 'description')} aria-invalid={touched && lineErrors[line.key] ? true : undefined} />
                <Input aria-label={`Item ${index + 1} quantity`} inputMode="numeric" value={line.quantity} onChange={setLine(line.key, 'quantity')} />
                <AmountInput aria-label={`Item ${index + 1} unit price`} currency={currency} placeholder="0" value={line.unitPrice} onChange={setLine(line.key, 'unitPrice')} />
                <span className={styles.rate}><Input aria-label={`Item ${index + 1} tax rate percent`} inputMode="decimal" placeholder="0" value={line.taxRate} onChange={setLine(line.key, 'taxRate')} /><span aria-hidden="true">%</span></span>
                <IconButton
                  icon={Trash2}
                  size="sm"
                  label={`Remove item ${index + 1}`}
                  disabled={form.lines.length === 1}
                  onClick={() => setForm((c) => ({ ...c, lines: c.lines.filter((l) => l.key !== line.key) }))}
                />
                {touched && lineErrors[line.key] && <p className={styles.lineError} role="alert">{lineErrors[line.key]}</p>}
              </div>
            ))}
            {errors.lineItems && <p className={styles.lineError} role="alert">{errors.lineItems}</p>}
            <Button variant="ghost" size="sm" icon={Plus} className={styles.addLine} disabled={form.lines.length >= MAX_LINES} onClick={() => setForm((c) => ({ ...c, lines: [...c.lines, emptyLine()] }))}>Add item</Button>
          </div>

          <p className={styles.totalsNote}><Calculator size={15} aria-hidden="true" /> Line totals, tax and the invoice total are calculated by Accora when you save — tax per line, rounded half away from zero. Tax rates are your inputs, not tax advice.</p>
          <Field label="Notes">{(p) => <Textarea rows={2} maxLength={2000} value={form.notes} onChange={set('notes')} {...p} />}</Field>
        </form>
      </Modal>
      {addingContact && (
        <ContactForm fixedType={contactType} initialName={prefill?.contactName} onClose={() => setAddingContact(false)} onSaved={(contact) => setForm((c) => ({ ...c, contactId: contact.id }))} />
      )}
    </>
  );
}
