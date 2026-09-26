import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../components/ui/Page.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Tabs } from '../../components/ui/Menu.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { ErrorState, PageSkeleton } from '../../components/ui/Feedback.jsx';
import { useCompany } from '../../features/ledger/api.js';
import { InvoicesPanel } from '../../features/invoices/InvoicesPanel.jsx';
import { ContactsPanel } from '../../features/invoices/ContactsPanel.jsx';
import { InvoiceDrawer } from '../../features/invoices/InvoiceDrawer.jsx';
import { InvoiceForm } from '../../features/invoices/InvoiceForm.jsx';
import { PaymentForm } from '../../features/invoices/PaymentForm.jsx';
import ledger from '../../features/ledger/Ledger.module.css';

const TABS = [{ id: 'invoices', label: 'Invoices' }, { id: 'contacts', label: 'Contacts' }];

/**
 * Invoice management (PRODUCT_REQUIREMENTS.md #9): receivables and payables
 * from draft to paid, and the contacts they are issued to. Totals come from
 * the server; a payment becomes a real transaction.
 */
export default function Invoices() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'contacts' ? 'contacts' : 'invoices';
  const company = useCompany();
  // ?open=<id> (e.g. from a document) opens that invoice.
  const [openId, setOpenId] = useState(() => params.get('open'));
  const [form, setForm] = useState(null);
  const [paying, setPaying] = useState(null);

  const header = (
    <PageHeader
      title="Invoices"
      description="Money owed to you and money you owe, from draft to paid."
      actions={tab === 'invoices' && <Button icon={Plus} onClick={() => setForm({ invoice: null })}>New invoice</Button>}
    />
  );
  if (company.isPending) return <>{header}<PageSkeleton /></>;
  if (company.isError) return <>{header}<Card><ErrorState error={company.error} onRetry={() => company.refetch()} /></Card></>;

  return (
    <>
      {header}
      <div className={ledger.toolbar}>
        <Tabs tabs={TABS} value={tab} onChange={(id) => setParams(id === 'invoices' ? {} : { tab: id }, { replace: true })} label="Invoice sections" />
      </div>
      {tab === 'invoices'
        ? <InvoicesPanel onOpen={setOpenId} onCreate={() => setForm({ invoice: null })} />
        : <ContactsPanel />}

      {openId && !form && !paying && (
        <InvoiceDrawer
          invoiceId={openId}
          onClose={() => { setOpenId(null); if (params.has('open')) setParams({}, { replace: true }); }}
          onEdit={(invoice) => setForm({ invoice })}
          onPay={(invoice) => setPaying(invoice)}
        />
      )}
      {form && (
        <InvoiceForm
          key={form.invoice?.id ?? 'new'}
          invoice={form.invoice}
          currency={company.data.currency}
          onClose={() => setForm(null)}
          onSaved={(invoice) => setOpenId(invoice.id)}
        />
      )}
      {paying && <PaymentForm invoice={paying} onClose={() => setPaying(null)} />}
    </>
  );
}
