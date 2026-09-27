import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Pill } from '../../components/ui/Badge.jsx';
import { Textarea } from '../../components/ui/Field.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { ConfirmDialog } from '../../components/ui/Overlay.jsx';
import { MoneyValue } from '../../components/finance/Finance.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { describeError } from '../../lib/api/errors.js';
import { formatDate, formatPeriod } from '../../lib/format.js';
import { refPath, useAsk, useClearConversation, useConversation } from './api.js';
import { Capability } from './Findings.jsx';
import styles from './Intelligence.module.css';

const STARTERS = ['What is my cash balance?', 'What is my profit this month?', 'How much do customers owe me?', 'When will I run out of cash?', 'Are there unusual transactions?'];

function ReferenceValue({ value }) {
  if (value && typeof value === 'object' && 'amount' in value && 'currency' in value) return <MoneyValue money={value} size="sm" />;
  if (value === null || value === undefined) return '—';
  return <span className="tabular">{String(value)}</span>;
}

function Answer({ message, onAsk }) {
  return (
    <div className={`${styles.bubble} ${styles.assistant}`}>
      <span>{message.content}</span>
      {message.references?.length > 0 && (
        <ul className={styles.refs} aria-label="Figures used">
          {message.references.map((ref, index) => {
            const to = refPath(ref.ref);
            const when = ref.period ? formatPeriod(ref.period) : ref.asOf ? `as of ${formatDate(ref.asOf)}` : null;
            return (
              <li key={`${ref.label}-${index}`}>
                <span>{to ? <Link to={to}>{ref.label}</Link> : ref.label}{when ? ` · ${when}` : ''}</span>
                <ReferenceValue value={ref.value} />
              </li>
            );
          })}
        </ul>
      )}
      {message.suggestions?.length > 0 && (
        <div className={styles.suggestions}>
          {message.suggestions.map((s) => <Pill key={s} onClick={() => onAsk(s)}>{s}</Pill>)}
        </div>
      )}
      {message.disclaimer && <span className={styles.disclaimer}>{message.disclaimer}</span>}
    </div>
  );
}

/** The assistant (POST/GET/DELETE /ai/assistant/messages): answers from your own figures, and says when it cannot. */
export function AssistantPanel() {
  const toast = useToast();
  const conversation = useConversation();
  const ask = useAsk();
  const clear = useClearConversation();
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const endRef = useRef(null);
  const messages = conversation.data?.data ?? [];

  useEffect(() => { endRef.current?.scrollIntoView?.({ block: 'end' }); }, [messages.length, pending]);

  const send = (text) => {
    const message = text.trim();
    if (!message || ask.isPending) return;
    setPending(message);
    setDraft('');
    ask.mutate(message, {
      onSettled: () => setPending(null),
      onError: (error) => { setDraft(message); toast.error('The question was not sent', describeError(error)); },
    });
  };

  return (
    <>
      <Capability meta={conversation.data?.meta} />
      <Card className={styles.chat}>
        {conversation.isPending ? <CardSkeleton lines={5} />
          : conversation.isError ? <ErrorState error={conversation.error} onRetry={() => conversation.refetch()} />
            : (
              <div className={styles.messages} aria-live="polite">
                {messages.length === 0 && !pending && (
                  <EmptyState
                    icon={MessageSquare}
                    title="Ask about your figures"
                    description="Answers come from the same figures as your reports. It never changes your data."
                    action={<div className={styles.suggestions}>{STARTERS.map((s) => <Pill key={s} onClick={() => send(s)}>{s}</Pill>)}</div>}
                  />
                )}
                {messages.map((m) => (m.role === 'user'
                  ? <div key={m.id} className={`${styles.bubble} ${styles.user}`}>{m.content}</div>
                  : <Answer key={m.id} message={m} onAsk={send} />))}
                {pending && <div className={`${styles.bubble} ${styles.user}`}>{pending}</div>}
                {pending && <div className={`${styles.bubble} ${styles.assistant}`}><span className={styles.meta}>Looking at your figures…</span></div>}
                <div ref={endRef} />
              </div>
            )}
        <form className={styles.composer} onSubmit={(e) => { e.preventDefault(); send(draft); }}>
          <Textarea
            aria-label="Your question"
            rows={2}
            maxLength={1000}
            placeholder="e.g. Why did expenses go up last month?"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft); } }}
          />
          <Button type="submit" icon={Send} loading={ask.isPending} disabled={!draft.trim()}>Ask</Button>
          {messages.length > 0 && <Button variant="ghost" icon={Trash2} onClick={() => setConfirming(true)} aria-label="Clear conversation" />}
        </form>
      </Card>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => clear.mutate(undefined, { onSuccess: () => { setConfirming(false); toast.success('Conversation cleared'); }, onError: (error) => toast.error('Could not clear', describeError(error)) })}
        loading={clear.isPending}
        destructive
        title="Clear this conversation?"
        description="Your questions and the answers are deleted for you. Your financial data is not affected."
        confirmLabel="Clear"
      />
    </>
  );
}
