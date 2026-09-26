import { useState } from 'react';
import { Landmark, Lock, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { Button, IconButton } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Field, Input, Select } from '../../components/ui/Field.jsx';
import { Alert, CardSkeleton, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { ConfirmDialog, Modal } from '../../components/ui/Overlay.jsx';
import { DataTable } from '../../components/ui/Table.jsx';
import { MoneyValue } from '../../components/finance/Finance.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { describeError } from '../../lib/api/errors.js';
import { formatDate } from '../../lib/format.js';
import { minorToInput, parseMoneyInput } from '../../lib/moneyInput.js';
import { categoryIndex, useCreateRule, useDeleteRule, useSaveAccount, useSaveCategory } from './api.js';
import { AmountInput, CategorySelect } from './inputs.jsx';
import styles from './Ledger.module.css';

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank', hint: 'Holds cash; records transactions' },
  { value: 'cash', label: 'Cash', hint: 'Holds cash; records transactions' },
  { value: 'liability', label: 'Liability', hint: 'e.g. a loan — opening balance only' },
  { value: 'equity', label: 'Equity', hint: "Owner's capital — opening balance only" },
];

function OwnerOnly() {
  return <p className={styles.ownerNote}><Lock size={14} aria-hidden="true" /> Only the company owner can change this.</p>;
}

function issueFor(error, field) {
  const item = Array.isArray(error?.details) ? error.details.find((d) => String(d.field ?? '').split('.')[0] === field) : null;
  return item ? `${item.issue.charAt(0).toUpperCase()}${item.issue.slice(1)}.` : undefined;
}

// ---------------------------------------------------------------- accounts

function AccountForm({ account, currency, onClose }) {
  const save = useSaveAccount();
  const toast = useToast();
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState(account?.type ?? 'bank');
  const [opening, setOpening] = useState(account ? minorToInput(account.openingBalance.amount, currency) : '0');
  const [touched, setTouched] = useState(false);
  const parsed = parseMoneyInput(opening, currency, { allowZero: true, allowNegative: true });
  const nameError = (touched && !name.trim() ? 'Enter a name.' : undefined) || issueFor(save.error, 'name') || (save.error?.kind === 'conflict' ? 'An account with this name already exists.' : undefined);
  const openingError = (touched && parsed.error) || issueFor(save.error, 'openingBalance');
  const typeError = issueFor(save.error, 'type');
  const general = save.error && !nameError && !openingError && !typeError ? (save.error.kind === 'unprocessable' ? save.error.message : describeError(save.error)) : null;

  const submit = () => {
    setTouched(true);
    if (!name.trim() || parsed.error) return;
    let body = { name: name.trim(), type, openingBalance: { amount: parsed.minor, currency } };
    if (account) {
      body = {};
      if (name.trim() !== account.name) body.name = name.trim();
      if (type !== account.type) body.type = type;
      if (parsed.minor !== account.openingBalance.amount) body.openingBalance = { amount: parsed.minor, currency };
      if (Object.keys(body).length === 0) { onClose(); return; }
    }
    save.mutate({ id: account?.id, body }, { onSuccess: () => { toast.success(account ? 'Account updated' : 'Account added'); onClose(); } });
  };

  return (
    <Modal
      open
      onClose={save.isPending ? undefined : onClose}
      size="sm"
      title={account ? 'Edit account' : 'Add an account'}
      description="The opening balance is what the account held before its first transaction."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={save.isPending}>{account ? 'Save' : 'Add account'}</Button></>}
    >
      <form className={styles.form} onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        {general && <Alert tone="danger" title={general} />}
        <Field label="Name" required error={nameError}>{(p) => <Input autoFocus maxLength={100} placeholder="e.g. Main bank" value={name} onChange={(e) => { setName(e.target.value); save.reset(); }} {...p} />}</Field>
        <Field label="Type" error={typeError} hint={ACCOUNT_TYPES.find((t) => t.value === type)?.hint}>
          {(p) => <Select value={type} onChange={(e) => { setType(e.target.value); save.reset(); }} {...p}>{ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>}
        </Field>
        <Field label="Opening balance" error={openingError} hint="Can be negative, e.g. an overdraft. It cannot change once the account has transactions.">
          {(p) => <AmountInput currency={currency} value={opening} onChange={(e) => { setOpening(e.target.value); save.reset(); }} {...p} />}
        </Field>
      </form>
    </Modal>
  );
}

