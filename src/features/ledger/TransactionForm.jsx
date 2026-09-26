import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Sparkles } from 'lucide-react';
import { Modal } from '../../components/ui/Overlay.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, Input, Select, Textarea } from '../../components/ui/Field.jsx';
import { Alert } from '../../components/ui/Feedback.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { describeError } from '../../lib/api/errors.js';
import { formatDate, formatMoney } from '../../lib/format.js';
import { minorToInput, parseMoneyInput, todayLocalIso } from '../../lib/moneyInput.js';
import { useCategorySuggestion, useCreateTransaction, useUpdateTransaction } from './api.js';
import { AmountInput, CategorySelect, Segmented } from './inputs.jsx';
import styles from './Ledger.module.css';

const METHOD_LABEL = { rule: 'your rule', learned: 'a past correction', fallback: 'no matching rule' };

function initialState(transaction, accounts, prefill) {
  if (transaction) {
    return {
      type: transaction.type,
      amount: minorToInput(transaction.amount.amount, transaction.amount.currency),
      date: transaction.date,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      payee: transaction.payee ?? '',
      description: transaction.description ?? '',
      paymentMethod: transaction.paymentMethod ?? '',
      notes: transaction.notes ?? '',
    };
  }
  const posting = accounts.filter((account) => account.acceptsTransactions);
  return {
    type: 'expense', amount: '', date: todayLocalIso(), accountId: posting.length === 1 ? posting[0].id : '',
    categoryId: '', payee: '', description: '', paymentMethod: '', notes: '',
    ...prefill,
  };
}

/** Ids of the existing transactions a 409 duplicate refusal points to. */
function duplicateIds(error) {
  return error?.kind === 'conflict' && Array.isArray(error.details) ? error.details.map((item) => item.transactionId).filter(Boolean) : [];
}

/** The top-level field an API issue refers to ("amount.amount" → "amount"). */
function serverErrors(error) {
  if (error?.kind !== 'validation' && error?.kind !== 'unprocessable') return {};
  const fields = {};
  for (const item of Array.isArray(error.details) ? error.details : []) {
    const key = String(item.field ?? '').split('.')[0];
    if (key && !fields[key]) fields[key] = item.issue;
  }
  return fields;
}

/**
 * Record or edit a transaction (POST/PATCH /transactions). A likely duplicate
 * is refused by the server (409); the user can then record it deliberately.
 * The amount is typed in major units and sent as integer minor units.
 *
 * A document confirmation reuses this form: `prefill` holds the reviewed
 * starting values and `mutation` sends the same body to the document instead.
 */
