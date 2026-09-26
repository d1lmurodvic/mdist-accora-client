import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { Drawer, ConfirmDialog } from '../../components/ui/Overlay.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Alert } from '../../components/ui/Feedback.jsx';
import { MoneyValue, StatusBadge } from '../../components/finance/Finance.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { describeError } from '../../lib/api/errors.js';
import { formatDate, formatRelativeTime } from '../../lib/format.js';
import { useDeleteTransaction, useUpdateTransaction } from './api.js';
import styles from './Ledger.module.css';

export const METHOD_TEXT = { user: 'Chosen by you', rule: 'Your rule', learned: 'Learned from a correction', fallback: 'No rule matched' };

/** One transaction: every field, where it came from, and its actions. */
export function TransactionDrawer({ transaction, onClose, onEdit, accounts, categoryLabel }) {
  const toast = useToast();
  const update = useUpdateTransaction();
  const remove = useDeleteTransaction();
  const [confirming, setConfirming] = useState(false);
  if (!transaction) return null;
  const account = accounts.find((item) => item.id === transaction.accountId);
  const needsReview = transaction.categorization.reviewStatus === 'needs_review';

  const confirmCategory = () => update.mutate(
    { id: transaction.id, changes: { reviewStatus: 'confirmed' } },
    { onSuccess: () => { toast.success('Category confirmed'); onClose(); }, onError: (error) => toast.error('Could not confirm', describeError(error)) },
  );
  const doDelete = () => remove.mutate(transaction.id, {
    onSuccess: () => { toast.success('Transaction deleted'); setConfirming(false); onClose(); },
    onError: (error) => { toast.error('Could not delete', describeError(error)); setConfirming(false); },
  });

  return (
    <>
      <Drawer open onClose={onClose} title={transaction.payee ?? transaction.description ?? 'Transaction'} description={formatDate(transaction.date)}>
        <div className={styles.detailHead}>
          <MoneyValue money={transaction.amount} size="lg" />
          <div className={styles.cellBadges}>
            <Badge tone={transaction.type === 'income' ? 'success' : 'neutral'}>{transaction.type === 'income' ? 'Income' : 'Expense'}</Badge>
            {needsReview ? <StatusBadge status="needs_review" /> : <StatusBadge status="confirmed" label="Category confirmed" />}
            {transaction.source === 'document' && <Badge tone="info">From a document</Badge>}
            {transaction.invoiceId && <Badge tone="info">Invoice payment</Badge>}
          </div>
        </div>
        {needsReview && (
          <div className={styles.drawerAlert}>
            <Alert tone="warning" title="Category needs review">
              {METHOD_TEXT[transaction.categorization.method]}. Confirm it, or edit the transaction to choose another category.
            </Alert>
          </div>
        )}
        <dl className={styles.details}>
          <dt>Category</dt><dd>{categoryLabel(transaction.categoryId)} <span className={styles.cellSub}>· {METHOD_TEXT[transaction.categorization.method]}</span></dd>
          <dt>Account</dt><dd>{account?.name ?? '—'}</dd>
          <dt>Payee</dt><dd>{transaction.payee ?? '—'}</dd>
          <dt>Description</dt><dd>{transaction.description ?? '—'}</dd>
          <dt>Payment method</dt><dd>{transaction.paymentMethod ?? '—'}</dd>
          <dt>Notes</dt><dd>{transaction.notes ?? '—'}</dd>
          {transaction.invoiceId && <><dt>Invoice</dt><dd><Link to="/app/invoices">View invoices</Link></dd></>}
          <dt>Recorded</dt><dd>{formatRelativeTime(transaction.createdAt)}</dd>
        </dl>
        <div className={styles.detailActions}>
          {needsReview && <Button icon={CheckCircle2} onClick={confirmCategory} loading={update.isPending}>Confirm category</Button>}
          <Button variant="secondary" icon={Pencil} onClick={() => onEdit(transaction)}>Edit</Button>
          <Button
            variant="ghost"
            icon={Trash2}
            onClick={() => setConfirming(true)}
            disabled={Boolean(transaction.invoiceId)}
            title={transaction.invoiceId ? 'Cancel the invoice to remove its payment' : undefined}
          >
            Delete
          </Button>
        </div>
      </Drawer>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={doDelete}
        loading={remove.isPending}
        destructive
        title="Delete this transaction?"
        description="It is removed from every report, balance and forecast. This cannot be undone."
        confirmLabel="Delete"
      />
    </>
  );
}
