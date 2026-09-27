import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Download, FileScan, FileText, Tags } from 'lucide-react';
import { PageHeader } from '../../components/ui/Page.jsx';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Alert, CardSkeleton, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { DateRangeSelector } from '../../components/ui/DateRangeSelector.jsx';
import { MoneyValue } from '../../components/finance/Finance.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { api } from '../../lib/api/client.js';
import { describeError } from '../../lib/api/errors.js';
import { saveBlob } from '../../lib/download.js';
import { formatPeriod } from '../../lib/format.js';
import { usePeriodParam } from '../../features/dashboard/api.js';
import { categoryIndex, useCategories } from '../../features/ledger/api.js';
import { Figures, Notes, SectionRow } from '../../features/reports/parts.jsx';
import reports from '../../features/reports/Reports.module.css';

const useTax = (path, period) => useQuery({
  queryKey: ['dashboard', 'tax', path, period],
  queryFn: async ({ signal }) => (await api.get(path, { query: period, signal })).data,
  placeholderData: keepPreviousData,
});

function CategoryTable({ title, group }) {
  return (
    <>
      <SectionRow label={title} span={3} />
      {group.byCategory.length === 0
        ? <tr><td colSpan={3} className={reports.muted}>None in this period.</td></tr>
        : group.byCategory.map((line) => (
          <tr key={line.category.id}>
            <td>{line.category.name}</td>
            <td className={reports.num}><span className={reports.count}>{line.transactionCount}</span></td>
            <td className={reports.num}><MoneyValue money={line.total} size="sm" /></td>
          </tr>
        ))}
      <tr className={reports.totalRow}><td>Total {title.toLowerCase()}</td><td /><td className={reports.num}><MoneyValue money={group.total} size="sm" /></td></tr>
    </>
  );
}

function Gap({ icon: Icon, label, count, basis, to, action }) {
  return (
    <li className={reports.gap}>
      <span className={reports.gapIcon}><Icon size={16} aria-hidden="true" /></span>
      <div className={reports.gapText}>
        <strong>{count} {label}</strong>
        {basis && <span className={reports.count}>{basis}</span>}
      </div>
      {count > 0 && to && <Link to={to}>{action}</Link>}
    </li>
  );
}

/**
 * Tax center (PRODUCT_REQUIREMENTS.md #22): tax-relevant figures and the gaps
 * in them, organised for a professional preparer. Nothing here calculates,
 * files or advises on tax — the backend says so and so does this screen.
 */
export default function Tax() {
  const toast = useToast();
  const [period, setPeriod] = usePeriodParam();
  const summary = useTax('/tax/summary', period);
  const gaps = useTax('/tax/completeness', period);
  const categories = useCategories();
  const [exporting, setExporting] = useState(false);
  const s = summary.data;
  const g = gaps.data;
  const uncategorizedId = categories.data ? categoryIndex(categories.data).uncategorized?.id : null;
  const range = g ? `from=${g.period.start}&to=${g.period.end}` : '';

  const exportPeriod = async () => {
    setExporting(true);
    try {
      const response = await api.get('/tax/export', { query: period });
      const file = new Blob([JSON.stringify({ data: response.data, meta: response.meta }, null, 2)], { type: 'application/json' });
      saveBlob(file, `accora-tax-export-${response.data.period.start}-to-${response.data.period.end}.json`);
      toast.success('Export downloaded', response.meta?.truncated ? 'Only the first 10,000 transactions are included.' : 'JSON for your tax preparer.');
    } catch (error) {
      toast.error('Export failed', describeError(error));
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Tax"
        description="Tax-relevant income, expenses and gaps for a period, ready for your tax preparer."
        actions={<Button variant="secondary" icon={Download} loading={exporting} onClick={exportPeriod}>Export for preparer</Button>}
      />
      <div className={reports.controls}>
        <DateRangeSelector value={period} onChange={setPeriod} resolved={s?.period} />
      </div>
      {s && (
        <div className={reports.stackGap}>
          <Alert tone="info" title="Inputs for a tax professional">{s.disclaimer}</Alert>
        </div>
      )}

      <div className={reports.stack}>
        <Card>
          <CardHeader
            title="What is missing"
            description={g ? formatPeriod(g.period) : undefined}
            action={g && (g.complete ? <Badge tone="success" icon={CheckCircle2}>Complete</Badge> : <Badge tone="warning" dot>Gaps found</Badge>)}
          />
          {gaps.isPending ? <CardSkeleton lines={3} /> : gaps.isError ? <ErrorState error={gaps.error} compact onRetry={() => gaps.refetch()} /> : (
            <>
              <ul className={reports.gaps}>
                <Gap
                  icon={Tags}
                  label="uncategorized transactions"
                  count={g.uncategorizedTransactions.count}
                  to={uncategorizedId ? `/app/transactions?${range}&categoryId=${uncategorizedId}` : `/app/transactions?${range}`}
                  action="Categorize"
                />
                <Gap icon={FileScan} label="expenses without a receipt" count={g.expensesWithoutReceipt.count} basis={g.expensesWithoutReceipt.basis} to="/app/documents" action="Upload receipts" />
                <Gap icon={FileText} label="sent invoices without a payment" count={g.invoicesWithoutPayment.count} basis={g.invoicesWithoutPayment.basis} to="/app/invoices" action="Review invoices" />
              </ul>
              <Notes notes={[g.note]} />
            </>
          )}
        </Card>

        {summary.isPending ? <Card><CardSkeleton lines={6} /></Card> : summary.isError ? <Card><ErrorState error={summary.error} onRetry={() => summary.refetch()} /></Card> : (
          <Card>
            <CardHeader title="Tax-relevant figures" description={`${formatPeriod(s.period)} · ${s.transactionCount} transactions · jurisdiction: ${s.jurisdiction ?? 'not configured'}`} />
            {s.empty ? (
              <EmptyState title="No transactions in this period" description="Choose another period or record income and expenses." action={<Link to="/app/transactions">Go to transactions</Link>} />
            ) : (
              <>
                <Figures
                  items={[
                    { label: 'Income', value: <MoneyValue money={s.income.total} size="md" /> },
                    { label: 'Expenses', value: <MoneyValue money={s.expenses.total} size="md" /> },
                    { label: `Tax on paid receivables · ${s.invoiceTax.onReceivables.invoiceCount}`, value: <MoneyValue money={s.invoiceTax.onReceivables.tax} size="md" /> },
                    { label: `Tax on paid payables · ${s.invoiceTax.onPayables.invoiceCount}`, value: <MoneyValue money={s.invoiceTax.onPayables.tax} size="md" /> },
                  ]}
                />
                <div className={reports.tableWrap}>
                  <table className={reports.statement}>
                    <caption className="sr-only">Income and expenses by category</caption>
                    <thead><tr><th scope="col">Category</th><th scope="col" className={reports.num}>Transactions</th><th scope="col" className={reports.num}>Total</th></tr></thead>
                    <tbody>
                      <CategoryTable title="Income" group={s.income} />
                      <CategoryTable title="Expenses" group={s.expenses} />
                    </tbody>
                  </table>
                </div>
                <Notes notes={[s.invoiceTax.basis]} />
              </>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
