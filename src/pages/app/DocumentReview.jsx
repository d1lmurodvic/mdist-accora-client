import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FilePlus2, ReceiptText, RefreshCw, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/Page.jsx';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert, ErrorState, PageSkeleton, Spinner } from '../../components/ui/Feedback.jsx';
import { ConfirmDialog } from '../../components/ui/Overlay.jsx';
import { CapabilityBadge } from '../../components/finance/Finance.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { describeError } from '../../lib/api/errors.js';
import { formatDate, formatRelativeTime } from '../../lib/format.js';
import { useAccounts, useCategories, useCompany } from '../../features/ledger/api.js';
import { TransactionForm } from '../../features/ledger/TransactionForm.jsx';
import { InvoiceForm } from '../../features/invoices/InvoiceForm.jsx';
import {
  FAILURE_LABEL, formatBytes, useConfirmAsInvoice, useConfirmAsTransaction, useDeleteDocument, useDocument, useExtractDocument, useReaderCapability,
} from '../../features/documents/api.js';
import { DocumentStatus, ExtractedFields, FilePreview, invoicePrefill, transactionPrefill } from '../../features/documents/Review.jsx';
import styles from '../../features/documents/Documents.module.css';

/** Where the document stands, in words, and what was created from it. */
function StatusCard({ document: doc, capability }) {
  const confirmation = doc.confirmation;
  let body;
  if (confirmation) {
    const isInvoice = confirmation.target === 'invoice';
    const id = isInvoice ? confirmation.invoiceId : confirmation.transactionId;
    body = (
      <Alert tone="success" title={isInvoice ? 'A draft invoice was created from this document' : 'Recorded as a transaction'}>
        Confirmed {formatDate(confirmation.confirmedAt.slice(0, 10))}.{' '}
        {id
          ? <Link to={isInvoice ? `/app/invoices?open=${id}` : `/app/transactions?open=${id}`}>{isInvoice ? 'Open the invoice' : 'Open the transaction'}</Link>
          : `The ${isInvoice ? 'invoice' : 'transaction'} created from it has since been deleted.`}
      </Alert>
    );
  } else if (doc.status === 'processing') {
    body = (
      <div className={styles.processing} role="status">
        <Spinner size={22} label="" />
        <div><strong>Reading the document…</strong>This page updates by itself. Nothing is recorded until you confirm.</div>
      </div>
    );
  } else if (doc.status === 'failed') {
    body = (
      <Alert tone="warning" title={FAILURE_LABEL[doc.failure?.code] ?? 'The document could not be read'}>
        {doc.failure?.message} You can still record it by entering the details yourself.
      </Alert>
    );
  } else {
    body = (
      <Alert tone="info" title="Ready to review">
        Check the values below against the original. Fields marked “Check this” were read with low confidence; nothing was guessed.
      </Alert>
    );
  }
  return (
    <Card>
      <CardHeader title="Status" action={<DocumentStatus document={doc} />} />
      {body}
      {capability && <div className={styles.statusRow}><CapabilityBadge capability={capability} /></div>}
    </Card>
  );
}

/**
 * One document: the original next to what was read, and the step that
 * records it. Confirmation sends the values the user reviewed — the read
 * values are never recorded on their own.
 */
