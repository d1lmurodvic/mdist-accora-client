import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Bell, CheckCheck, Info, OctagonAlert, Settings, X } from 'lucide-react';
import { PageHeader } from '../../components/ui/Page.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button, IconButton } from '../../components/ui/Button.jsx';
import { Pill } from '../../components/ui/Badge.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { Pagination } from '../../components/ui/Table.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { api } from '../../lib/api/client.js';
import { describeError } from '../../lib/api/errors.js';
import { formatRelativeTime } from '../../lib/format.js';
import { appPathFor } from '../../lib/links.js';
import styles from '../../features/notifications/Notifications.module.css';

const SEVERITY = {
  info: { icon: Info, className: styles.info },
  warning: { icon: AlertTriangle, className: styles.warning },
  critical: { icon: OctagonAlert, className: styles.critical },
};

/** The screen that shows the notification's subject. */
function pathFor(n) {
  const id = n.link?.entityId ?? n.entityId;
  switch (n.link?.entityType ?? n.entityType) {
    case 'document': return `/app/documents/${id}`;
    case 'invoice': return `/app/invoices?open=${id}`;
    case 'transaction': return `/app/transactions?open=${id}`;
    case 'anomaly': return '/app/intelligence?tab=anomalies';
    case 'forecast': return '/app/intelligence?tab=forecast';
    default: return appPathFor(n.link?.path);
  }
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['notifications'] });
}

/** In-app notifications (GET /notifications): real events only, per user. */
export default function Notifications() {
  const toast = useToast();
  const navigate = useNavigate();
  const invalidate = useInvalidateNotifications();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [unreadOnly]);
  const list = useQuery({
    queryKey: ['notifications', 'list', { page, unreadOnly }],
    queryFn: async ({ signal }) => api.get('/notifications', { query: { page, limit: 20, unreadOnly }, signal }),
    placeholderData: keepPreviousData,
  });
  const read = useMutation({ mutationFn: (id) => api.post(`/notifications/${id}/read`), onSuccess: invalidate });
  const readAll = useMutation({ mutationFn: () => api.post('/notifications/read-all'), onSuccess: invalidate });
  const dismiss = useMutation({ mutationFn: (id) => api.delete(`/notifications/${id}`), onSuccess: invalidate });
  const rows = list.data?.data ?? [];
  const unread = list.data?.meta?.unreadCount ?? 0;

  const open = (n) => {
    if (!n.readAt) read.mutate(n.id);
    const to = pathFor(n);
    if (to) navigate(to);
  };
  const fail = (title) => (error) => toast.error(title, describeError(error));

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Events in your books that need attention. Choose which ones you get in Settings."
        actions={(
          <>
            <Button variant="ghost" icon={Settings} onClick={() => navigate('/app/settings?tab=notifications')}>Preferences</Button>
            <Button
              variant="secondary"
              icon={CheckCheck}
              disabled={unread === 0}
              loading={readAll.isPending}
              onClick={() => readAll.mutate(undefined, { onSuccess: (r) => toast.success(`${r.data.updated} marked as read`), onError: fail('Could not mark as read') })}
            >
              Mark all as read
            </Button>
          </>
        )}
      />
      <div className={styles.filters} role="group" aria-label="Show">
        <Pill selected={!unreadOnly} onClick={() => setUnreadOnly(false)}>All</Pill>
        <Pill selected={unreadOnly} onClick={() => setUnreadOnly(true)}>Unread{unread ? ` · ${unread}` : ''}</Pill>
      </div>
      {list.isPending ? <CardSkeleton lines={5} />
        : list.isError ? <Card><ErrorState error={list.error} onRetry={() => list.refetch()} /></Card>
          : rows.length === 0 ? (
            <Card>
              <EmptyState
                icon={Bell}
                title={unreadOnly ? 'You are all caught up' : 'No notifications yet'}
                description="You are notified about overdue and paid invoices, processed documents, unusual transactions and a forecast that falls below zero."
              />
            </Card>
          ) : (
            <Card padding="none">
              <ul className={styles.list} aria-label="Notifications">
                {rows.map((n) => {
                  const severity = SEVERITY[n.severity] ?? SEVERITY.info;
                  const to = pathFor(n);
                  return (
                    <li key={n.id} className={`${styles.item} ${n.readAt ? '' : styles.unread}`}>
                      <span className={`${styles.icon} ${severity.className}`}><severity.icon size={16} aria-hidden="true" /></span>
                      <button type="button" className={styles.main} onClick={() => open(n)} disabled={!to && Boolean(n.readAt)}>
                        <span className={styles.title}>
                          {!n.readAt && <span className={styles.dot} aria-label="Unread" />}
                          {n.title}
                        </span>
                        <span className={styles.body}>{n.body}</span>
                        <span className={styles.time}>{formatRelativeTime(n.createdAt)}</span>
                      </button>
                      <div className={styles.actions}>
                        {!n.readAt && <IconButton icon={CheckCheck} size="sm" label={`Mark as read: ${n.title}`} onClick={() => read.mutate(n.id, { onError: fail('Could not mark as read') })} />}
                        <IconButton icon={X} size="sm" label={`Dismiss: ${n.title}`} onClick={() => dismiss.mutate(n.id, { onSuccess: () => toast.success('Dismissed'), onError: fail('Could not dismiss') })} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
      <Pagination meta={list.data?.meta} onPageChange={setPage} />
      <p className={styles.note}>A dismissed notification does not come back. <Link to="/app/settings?tab=notifications">Notification preferences</Link></p>
    </>
  );
}
