import { useState } from 'react';
import { Modal } from '../../components/ui/Overlay.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, Input, Select } from '../../components/ui/Field.jsx';
import { Alert } from '../../components/ui/Feedback.jsx';
import { MoneyValue } from '../../components/finance/Finance.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { describeError } from '../../lib/api/errors.js';
import { formatDate } from '../../lib/format.js';
import { todayLocalIso } from '../../lib/moneyInput.js';
import { useAccounts, useCategories } from '../ledger/api.js';
import { CategorySelect } from '../ledger/inputs.jsx';
import { newIdempotencyKey, usePayInvoice } from './api.js';
import ledger from '../ledger/Ledger.module.css';
import styles from './Invoices.module.css';

/**
 * Record the full payment of a sent/overdue invoice (POST
 * /invoices/{id}/payment). The server creates the income (receivable) or
 * expense (payable) transaction for the invoice total and links both.
 */
export function PaymentForm({ invoice, onClose }) {
  const pay = usePayInvoice();
  const toast = useToast();
  const accounts = useAccounts();
  const categories = useCategories();
  const posting = (accounts.data ?? []).filter((account) => account.acceptsTransactions);
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(() => { const today = todayLocalIso(); return today < invoice.issueDate ? invoice.issueDate : today; });
  const [categoryId, setCategoryId] = useState('');
  const [touched, setTouched] = useState(false);
  // One key per payment attempt, so a retried request is not paid twice.
  const [key] = useState(newIdempotencyKey);
  const effectiveAccount = accountId || (posting.length === 1 ? posting[0].id : '');
  const transactionType = invoice.type === 'receivable' ? 'income' : 'expense';
  const accountError = touched && !effectiveAccount ? 'Choose the account the money moved through.' : undefined;
  const dateError = (touched && !date ? 'Choose a date.' : undefined) || (date && date < invoice.issueDate ? `Must be on or after the issue date (${formatDate(invoice.issueDate)}).` : undefined);

  const submit = () => {
    setTouched(true);
    if (!effectiveAccount || !date || date < invoice.issueDate) return;
    pay.mutate(
      { id: invoice.id, idempotencyKey: key, body: { accountId: effectiveAccount, date, ...(categoryId ? { categoryId } : {}) } },
      {
        onSuccess: (response) => {
          const lookalike = response.meta?.possibleDuplicateOf?.length;
          toast.success(`Invoice ${invoice.number} paid`, lookalike
            ? 'A similar manually recorded transaction exists — check it is not the same payment.'
            : `An ${transactionType} transaction was recorded and linked.`);
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open
      size="sm"
      onClose={pay.isPending ? undefined : onClose}
      title={`Record payment · ${invoice.number}`}
      description={invoice.type === 'receivable' ? `Money received from ${invoice.contact.name}.` : `Money paid to ${invoice.contact.name}.`}
      footer={<><Button variant="secondary" onClick={onClose} disabled={pay.isPending}>Cancel</Button><Button onClick={submit} loading={pay.isPending}>Record payment</Button></>}
    >
      <form className={ledger.form} onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        {pay.error && <Alert tone="danger" title={pay.error.kind === 'unprocessable' || pay.error.kind === 'conflict' ? pay.error.message : describeError(pay.error)} />}
        <div className={styles.payTotal}><span className={ledger.muted}>Full amount</span><MoneyValue money={invoice.total} size="md" /></div>
        <Field label="Account" required error={accountError} hint={posting.length === 0 && !accounts.isPending ? 'Add a cash or bank account in Transactions first.' : undefined}>
          {(p) => (
            <Select value={effectiveAccount} onChange={(e) => setAccountId(e.target.value)} {...p}>
              <option value="">Choose an account</option>
              {posting.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Payment date" required error={dateError}>{(p) => <Input type="date" min={invoice.issueDate} value={date} onChange={(e) => setDate(e.target.value)} {...p} />}</Field>
        <Field label="Category" hint="Leave empty to let your rules categorize the payment.">
          {(p) => <CategorySelect categories={categories.data ?? []} type={transactionType} includeEmpty emptyLabel="Suggest from my rules" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} {...p} />}
        </Field>
        <p className={ledger.muted}>Partial payments are not supported: the invoice is paid in full.</p>
      </form>
    </Modal>
  );
}
