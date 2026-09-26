import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Banknote, Pencil, Send, Trash2 } from 'lucide-react';
import { ConfirmDialog, Drawer } from '../../components/ui/Overlay.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { ErrorState, Skeleton } from '../../components/ui/Feedback.jsx';
import { MoneyValue, StatusBadge } from '../../components/finance/Finance.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { describeError } from '../../lib/api/errors.js';
import { formatBasisPoints, formatDate } from '../../lib/format.js';
import { useAccounts } from '../ledger/api.js';
import { useDeleteInvoice, useInvoice, useInvoiceStatus } from './api.js';
import ledger from '../ledger/Ledger.module.css';
import styles from './Invoices.module.css';

/**
 * One invoice with its server-computed line totals, tax and total, and the
 * actions its status allows (API_CONTRACT.md §9.7):
 * draft → send / edit / delete / cancel; sent or overdue → pay / edit / cancel;
 * paid → cancel (removes the payment transaction); cancelled → none.
 */
export function InvoiceDrawer({ invoiceId, onClose, onEdit, onPay }) {
  const toast = useToast();
  const query = useInvoice(invoiceId);
  const accounts = useAccounts();
  const status = useInvoiceStatus();
  const remove = useDeleteInvoice();
  const [confirm, setConfirm] = useState(null);
  const invoice = query.data;

  // Resolves true on success, false after reporting the failure.
  const act = (label, run) => run()
    .then(() => { toast.success(label); setConfirm(null); return true; })
    .catch((error) => { toast.error('That did not work', describeError(error)); setConfirm(null); return false; });
  const send = () => act('Invoice marked as sent', () => status.mutateAsync({ id: invoiceId, status: 'sent' }));
  const cancel = () => act('Invoice cancelled', () => status.mutateAsync({ id: invoiceId, status: 'cancelled' }));
  const del = () => act('Draft deleted', () => remove.mutateAsync(invoiceId)).then((ok) => ok && onClose());

  let body;
  if (query.isPending) body = <div className={ledger.form}><Skeleton height={32} width="50%" /><Skeleton height={80} /><Skeleton height={120} /></div>;
  else if (query.isError) body = <ErrorState error={query.error} onRetry={() => query.refetch()} compact />;
  else {
    const s = invoice.status;
    const account = accounts.data?.find((a) => a.id === invoice.payment?.accountId);
    body = (
      <>
        <div className={styles.head}>
          <div className={styles.headRow}>
            <StatusBadge status={s} />
            <Badge tone={invoice.type === 'receivable' ? 'success' : 'neutral'}>{invoice.type === 'receivable' ? 'Receivable' : 'Payable'}</Badge>
          </div>
          <p className={ledger.muted}>{invoice.type === 'receivable' ? 'Billed to' : 'From'} <strong>{invoice.contact.name}</strong></p>
        </div>

        <dl className={styles.amounts}>
          <div><dt>Subtotal</dt><dd><MoneyValue money={invoice.subtotal} size="sm" /></dd></div>
          <div><dt>Tax</dt><dd><MoneyValue money={invoice.tax} size="sm" /></dd></div>
          <div><dt>Total</dt><dd><MoneyValue money={invoice.total} size="md" /></dd></div>
        </dl>

        {invoice.payment && (
          <div className={styles.paymentBox}>
            <strong>Paid on {formatDate(invoice.payment.date)}</strong>
            <span>Into {account?.name ?? 'an account'} · recorded as a {invoice.type === 'receivable' ? 'income' : 'expense'} transaction.</span>
            <Link to="/app/transactions">View in Transactions</Link>
          </div>
        )}

        <dl className={ledger.details}>
          <dt>Issued</dt><dd>{formatDate(invoice.issueDate)}</dd>
          <dt>Due</dt><dd className={s === 'overdue' ? styles.overdue : undefined}>{formatDate(invoice.dueDate)}{s === 'overdue' ? ' · overdue' : ''}</dd>
          {invoice.notes && <><dt>Notes</dt><dd>{invoice.notes}</dd></>}
        </dl>

        <h3 className={styles.sectionTitle}>Items</h3>
        <table className={styles.itemTable}>
          <thead><tr><th>Description</th><th className={styles.num}>Qty</th><th className={styles.num}>Unit price</th><th className={styles.num}>Tax</th><th className={styles.num}>Line total</th></tr></thead>
          <tbody>
            {invoice.lineItems.map((line) => (
              <tr key={line.id}>
                <td>{line.description}</td>
                <td className={styles.num}>{line.quantity}</td>
                <td className={styles.num}><MoneyValue money={line.unitPrice} size="sm" /></td>
                <td className={styles.num}>
                  {line.taxRate ? <>{formatBasisPoints(line.taxRate, { digits: 2 })}<br /><MoneyValue money={line.tax} size="sm" /></> : '—'}
                </td>
                <td className={styles.num}><MoneyValue money={line.lineTotal} size="sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={ledger.detailActions}>
          {s === 'draft' && <Button icon={Send} onClick={send} loading={status.isPending}>Mark as sent</Button>}
          {(s === 'sent' || s === 'overdue') && <Button icon={Banknote} onClick={() => onPay(invoice)}>Record payment</Button>}
          {['draft', 'sent', 'overdue'].includes(s) && <Button variant="secondary" icon={Pencil} onClick={() => onEdit(invoice)}>Edit</Button>}
          {s !== 'cancelled' && <Button variant="ghost" icon={Ban} onClick={() => setConfirm('cancel')}>Cancel invoice</Button>}
          {s === 'draft' && <Button variant="ghost" icon={Trash2} onClick={() => setConfirm('delete')}>Delete</Button>}
        </div>
        {s === 'cancelled' && <p className={ledger.muted}>Cancelled invoices are final.</p>}
      </>
    );
  }

  return (
    <>
      <Drawer open onClose={onClose} title={invoice ? `Invoice ${invoice.number}` : 'Invoice'} description={invoice ? `${invoice.contact.name} · ${invoice.currency}` : undefined}>
        {body}
      </Drawer>
      <ConfirmDialog
        open={confirm === 'cancel'}
        onClose={() => setConfirm(null)}
        onConfirm={cancel}
        loading={status.isPending}
        destructive
        title={`Cancel invoice ${invoice?.number ?? ''}?`}
        description={invoice?.status === 'paid'
          ? 'Its payment transaction will be deleted, so the payment disappears from every balance and report. Cancelled invoices are final.'
          : 'A cancelled invoice cannot be sent or paid again.'}
        confirmLabel="Cancel invoice"
        cancelLabel="Keep it"
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={del}
        loading={remove.isPending}
        destructive
        title="Delete this draft?"
        description="The draft and its items are removed permanently."
        confirmLabel="Delete draft"
      />
    </>
  );
}