export default function DocumentReview() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const query = useDocument(documentId);
  const company = useCompany();
  const accounts = useAccounts();
  const categories = useCategories();
  const reader = useReaderCapability();
  const extract = useExtractDocument();
  const remove = useDeleteDocument();
  const asTransaction = useConfirmAsTransaction(documentId);
  const asInvoice = useConfirmAsInvoice(documentId);
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const breadcrumb = [{ label: 'Documents', to: '/app/documents' }];
  if (query.isPending || company.isPending) return <><PageHeader title="Document" breadcrumb={[...breadcrumb, { label: 'Document' }]} /><PageSkeleton /></>;
  if (query.isError) {
    return (
      <>
        <PageHeader title="Document" breadcrumb={[...breadcrumb, { label: 'Document' }]} />
        <Card>
          <ErrorState
            error={query.error}
            title={query.error.kind === 'not_found' ? 'This document does not exist' : undefined}
            onRetry={query.error.kind === 'not_found' ? undefined : () => query.refetch()}
          />
        </Card>
      </>
    );
  }

  const doc = query.data.data;
  const capability = query.data.meta?.capability;
  const currency = company.data?.currency;
  const fields = doc.extraction?.fields ?? null;
  const name = doc.originalFilename ?? 'Untitled document';
  const open = !doc.confirmation && doc.status !== 'processing';
  const hasPostingAccount = accounts.data?.some((a) => a.acceptsTransactions);
  // Whether the reader works now — not how this document was read (it may predate the reader).
  const canReread = !doc.confirmation && doc.status !== 'processing' && Boolean(reader.data?.available);

  const reread = () => extract.mutate(doc.id, {
    onSuccess: () => toast.success('Reading again', 'The page updates when it is done.'),
    onError: (error) => toast.error('Could not read it again', describeError(error)),
  });
  const confirmDelete = () => remove.mutate(doc.id, {
    onSuccess: () => { toast.success('Document deleted'); navigate('/app/documents', { replace: true }); },
    onError: (error) => { setDeleting(false); toast.error('Could not delete', describeError(error)); },
  });

  return (
    <>
      <PageHeader
        breadcrumb={[...breadcrumb, { label: name }]}
        title={name}
        description={`Uploaded ${formatRelativeTime(doc.createdAt)} · ${formatBytes(doc.sizeBytes)}`}
        actions={(
          <>
            {canReread && <Button variant="secondary" icon={RefreshCw} loading={extract.isPending} onClick={reread}>Read again</Button>}
            {!doc.confirmation && <Button variant="ghost" icon={Trash2} onClick={() => setDeleting(true)}>Delete</Button>}
          </>
        )}
      />

      <div className={styles.review}>
        <FilePreview document={doc} />
        <div className={styles.column}>
          <StatusCard document={doc} capability={capability} />

          {doc.status !== 'processing' && (
            <Card>
              <CardHeader
                title="What was read"
                description={fields ? 'Confidence is the reader’s own, per field.' : undefined}
              />
              {fields
                ? <ExtractedFields extraction={doc.extraction} />
                : <p className={styles.hint}>Nothing was read from this document, so there is nothing to check. Enter the details from the original when you record it.</p>}
            </Card>
          )}

          {open && (
            <Card>
              <CardHeader title="Record it" description="You review and can change every value before it is saved." />
              <div className={styles.actions}>
                <Button icon={ReceiptText} disabled={!hasPostingAccount || !categories.data} onClick={() => setForm('transaction')}>Record as transaction</Button>
                <Button variant="secondary" icon={FilePlus2} onClick={() => setForm('invoice')}>Create draft invoice</Button>
              </div>
              {accounts.data && !hasPostingAccount && (
                <p className={styles.hint}>To record a transaction, <Link to="/app/transactions?tab=accounts&add=1">add a cash or bank account</Link> first.</p>
              )}
              <p className={styles.hint}>A transaction counts in your figures right away. A draft invoice changes nothing until it is sent and paid.</p>
            </Card>
          )}
        </div>
      </div>

      {form === 'transaction' && (
        <TransactionForm
          open
          accounts={accounts.data}
          categories={categories.data}
          currency={currency}
          prefill={transactionPrefill(fields, currency)}
          mutation={asTransaction}
          title="Record from document"
          description={fields ? 'Filled in from what was read — check each value.' : 'Enter the details from the original document.'}
          submitLabel="Confirm and record"
          onClose={() => { setForm(null); asTransaction.reset(); }}
        />
      )}
      {form === 'invoice' && (
        <InvoiceForm
          currency={currency}
          defaultType="payable"
          prefill={invoicePrefill(fields, currency)}
          mutation={asInvoice}
          title="Draft invoice from document"
          description="Saved as a draft. Check the invoice number, due date and line details before saving."
          onClose={() => { setForm(null); asInvoice.reset(); }}
        />
      )}
      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        destructive
        title="Delete this document?"
        description="The file and everything read from it are removed permanently. Nothing was recorded from it."
        confirmLabel="Delete document"
      />
    </>
  );
}
