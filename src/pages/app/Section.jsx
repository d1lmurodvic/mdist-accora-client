import { Construction } from 'lucide-react';
import { PageHeader } from '../../components/ui/Page.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { EmptyState } from '../../components/ui/Feedback.jsx';
import { NAV_ITEMS } from '../../layouts/navigation.js';

const DESCRIPTIONS = {
  dashboard: 'Cash, income, expenses, invoices, insights, forecast and health for the selected period.',
  transactions: 'Every income and expense, with categories and review status.',
  invoices: 'Receivables and payables from draft to paid.',
  reports: 'Profit & loss, balance sheet, cash flow statement and expense report.',
  intelligence: 'Insights, unusual transactions, the cash forecast, financial health and the assistant.',
  tax: 'Tax-relevant figures and gaps, organised for your preparer.',
  accountant: 'Request help from a human accountant.',
  notifications: 'Events that need your attention.',
  settings: 'Profile, company configuration and preferences.',
};

/** Structural placeholder for a section whose screen arrives in a later phase. No data is shown. */
export default function Section({ id }) {
  const item = NAV_ITEMS.find((entry) => entry.to === `/app/${id}`);
  return (
    <>
      <PageHeader title={item?.label ?? id} description={DESCRIPTIONS[id]} />
      <Card>
        <EmptyState
          icon={item?.icon ?? Construction}
          title="This screen is built in a later phase"
          description="The navigation, layout and data foundation are in place. It will show your real figures from the IFRSmart API."
        />
      </Card>
    </>
  );
}
