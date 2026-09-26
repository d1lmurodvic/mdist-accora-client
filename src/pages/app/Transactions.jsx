import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../components/ui/Page.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Tabs } from '../../components/ui/Menu.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { ErrorState, PageSkeleton } from '../../components/ui/Feedback.jsx';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useAccounts, useCategories, useCompany, useRules } from '../../features/ledger/api.js';
import { TransactionsPanel } from '../../features/ledger/TransactionsPanel.jsx';
import { TransactionForm } from '../../features/ledger/TransactionForm.jsx';
import { AccountsPanel, CategoriesPanel, RulesPanel } from '../../features/ledger/SetupPanels.jsx';
import styles from '../../features/ledger/Ledger.module.css';

const TABS = [
  { id: 'transactions', label: 'Transactions' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'categories', label: 'Categories' },
  { id: 'rules', label: 'Rules' },
];

/**
 * Income & expense tracking (PRODUCT_REQUIREMENTS.md #8, #11): the ledger and
 * the setup it depends on — accounts, categories and categorization rules.
 * The tab lives in the URL (?tab=…); "?new=1" opens the record form.
 */
export default function Transactions() {
  const { role } = useAuth();
  const canManage = role === 'owner';
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'transactions';
  const company = useCompany();
  const accounts = useAccounts();
  const categories = useCategories();
  const rules = useRules();
  const [form, setForm] = useState(null);

  // Filters from a drill-down link (?type&categoryId&from&to), read once when the page opens.
  const [drilldown] = useState(() => {
    const iso = (value) => (/^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? value : undefined);
    const type = ['income', 'expense'].includes(params.get('type')) ? params.get('type') : undefined;
    return { type, categoryId: params.get('categoryId') || undefined, from: iso(params.get('from')), to: iso(params.get('to')) };
  });
  const clearOpen = useCallback(() => setParams({}, { replace: true }), [setParams]);
  const setTab = (id) => setParams(id === 'transactions' ? {} : { tab: id }, { replace: true });
  const hasPostingAccount = accounts.data?.some((account) => account.acceptsTransactions);

  // "?new=1" (e.g. from the dashboard) opens the record form — but only once
  // there is an account to record on; otherwise the "add an account" state shows.
  useEffect(() => {
    if (params.get('new') !== '1' || !accounts.data || !categories.data || !company.data) return;
    if (hasPostingAccount) setForm({ transaction: null });
    setParams({}, { replace: true });
  }, [params, accounts.data, categories.data, company.data, hasPostingAccount, setParams]);

  const header = (
    <PageHeader
      title="Transactions"
      description="Every income and expense, the accounts they move through, and how they are categorized."
      actions={tab === 'transactions' && hasPostingAccount && <Button icon={Plus} onClick={() => setForm({ transaction: null })}>Record transaction</Button>}
    />
  );

  if (company.isPending || accounts.isPending || categories.isPending) return <>{header}<PageSkeleton /></>;
  const failed = [company, accounts, categories].find((q) => q.isError);
  if (failed) return <>{header}<Card><ErrorState error={failed.error} onRetry={() => { company.refetch(); accounts.refetch(); categories.refetch(); }} /></Card></>;
  const currency = company.data.currency;

  return (
    <>
      {header}
      <div className={styles.toolbar}>
        <Tabs tabs={TABS.map((t) => (t.id === 'rules' ? { ...t, count: rules.data?.length } : t))} value={tab} onChange={setTab} label="Ledger sections" />
      </div>

      {tab === 'transactions' && (
        <TransactionsPanel
          accounts={accounts.data}
          categories={categories.data}
          canManage={canManage}
          onRecord={() => setForm({ transaction: null })}
          onEdit={(transaction) => setForm({ transaction })}
          onGoToAccounts={() => setParams({ tab: 'accounts', add: '1' }, { replace: true })}
          openId={params.get('open')}
          initialFilters={drilldown}
          onOpened={clearOpen}
        />
      )}
      {tab === 'accounts' && <AccountsPanel query={accounts} currency={currency} canManage={canManage} autoOpen={canManage && params.get('add') === '1'} />}
      {tab === 'categories' && <CategoriesPanel query={categories} canManage={canManage} />}
      {tab === 'rules' && <RulesPanel query={rules} categories={categories.data} canManage={canManage} />}

      {form && (
        <TransactionForm
          key={form.transaction?.id ?? 'new'}
          open
          transaction={form.transaction}
          accounts={accounts.data}
          categories={categories.data}
          currency={currency}
          onClose={() => setForm(null)}
        />
      )}
    </>
  );
}