export function AccountsPanel({ query, currency, canManage, autoOpen }) {
  const [editing, setEditing] = useState(autoOpen ? 'new' : null);
  if (query.isPending) return <div className={styles.accounts}><CardSkeleton /><CardSkeleton /></div>;
  if (query.isError) return <Card><ErrorState error={query.error} onRetry={() => query.refetch()} /></Card>;
  const accounts = query.data;
  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.muted}>Balances include the opening balance and every transaction up to today.</p>
        {canManage && <Button icon={Plus} onClick={() => setEditing('new')}>Add account</Button>}
      </div>
      {!canManage && <OwnerOnly />}
      {accounts.length === 0 ? (
        <Card><EmptyState icon={Landmark} title="No accounts yet" description="Add the bank and cash accounts your business uses. Liability and equity accounts hold opening balances for the balance sheet." action={canManage && <Button icon={Plus} onClick={() => setEditing('new')}>Add account</Button>} /></Card>
      ) : (
        <div className={styles.accounts}>
          {accounts.map((account) => (
            <Card key={account.id} size="sm" className={styles.account}>
              <div className={styles.accountHead}>
                <div>
                  <p className={styles.accountName}>{account.name}</p>
                  <p className={styles.accountMeta}>{ACCOUNT_TYPES.find((t) => t.value === account.type)?.label} · {account.acceptsTransactions ? 'records transactions' : 'opening balance only'}</p>
                </div>
                {canManage && <IconButton icon={Pencil} size="sm" label={`Edit ${account.name}`} onClick={() => setEditing(account)} />}
              </div>
              <MoneyValue money={account.balance.amount} size="md" semantic={account.balance.amount.amount < 0} />
              <div className={styles.accountFoot}>
                <span>Opening <MoneyValue money={account.openingBalance} size="sm" /></span>
                <span>as of {formatDate(account.balance.asOf)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {editing && <AccountForm account={editing === 'new' ? null : editing} currency={currency} onClose={() => setEditing(null)} />}
    </>
  );
}

// -------------------------------------------------------------- categories

function CategoryForm({ category, categories, defaultType, onClose }) {
  const save = useSaveCategory();
  const toast = useToast();
  const [name, setName] = useState(category?.name ?? '');
  const [type, setType] = useState(category?.type ?? defaultType ?? 'expense');
  const [parentId, setParentId] = useState(category?.parentId ?? '');
  const [touched, setTouched] = useState(false);
  // A subcategory's parent is a top-level category of the same type; one with children cannot become a child.
  const hasChildren = category && categories.some((c) => c.parentId === category.id);
  const parents = categories.filter((c) => !c.isSystem && !c.parentId && c.type === type && c.id !== category?.id);
  const nameError = (touched && !name.trim() ? 'Enter a name.' : undefined) || issueFor(save.error, 'name') || (save.error?.kind === 'conflict' ? 'A category with this name already exists.' : undefined);
  const general = save.error && !nameError ? (save.error.kind === 'unprocessable' ? save.error.message : describeError(save.error)) : null;

  const submit = () => {
    setTouched(true);
    if (!name.trim()) return;
    let body;
    if (category) {
      body = {};
      if (name.trim() !== category.name) body.name = name.trim();
      if ((parentId || null) !== category.parentId) body.parentId = parentId || null;
      if (Object.keys(body).length === 0) { onClose(); return; }
    } else {
      body = { name: name.trim(), type, parentId: parentId || null };
    }
    save.mutate({ id: category?.id, body }, { onSuccess: () => { toast.success(category ? 'Category updated' : 'Category added'); onClose(); } });
  };

  return (
    <Modal
      open
      onClose={save.isPending ? undefined : onClose}
      size="sm"
      title={category ? 'Edit category' : 'Add a category'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={save.isPending}>{category ? 'Save' : 'Add category'}</Button></>}
    >
      <form className={styles.form} onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        {general && <Alert tone="danger" title={general} />}
        <Field label="Name" required error={nameError}>{(p) => <Input autoFocus maxLength={100} value={name} onChange={(e) => { setName(e.target.value); save.reset(); }} {...p} />}</Field>
        <Field label="Type" hint={category ? 'The type cannot change.' : undefined}>
          {(p) => <Select value={type} disabled={Boolean(category)} onChange={(e) => { setType(e.target.value); setParentId(''); }} {...p}><option value="expense">Expense</option><option value="income">Income</option></Select>}
        </Field>
        <Field label="Parent category" hint={hasChildren ? 'This category has subcategories, so it stays top-level.' : 'Optional. Two levels at most.'}>
          {(p) => (
            <Select value={parentId} disabled={hasChildren} onChange={(e) => { setParentId(e.target.value); save.reset(); }} {...p}>
              <option value="">None (top level)</option>
              {parents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
        </Field>
      </form>
    </Modal>
  );
}

export function CategoriesPanel({ query, canManage }) {
  const [editing, setEditing] = useState(null);
  if (query.isPending) return <div className={styles.catColumns}><CardSkeleton lines={5} /><CardSkeleton lines={5} /></div>;
  if (query.isError) return <Card><ErrorState error={query.error} onRetry={() => query.refetch()} /></Card>;
  const categories = query.data;
  const system = categories.find((c) => c.isSystem);

  const column = (type, title) => {
    const tops = categories.filter((c) => c.type === type && !c.parentId);
    return (
      <Card>
        <CardHeader title={title} action={canManage && <Button size="sm" variant="secondary" icon={Plus} onClick={() => setEditing({ new: true, type })}>Add</Button>} />
        {tops.length === 0 ? <p className={styles.muted}>No {title.toLowerCase()} categories yet.</p> : (
          <ul className={styles.catList}>
            {tops.flatMap((parent) => [parent, ...categories.filter((c) => c.parentId === parent.id)]).map((c) => (
              <li key={c.id} className={`${styles.catItem} ${c.parentId ? styles.catChild : ''}`}>
                <span className={styles.catName}><span className={`${styles.catDot} ${styles[`dot_${type}`]}`} aria-hidden="true" />{c.name}</span>
                {canManage && <IconButton icon={Pencil} size="sm" label={`Edit ${c.name}`} onClick={() => setEditing(c)} />}
              </li>
            ))}
          </ul>
        )}
      </Card>
    );
  };

  return (
    <>
      {!canManage && <OwnerOnly />}
      {system && (
        <Card size="sm" padding="sm" className={styles.system}>
          <span className={styles.catName}><span className={`${styles.catDot} ${styles.dot_system}`} aria-hidden="true" />{system.name} <Badge tone="neutral">System</Badge></span>
          <p className={styles.muted}>Anything not categorized lands here, so no transaction disappears from a report. It cannot be renamed or removed.</p>
        </Card>
      )}
      <div className={styles.catColumns}>
        {column('income', 'Income')}
        {column('expense', 'Expense')}
      </div>
      {editing && (
        <CategoryForm
          category={editing.new ? null : editing}
          defaultType={editing.type}
          categories={categories}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

// ------------------------------------------------------------------- rules

function RuleForm({ categories, onClose }) {
  const create = useCreateRule();
  const toast = useToast();
  const [matchType, setMatchType] = useState('contains');
  const [pattern, setPattern] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [touched, setTouched] = useState(false);
  const choices = categories.filter((c) => !c.isSystem);
  const patternError = (touched && !pattern.trim() ? 'Enter the text to match.' : undefined) || issueFor(create.error, 'pattern') || (create.error?.kind === 'conflict' ? 'A rule with this pattern already exists.' : undefined);
  const categoryError = (touched && !categoryId ? 'Choose a category.' : undefined) || issueFor(create.error, 'categoryId');
  const general = create.error && !patternError && !categoryError ? describeError(create.error) : null;

  const submit = () => {
    setTouched(true);
    if (!pattern.trim() || !categoryId) return;
    create.mutate({ matchType, pattern: pattern.trim(), categoryId }, { onSuccess: () => { toast.success('Rule added', 'New transactions that match will be suggested this category.'); onClose(); } });
  };

  return (
    <Modal
      open
      onClose={create.isPending ? undefined : onClose}
      size="sm"
      title="Add a categorization rule"
      description="Rules suggest a category for new transactions. You still confirm each one."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={create.isPending}>Add rule</Button></>}
    >
      <form className={styles.form} onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        {general && <Alert tone="danger" title={general} />}
        <Field label="Match" hint={matchType === 'exact' ? 'The payee (or description) equals the text.' : 'The payee or description contains the text.'}>
          {(p) => <Select value={matchType} onChange={(e) => setMatchType(e.target.value)} {...p}><option value="contains">Contains</option><option value="exact">Is exactly</option></Select>}
        </Field>
        <Field label="Text" required error={patternError} hint="Case and extra spaces are ignored.">{(p) => <Input autoFocus maxLength={200} placeholder="e.g. uber" value={pattern} onChange={(e) => { setPattern(e.target.value); create.reset(); }} {...p} />}</Field>
        <Field label="Category" required error={categoryError}>{(p) => <CategorySelect categories={choices} includeEmpty value={categoryId} onChange={(e) => { setCategoryId(e.target.value); create.reset(); }} {...p} />}</Field>
      </form>
    </Modal>
  );
}

export function RulesPanel({ query, categories, canManage }) {
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const remove = useDeleteRule();
  const toast = useToast();
  const { label } = categoryIndex(categories);
  const rows = query.data ?? [];

  const columns = [
    { key: 'pattern', header: 'When payee or description', primary: true, render: (r) => <span className={styles.cellMain}><span className={styles.cellTitle}>{r.matchType === 'exact' ? 'is exactly' : 'contains'} “{r.pattern}”</span></span> },
    { key: 'category', header: 'Suggest', render: (r) => label(r.categoryId) },
    { key: 'source', header: 'Source', render: (r) => (r.source === 'learned' ? <Badge tone="info">Learned from a correction</Badge> : <Badge tone="neutral">Your rule</Badge>) },
    ...(canManage ? [{ key: 'actions', header: '', align: 'end', width: 60, render: (r) => <IconButton icon={Trash2} size="sm" label="Delete rule" onClick={(e) => { e.stopPropagation(); setDeleting(r); }} /> }] : []),
  ];

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.muted}>Your rules are checked first, then corrections IFRSmart learned from you. No AI model is used.</p>
        {canManage && <Button icon={Plus} onClick={() => setAdding(true)}>Add rule</Button>}
      </div>
      {!canManage && <OwnerOnly />}
      <DataTable
        caption="Categorization rules"
        columns={columns}
        rows={rows}
        loading={query.isPending}
        error={query.isError ? query.error : null}
        onRetry={() => query.refetch()}
        empty={<EmptyState icon={Tags} title="No rules yet" description="Add a rule, or correct a transaction's category — IFRSmart learns from your corrections." compact />}
      />
      {adding && <RuleForm categories={categories} onClose={() => setAdding(false)} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        destructive
        title="Delete this rule?"
        description="Existing transactions keep their categories; new ones will no longer be suggested by it."
        confirmLabel="Delete rule"
        onConfirm={() => remove.mutate(deleting.id, {
          onSuccess: () => { toast.success('Rule deleted'); setDeleting(null); },
          onError: (error) => { toast.error('Could not delete the rule', describeError(error)); setDeleting(null); },
        })}
      />
    </>
  );
}

