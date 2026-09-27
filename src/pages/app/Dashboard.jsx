import { Link } from 'react-router-dom';
import { ArrowRight, FileScan, Receipt } from 'lucide-react';
import { PageHeader } from '../../components/ui/Page.jsx';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Alert, CardSkeleton, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { UploadZone } from '../../features/documents/UploadZone.jsx';
import { DocumentStatus } from '../../features/documents/Review.jsx';
import { useDocuments } from '../../features/documents/api.js';
import styles from './Dashboard.module.css';

/** MVP home: upload, review and approve, then track the saved transaction. */
export default function Dashboard() {
  const { company } = useAuth();
  const documents = useDocuments({ page: 1, limit: 5, sort: 'createdAt:desc' });
  const rows = documents.data?.data ?? [];
  return (
    <>
      <PageHeader eyebrow={company?.name} title="Your workspace"
        description="Upload a receipt or invoice, review the details, and approve it to update your records." />
      <div className={styles.layout}>
        {company?.isDemo && <Alert tone="warning" title="Demo workspace">This workspace contains fictional sample records.</Alert>}
        <section aria-labelledby="upload-heading">
          <h2 id="upload-heading" className={styles.heading}>1. Upload a document</h2>
          <UploadZone />
        </section>
        <Card>
          <CardHeader title="2. Review and approve" description="Your latest uploads. Check the details before saving."
            action={<Link to="/app/documents">All documents</Link>} />
          {documents.isPending ? <CardSkeleton lines={3} />
            : documents.isError ? <ErrorState error={documents.error} onRetry={() => documents.refetch()} title="Documents could not be loaded" />
            : rows.length === 0 ? <EmptyState icon={FileScan} title="No documents yet" description="Upload your first invoice or receipt above to get started." compact />
            : <ul className={styles.documents}>
              {rows.map((document) => (
                <li key={document.id}>
                  <Link to={'/app/documents/' + document.id} className={styles.document}>
                    <FileScan size={20} aria-hidden="true" />
                    <span className={styles.filename}>{document.originalFilename ?? 'Untitled document'}</span>
                    <DocumentStatus document={document} />
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>}
        </Card>
        <Card>
          <CardHeader title="3. Track your transactions" description="Find approved expenses and income in your transaction list." />
          <Link to="/app/transactions" className={styles.transactions}><Receipt size={18} aria-hidden="true" /> View transactions <ArrowRight size={16} aria-hidden="true" /></Link>
        </Card>
      </div>
    </>
  );
}
