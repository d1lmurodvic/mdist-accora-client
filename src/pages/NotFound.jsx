import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/ui/Feedback.jsx';
import { Card } from '../components/ui/Card.jsx';
import styles from './StatusPage.module.css';

export function NotFound({ inShell = false }) {
  const content = (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="The address may be mistyped, or the page may have moved."
      action={<Link to="/">Go to your workspace</Link>}
    />
  );
  if (inShell) return <Card>{content}</Card>;
  return <div className={styles.page}><Card size="hero" padding="lg" className={styles.card}><p className={styles.code}>404</p>{content}</Card></div>;
}
