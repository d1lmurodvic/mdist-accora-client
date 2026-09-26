import { useRouteError } from 'react-router-dom';
import { ErrorState } from '../components/ui/Feedback.jsx';
import { Card } from '../components/ui/Card.jsx';
import styles from './StatusPage.module.css';

/** Last-resort screen for a render or loading failure inside a route. No stack trace is shown. */
export function RouteError() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);
  return (
    <div className={styles.page}>
      <Card size="hero" padding="lg" className={styles.card}>
        <ErrorState
          error={error?.kind ? error : null}
          title="Something went wrong"
          onRetry={() => window.location.reload()}
        />
      </Card>
    </div>
  );
}
