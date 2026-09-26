import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CircleAlert, UploadCloud } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Feedback.jsx';
import { describeError } from '../../lib/api/errors.js';
import { ACCEPT_ATTRIBUTE, precheckFile, useUploadDocument } from './api.js';
import styles from './Documents.module.css';

/**
 * Drag-and-drop or pick invoices and receipts. Files are sent one at a time
 * (POST /documents takes exactly one file); each shows its own outcome.
 */
export function UploadZone() {
  const inputId = useId();
  const inputRef = useRef(null);
  const upload = useUploadDocument();
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState([]);

  const patch = (key, changes) => setQueue((items) => items.map((item) => (item.key === key ? { ...item, ...changes } : item)));

  const send = async (files) => {
    const items = files.map((file) => ({ key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`, file, name: file.name, state: 'waiting' }));
    setQueue((current) => [...items, ...current.filter((item) => item.state !== 'done' && item.state !== 'error')].slice(0, 20));
    for (const item of items) {
      const problem = precheckFile(item.file);
      if (problem) { patch(item.key, { state: 'error', message: problem }); continue; }
      patch(item.key, { state: 'uploading' });
      try {
        const response = await upload.mutateAsync(item.file);
        patch(item.key, { state: 'done', id: response.data.id });
      } catch (error) {
        patch(item.key, { state: 'error', message: describeError(error) });
      }
    }
  };

  const onFiles = (list) => { const files = [...(list ?? [])]; if (files.length) send(files); };

  return (
    <section aria-label="Upload documents">
      <div
        className={`${styles.drop} ${dragging ? styles.dragging : ''}`}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragging(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
      >
        <span className={styles.dropIcon}><UploadCloud size={24} aria-hidden="true" /></span>
        <p className={styles.dropTitle}>Drop invoices or receipts here</p>
        <p className={styles.dropHint}>PDF, JPEG, PNG, WebP, GIF or HEIC · up to 10 MB each</p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }}
        />
        <Button className={styles.dropAction} icon={UploadCloud} onClick={() => inputRef.current?.click()}>Choose files</Button>
      </div>
      {queue.length > 0 && (
        <ul className={styles.queue} aria-live="polite" aria-label="Uploads">
          {queue.map((item) => (
            <li key={item.key} className={styles.queueItem}>
              <span className={styles.queueName}>{item.name}</span>
              {item.state === 'waiting' && <span className={styles.queueState}>Waiting</span>}
              {item.state === 'uploading' && <span className={styles.queueState}><Spinner size={14} label="" /> Uploading</span>}
              {item.state === 'done' && (
                <span className={`${styles.queueState} ${styles.queueOk}`}>
                  <CheckCircle2 size={15} aria-hidden="true" /> Uploaded · <Link to={`/app/documents/${item.id}`}>Review</Link>
                </span>
              )}
              {item.state === 'error' && (
                <span className={`${styles.queueState} ${styles.queueError}`}><CircleAlert size={15} aria-hidden="true" /> {item.message}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
