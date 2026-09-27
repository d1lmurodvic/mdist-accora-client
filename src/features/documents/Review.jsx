import { useEffect, useState } from 'react';
import { Download, FileQuestion } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton, Spinner } from '../../components/ui/Feedback.jsx';
import { ConfidenceBadge, MoneyValue, StatusBadge } from '../../components/finance/Finance.jsx';
import { describeError } from '../../lib/api/errors.js';
import { formatDate } from '../../lib/format.js';
import { rateToInput } from '../../lib/moneyInput.js';
import { STATUS_LABEL, useDocumentFile } from './api.js';
import styles from './Documents.module.css';

const STATUS_TONE = { processing: 'info', ready: 'warning', failed: 'neutral' };

/** Processing state, or what the document became once confirmed. */
export function DocumentStatus({ document }) {
  if (document.confirmation) {
    return <StatusBadge status="confirmed" label={document.confirmation.target === 'invoice' ? 'Draft invoice created' : 'Recorded'} />;
  }
  return (
    <Badge tone={STATUS_TONE[document.status]} dot={document.status !== 'processing'}>
      {document.status === 'processing' && <Spinner size={12} label="" />}
      {STATUS_LABEL[document.status] ?? document.status}
    </Badge>
  );
}

const PREVIEWABLE_IMAGES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Save a Blob under a name (no dependency). */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The original file, fetched through the authorised endpoint and shown from memory. */
export function FilePreview({ document: doc }) {
  const file = useDocumentFile(doc.id);
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file.data) return undefined;
    const next = URL.createObjectURL(file.data);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file.data]);
  const name = doc.originalFilename ?? `document-${doc.id}`;

  let body;
  if (file.isPending) body = <Skeleton height={420} />;
  else if (file.isError) body = <div className={styles.previewFallback}><FileQuestion size={28} aria-hidden="true" />{describeError(file.error)}</div>;
  else if (url && PREVIEWABLE_IMAGES.includes(doc.mimeType)) body = <img src={url} alt={`Original document: ${name}`} />;
  else if (url && doc.mimeType === 'application/pdf') body = <iframe src={url} title={`Original document: ${name}`} />;
  else body = <div className={styles.previewFallback}><FileQuestion size={28} aria-hidden="true" />This file type cannot be previewed in the browser. Download it to view.</div>;

  return (
    <Card className={styles.preview} padding="sm">
      <CardHeader
        title="Original"
        action={<Button variant="secondary" size="sm" icon={Download} disabled={!file.data} onClick={() => saveBlob(file.data, name)}>Download</Button>}
      />
      <div className={styles.previewFrame}>{body}</div>
      {doc.mimeType === 'application/pdf' && file.data && <p className={styles.hint}>Shown by your browser’s PDF viewer. If it stays blank, download the file.</p>}
    </Card>
  );
}

const FIELD_LABELS = {
  documentType: 'Type', invoiceNumber: 'Invoice number', date: 'Date', dueDate: 'Due date', currency: 'Currency', vendor: 'Vendor', customer: 'Customer', subtotal: 'Subtotal', tax: 'Tax', total: 'Total', lineItems: 'Line items',
};
const REVIEW_LABEL = { missing: 'Not found', low_confidence: 'Check this', currency_mismatch: 'Different currency', totals_mismatch: 'Subtotal and tax do not match total', invalid_date_order: 'Due date is before invoice date', incomplete_lines: 'Complete missing line details before saving', fractional_quantity: 'Invoice drafts require whole-number quantities; review these lines' };

function FieldValue({ name, value }) {
  if (value === null || value === undefined) return <span className={styles.missing}>Not found</span>;
  if (name === 'documentType') return value === 'invoice' ? 'Invoice' : 'Receipt';
  if (name === 'date' || name === 'dueDate') return formatDate(value);
  if (['subtotal', 'tax', 'total'].includes(name)) return <MoneyValue money={value} size="sm" />;
  if (name === 'lineItems') {
    if (value.length === 0) return <span className={styles.missing}>None</span>;
    return (
      <table className={styles.items}>
        <thead><tr><th>Description</th><th className={styles.num}>Qty</th><th className={styles.num}>Unit price</th><th className={styles.num}>Tax</th></tr></thead>
        <tbody>
          {value.map((line, index) => (
            <tr key={index}>
              <td>{line.description ?? 'Not found'}</td>
              <td className={styles.num}>{line.quantity ?? 'Not found'}</td>
              <td className={styles.num}><>{line.unitPrice ? <MoneyValue money={line.unitPrice} size="sm" /> : 'Not found'}</></td>
              <td className={styles.num}>{line.taxRate === null ? '—' : `${rateToInput(line.taxRate) || '0'}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return String(value);
}

/** What was read, with the reader's own per-field confidence and review flags. */
export function ExtractedFields({ extraction }) {
  const flags = (extraction.needsReview ?? []).reduce((result, item) => {
    (result[item.field] ??= []).push(item);
    return result;
  }, {});
  return (
    <dl className={styles.fields}>
      {Object.keys(FIELD_LABELS).map((name) => {
        const field = extraction.fields[name] ?? { value: null, confidence: null };
        const reasons = (flags[name] ?? []).map((item) => item.reason).filter((reason) => reason !== 'missing');
        const flag = reasons.length > 0;
        return (
          <div key={name} className={`${styles.field} ${flag ? styles.flagged : ''}`}>
            <dt>{FIELD_LABELS[name]}</dt>
            <dd>
              <FieldValue name={name} value={field.value} />
              <ConfidenceBadge confidence={field.confidence} />
              {reasons.map((reason) => <Badge key={reason} tone="warning">{REVIEW_LABEL[reason] ?? reason}</Badge>)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export { invoicePrefill, transactionPrefill } from './prefill.js';