export function TransactionForm({
  open, onClose, transaction, accounts, categories, currency, prefill, mutation: sendWith, title, description, submitLabel, onCreated,
}) {
  const editing = Boolean(transaction);
  const toast = useToast();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const mutation = sendWith ?? (editing ? update : create);
  const [form, setForm] = useState(() => initialState(transaction, accounts, prefill));
  const [touched, setTouched] = useState(false);
  const [showMore, setShowMore] = useState(Boolean(transaction?.paymentMethod || transaction?.notes));
  const [duplicates, setDuplicates] = useState(null);
  const isPayment = Boolean(transaction?.invoiceId);

  const parsed = parseMoneyInput(form.amount, currency);
  const suggestion = useCategorySuggestion({ type: form.categoryId ? null : form.type, payee: form.payee, description: form.description });
  const suggested = !form.categoryId ? suggestion.data?.data : null;
  const posting = accounts.filter((account) => account.acceptsTransactions);
  const server = serverErrors(mutation.error);
  const errors = {
    amount: (touched && parsed.error) || server.amount,
    date: (touched && !form.date ? 'Choose a date.' : undefined) || server.date,
    accountId: (touched && !form.accountId ? 'Choose an account.' : undefined) || server.accountId,
    categoryId: server.categoryId,
    payee: server.payee,
    description: server.description,
  };
  const formError = mutation.error && !['validation', 'unprocessable', 'conflict'].includes(mutation.error.kind)
    ? describeError(mutation.error)
    : mutation.error?.kind === 'unprocessable' && Object.keys(server).length === 0 ? mutation.error.message
      // A conflict that is not a duplicate (e.g. the document was already confirmed).
      : mutation.error?.kind === 'conflict' && duplicateIds(mutation.error).length === 0 ? mutation.error.message : null;

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value?.target ? value.target.value : value }));
    setDuplicates(null);
    if (mutation.error) mutation.reset();
  };

  const body = (allowDuplicate) => {
    const text = (value) => (value.trim() ? value.trim() : undefined);
    if (!editing) {
      return {
        type: form.type,
        amount: { amount: parsed.minor, currency },
        date: form.date,
        accountId: form.accountId,
        categoryId: form.categoryId || undefined,
        payee: text(form.payee),
        description: text(form.description),
        paymentMethod: text(form.paymentMethod),
        notes: text(form.notes),
        ...(allowDuplicate ? { allowDuplicate: true } : {}),
      };
    }
    // Only what changed; a cleared text field is sent as null.
    const changes = {};
    const original = initialState(transaction, accounts);
    if (!isPayment && form.type !== original.type) changes.type = form.type;
    if (!isPayment && form.amount !== original.amount) changes.amount = { amount: parsed.minor, currency };
    for (const key of ['date', 'accountId', 'categoryId']) if (form[key] !== original[key]) changes[key] = form[key];
    for (const key of ['payee', 'description', 'paymentMethod', 'notes']) {
      if (form[key].trim() !== original[key]) changes[key] = form[key].trim() || null;
    }
    return changes;
  };

  const submit = (allowDuplicate = false) => {
    setTouched(true);
    if (parsed.error || !form.date || !form.accountId) return;
    const payload = body(allowDuplicate);
    if (editing && Object.keys(payload).length === 0) { onClose(); return; }
    const request = editing ? { id: transaction.id, changes: payload } : payload;
    mutation.mutate(request, {
      onSuccess: (response) => {
        const flagged = response.meta?.possibleDuplicateOf?.length;
        toast.success(editing ? 'Transaction updated' : 'Transaction recorded', flagged ? 'Recorded although it looks like an existing transaction.' : undefined);
        onCreated?.(response);
        onClose();
      },
      onError: (error) => {
        const ids = duplicateIds(error);
        if (ids.length) setDuplicates(ids);
      },
    });
  };

  const categoryChanged = editing && form.categoryId !== transaction.categoryId;

  return (
    <Modal
      open={open}
      onClose={mutation.isPending ? undefined : onClose}
      title={title ?? (editing ? 'Edit transaction' : 'Record a transaction')}
      description={description ?? (editing ? `Recorded ${formatDate(transaction.date)}` : 'Amounts are positive; the type sets the direction.')}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          {duplicates
            ? <Button onClick={() => submit(true)} loading={mutation.isPending}>Record anyway</Button>
            : <Button onClick={() => submit(false)} loading={mutation.isPending}>{submitLabel ?? (editing ? 'Save changes' : 'Record transaction')}</Button>}
        </>
      )}
    >
      <form className={styles.form} onSubmit={(event) => { event.preventDefault(); submit(false); }} noValidate>
        {formError && <Alert tone="danger" title={formError} />}
        {duplicates && (
          <Alert tone="warning" title="This looks like a transaction you already recorded">
            Same type, amount, date and payee as {duplicates.length === 1 ? 'an existing transaction' : `${duplicates.length} existing transactions`}. Nothing was recorded. Record it anyway only if it is a separate payment.
          </Alert>
        )}
        {isPayment && <Alert tone="info" title="Invoice payment">The amount and type come from the invoice. Cancel the invoice to remove this payment.</Alert>}

        <Segmented
          label="Type"
          value={form.type}
          onChange={isPayment ? () => {} : set('type')}
          options={[
            { value: 'expense', label: 'Expense', icon: ArrowUpRight, tone: 'expense' },
            { value: 'income', label: 'Income', icon: ArrowDownLeft, tone: 'income' },
          ]}
        />
        <div className={styles.grid2}>
          <Field label="Amount" required error={errors.amount}>
            {(props) => <AmountInput currency={currency} placeholder="0" value={form.amount} onChange={set('amount')} disabled={isPayment} autoFocus={!editing} {...props} />}
          </Field>
          <Field label="Date" required error={errors.date}>
            {(props) => <Input type="date" value={form.date} onChange={set('date')} {...props} />}
          </Field>
        </div>
        <Field label="Account" required error={errors.accountId} hint={posting.length === 0 ? 'Add a cash or bank account first.' : undefined}>
          {(props) => (
            <Select value={form.accountId} onChange={set('accountId')} {...props}>
              <option value="">Choose an account</option>
              {posting.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </Select>
          )}
        </Field>
        <div className={styles.grid2}>
          <Field label="Payee" error={errors.payee}>
            {(props) => <Input maxLength={200} placeholder="Who was paid, or who paid you" value={form.payee} onChange={set('payee')} {...props} />}
          </Field>
          <Field label="Description" error={errors.description}>
            {(props) => <Input maxLength={500} placeholder="What it was for" value={form.description} onChange={set('description')} {...props} />}
          </Field>
        </div>
        <Field
          label="Category"
          error={errors.categoryId}
          hint={categoryChanged ? 'IFRSmart will remember this choice for this payee.' : !form.categoryId ? 'Leave empty to let your rules suggest one for review.' : undefined}
        >
          {(props) => (
            <CategorySelect categories={categories} type={form.type} includeEmpty={!editing} emptyLabel="Suggest from my rules" value={form.categoryId} onChange={set('categoryId')} {...props} />
          )}
        </Field>
        {suggested && (
          <p className={styles.suggestion} aria-live="polite">
            <Sparkles size={13} aria-hidden="true" />
            Suggested: <strong>{suggested.category.name}</strong> ({METHOD_LABEL[suggested.method] ?? suggested.method})
            {!suggested.category.type || suggested.category.type === form.type
              ? <button type="button" onClick={() => set('categoryId')(suggested.category.id)}>Use it</button>
              : null}
          </p>
        )}
        {showMore ? (
          <>
            <Field label="Payment method" error={server.paymentMethod}>
              {(props) => <Input maxLength={50} placeholder="e.g. Card, Bank transfer, Cash" value={form.paymentMethod} onChange={set('paymentMethod')} {...props} />}
            </Field>
            <Field label="Notes" error={server.notes}>
              {(props) => <Textarea rows={3} maxLength={2000} value={form.notes} onChange={set('notes')} {...props} />}
            </Field>
          </>
        ) : (
          <button type="button" className={styles.more} onClick={() => setShowMore(true)}>+ Payment method and notes</button>
        )}
        {!parsed.error && form.amount && <p className="sr-only" aria-live="polite">{formatMoney({ amount: parsed.minor, currency })}</p>}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
