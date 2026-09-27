import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Save, Trash2, RotateCcw } from 'lucide-react';
import { PageHeader } from '../../components/ui/Page.jsx';
import { Tabs } from '../../components/ui/Menu.jsx';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Field, Input, Select, Switch } from '../../components/ui/Field.jsx';
import { Alert, CardSkeleton, ErrorState } from '../../components/ui/Feedback.jsx';
import { ConfirmDialog } from '../../components/ui/Overlay.jsx';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { api } from '../../lib/api/client.js';
import { describeError } from '../../lib/api/errors.js';
import { SUPPORTED_CURRENCIES, formatDate } from '../../lib/format.js';
import { useCompany } from '../../features/ledger/api.js';
import ledger from '../../features/ledger/Ledger.module.css';
import styles from '../../features/intelligence/Intelligence.module.css';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'company', label: 'Company' },
  { id: 'members', label: 'Members' },
  { id: 'notifications', label: 'Notifications' },
];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const NOTIFICATION_TYPES = [
  { id: 'forecast_below_zero', label: 'Cash forecast falls below zero', description: 'A critical warning. Turning it off needs your confirmation.' },
  { id: 'invoice_overdue', label: 'Invoice overdue', description: 'A sent invoice passed its due date.' },
  { id: 'invoice_paid', label: 'Invoice paid', description: 'A payment was recorded on an invoice.' },
  { id: 'anomaly_detected', label: 'Unusual transaction', description: 'A medium or high flag was raised.' },
  { id: 'anomaly_confirmed', label: 'Unusual transaction confirmed', description: 'Someone confirmed a flag as a real issue.' },
  { id: 'document_processed', label: 'Document processed', description: 'An upload was read, or could not be read.' },
];

/** Field → message from a 400/422 envelope (`details: [{ field, issue }]`). */
const fieldIssues = (error) => {
  const out = {};
  for (const item of Array.isArray(error?.details) ? error.details : []) {
    const key = String(item.field ?? '').split('.')[0];
    if (key && !out[key]) out[key] = `${item.issue.charAt(0).toUpperCase()}${item.issue.slice(1)}.`;
  }
  return out;
};

function Profile() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '' });
  const [pw, setPw] = useState({ current: '', next: '', repeat: '' });
  const [pwTouched, setPwTouched] = useState(false);
  const save = useMutation({ mutationFn: (body) => api.patch('/users/me', body) });
  const change = useMutation({ mutationFn: (body) => api.post('/users/me/password', body) });
  const server = fieldIssues(save.error);
  const errors = {
    name: (!form.name.trim() ? 'Enter your name.' : undefined) || server.name,
    email: (save.error?.kind === 'conflict' ? 'Another account uses this email.' : undefined) || server.email,
  };
  const pwErrors = {
    current: (pwTouched && !pw.current ? 'Enter your current password.' : undefined) || (change.error?.kind === 'unprocessable' ? 'The current password is not correct.' : undefined),
    next: (pwTouched && pw.next.length < 8 ? 'At least 8 characters.' : undefined) || fieldIssues(change.error).newPassword,
    repeat: pwTouched && pw.repeat !== pw.next ? 'The passwords do not match.' : undefined,
  };
  const changed = form.name.trim() !== user?.name || form.email.trim().toLowerCase() !== user?.email;

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !changed) return;
    const body = {};
    if (form.name.trim() !== user.name) body.name = form.name.trim();
    if (form.email.trim().toLowerCase() !== user.email) body.email = form.email.trim();
    save.mutate(body, { onSuccess: async () => { await refresh(); toast.success('Profile saved'); } });
  };
  const submitPassword = (e) => {
    e.preventDefault();
    setPwTouched(true);
    if (!pw.current || pw.next.length < 8 || pw.repeat !== pw.next) return;
    change.mutate({ currentPassword: pw.current, newPassword: pw.next }, {
      onSuccess: () => { setPw({ current: '', next: '', repeat: '' }); setPwTouched(false); toast.success('Password changed', 'Your other sessions were signed out.'); },
    });
  };

  return (
    <div className={styles.split}>
      <Card>
        <CardHeader title="Profile" description={user ? `Member since ${formatDate(user.createdAt.slice(0, 10))}` : undefined} />
        <form className={ledger.form} onSubmit={submit} noValidate>
          {save.error && !errors.email && !server.name && <Alert tone="danger" title={describeError(save.error)} />}
          <Field label="Name" required error={errors.name}>{(p) => <Input maxLength={200} value={form.name} onChange={(e) => { setForm((c) => ({ ...c, name: e.target.value })); save.reset(); }} {...p} />}</Field>
          <Field label="Email" required error={errors.email}>{(p) => <Input type="email" maxLength={254} value={form.email} onChange={(e) => { setForm((c) => ({ ...c, email: e.target.value })); save.reset(); }} {...p} />}</Field>
          <div><Button type="submit" icon={Save} disabled={!changed} loading={save.isPending}>Save profile</Button></div>
        </form>
      </Card>
      <Card>
        <CardHeader title="Password" description="Changing it signs out your other sessions." />
        <form className={ledger.form} onSubmit={submitPassword} noValidate>
          {change.error && !pwErrors.current && !pwErrors.next && <Alert tone="danger" title={describeError(change.error)} />}
          <Field label="Current password" required error={pwErrors.current}>{(p) => <Input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => { setPw((c) => ({ ...c, current: e.target.value })); change.reset(); }} {...p} />}</Field>
          <Field label="New password" required hint="8 to 128 characters." error={pwErrors.next}>{(p) => <Input type="password" autoComplete="new-password" maxLength={128} value={pw.next} onChange={(e) => setPw((c) => ({ ...c, next: e.target.value }))} {...p} />}</Field>
          <Field label="Repeat new password" required error={pwErrors.repeat}>{(p) => <Input type="password" autoComplete="new-password" maxLength={128} value={pw.repeat} onChange={(e) => setPw((c) => ({ ...c, repeat: e.target.value }))} {...p} />}</Field>
          <div><Button type="submit" variant="secondary" icon={KeyRound} loading={change.isPending}>Change password</Button></div>
        </form>
      </Card>
    </div>
  );
}

function Company({ canManage }) {
  const company = useCompany();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [confirmFiscal, setConfirmFiscal] = useState(null);
  const [confirmDemo, setConfirmDemo] = useState(null);
  const save = useMutation({ mutationFn: (body) => api.patch('/companies/current', body) });
  const demo = useMutation({ mutationFn: (action) => (action === 'remove' ? api.delete('/companies/current/demo-data') : api.post('/companies/current/demo-data', {})) });
  if (company.isPending) return <CardSkeleton lines={6} />;
  if (company.isError) return <Card><ErrorState error={company.error} onRetry={() => company.refetch()} /></Card>;
  const c = company.data;
  const f = form ?? { name: c.name, industry: c.industry ?? '', size: c.size ?? '', currency: c.currency, fiscalYearStartMonth: String(c.fiscalYearStartMonth) };
  const set = (key) => (e) => { setForm({ ...f, [key]: e.target.value }); save.reset(); };
  const server = fieldIssues(save.error);
  const body = () => {
    const out = {};
    if (f.name.trim() !== c.name) out.name = f.name.trim();
    if ((f.industry.trim() || null) !== c.industry) out.industry = f.industry.trim() || null;
    if ((f.size.trim() || null) !== c.size) out.size = f.size.trim() || null;
    if (f.currency !== c.currency) out.currency = f.currency;
    if (Number(f.fiscalYearStartMonth) !== c.fiscalYearStartMonth) out.fiscalYearStartMonth = Number(f.fiscalYearStartMonth);
    return out;
  };
  const changes = body();
  const send = (extra = {}) => save.mutate({ ...changes, ...extra }, {
    onSuccess: async () => {
      setForm(null); setConfirmFiscal(null);
      // Currency and fiscal year change every period and figure: refresh everything.
      await queryClient.invalidateQueries();
      toast.success('Company settings saved');
    },
    onError: (error) => {
      if (error.kind === 'unprocessable' && error.details?.some((d) => d.field === 'fiscalYearStartMonth' && /confirm/.test(d.issue))) setConfirmFiscal(error.message);
    },
  });
  const runDemo = () => demo.mutate(confirmDemo, {
    onSuccess: async () => { setConfirmDemo(null); await queryClient.invalidateQueries(); toast.success(confirmDemo === 'remove' ? 'Demo data removed' : 'Demo data reset'); },
    onError: (error) => { setConfirmDemo(null); toast.error('That did not work', describeError(error)); },
  });

  return (
    <div className={styles.stack}>
      {!canManage && <Alert tone="info" title="Only an owner can change company settings." />}
      <Card>
        <CardHeader title="Company" description={`Created ${formatDate(c.createdAt.slice(0, 10))} · time zone ${c.timezone} (not yet settable)`} action={c.isDemo ? <Badge tone="warning">Demo company</Badge> : null} />
        <form className={ledger.form} onSubmit={(e) => { e.preventDefault(); if (Object.keys(changes).length && f.name.trim()) send(); }} noValidate>
          {save.error && !confirmFiscal && !Object.keys(server).some((k) => ['name', 'industry', 'size'].includes(k)) && <Alert tone="danger" title={save.error.kind === 'unprocessable' ? save.error.message : describeError(save.error)} />}
          <Field label="Company name" required error={(!f.name.trim() ? 'Enter a name.' : undefined) || server.name}>{(p) => <Input maxLength={200} disabled={!canManage} value={f.name} onChange={set('name')} {...p} />}</Field>
          <div className={ledger.grid2}>
            <Field label="Industry" error={server.industry}>{(p) => <Input maxLength={100} disabled={!canManage} value={f.industry} onChange={set('industry')} {...p} />}</Field>
            <Field label="Size" error={server.size}>{(p) => <Input maxLength={100} disabled={!canManage} placeholder="e.g. 5–10 people" value={f.size} onChange={set('size')} {...p} />}</Field>
          </div>
          <div className={ledger.grid2}>
            <Field label="Currency" hint="Cannot change once there are accounts, transactions or invoices — amounts are never converted.">
              {(p) => <Select disabled={!canManage} value={f.currency} onChange={set('currency')} {...p}>{SUPPORTED_CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}</Select>}
            </Field>
            <Field label="Fiscal year starts in" hint="Moves every quarter and year in reports.">
              {(p) => <Select disabled={!canManage} value={f.fiscalYearStartMonth} onChange={set('fiscalYearStartMonth')} {...p}>{MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}</Select>}
            </Field>
          </div>
          {canManage && <div><Button type="submit" icon={Save} disabled={!Object.keys(changes).length || !f.name.trim()} loading={save.isPending}>Save company</Button></div>}
        </form>
      </Card>
      {canManage && c.isDemo && (
        <Card>
          <CardHeader title="Demo data" description="This workspace holds a fictional dataset. Reset it to the original, or remove it and start with your own records." />
          <div className={styles.itemActions}>
            <Button variant="secondary" icon={RotateCcw} onClick={() => setConfirmDemo('reset')}>Reset demo data</Button>
            <Button variant="danger" icon={Trash2} onClick={() => setConfirmDemo('remove')}>Remove demo data</Button>
          </div>
        </Card>
      )}
      <ConfirmDialog
        open={Boolean(confirmFiscal)}
        onClose={() => setConfirmFiscal(null)}
        onConfirm={() => send({ confirm: true })}
        loading={save.isPending}
        title="Change the fiscal year start?"
        description={confirmFiscal ?? ''}
        confirmLabel="Change it"
      />
      <ConfirmDialog
        open={Boolean(confirmDemo)}
        onClose={() => setConfirmDemo(null)}
        onConfirm={runDemo}
        loading={demo.isPending}
        destructive
        title={confirmDemo === 'remove' ? 'Remove the demo data?' : 'Reset the demo data?'}
        description={confirmDemo === 'remove'
          ? 'Every demo record and upload is deleted. The company, its members and settings stay.'
          : 'Every demo record is replaced with the original dataset. Changes you made to it are lost.'}
        confirmLabel={confirmDemo === 'remove' ? 'Remove' : 'Reset'}
      />
    </div>
  );
}

function Members({ canManage }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const members = useQuery({ queryKey: ['members'], queryFn: async ({ signal }) => (await api.get('/companies/current/members', { signal })).data });
  const setRole = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/members/${id}`, { role }),
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: ['members'] }), queryClient.invalidateQueries({ queryKey: ['auth'] })]),
  });
  if (members.isPending) return <CardSkeleton lines={4} />;
  if (members.isError) return <Card><ErrorState error={members.error} onRetry={() => members.refetch()} /></Card>;
  return (
    <Card>
      <CardHeader title="Members" description="People with access to this company. Owners manage accounts, categories, rules and settings." />
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Name</th><th>Role</th><th>Joined</th></tr></thead>
          <tbody>
            {members.data.map((m) => (
              <tr key={m.id}>
                <td><strong>{m.user.name}</strong>{m.user.id === user?.id ? ' (you)' : ''}<div className={styles.meta}>{m.user.email}</div></td>
                <td>
                  {canManage ? (
                    <Select
                      aria-label={`Role of ${m.user.name}`}
                      value={m.role}
                      disabled={setRole.isPending}
                      onChange={(e) => setRole.mutate({ id: m.id, role: e.target.value }, {
                        onSuccess: () => toast.success('Role changed'),
                        onError: (error) => toast.error('Role not changed', error.kind === 'unprocessable' ? error.message : describeError(error)),
                      })}
                    >
                      <option value="owner">Owner</option>
                      <option value="member">Member</option>
                    </Select>
                  ) : <Badge>{m.role === 'owner' ? 'Owner' : 'Member'}</Badge>}
                </td>
                <td>{formatDate(m.createdAt.slice(0, 10))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.meta}>Inviting new members is not available yet.</p>
    </Card>
  );
}

function NotificationPreferences() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const prefs = useQuery({ queryKey: ['preferences'], queryFn: async ({ signal }) => (await api.get('/users/me/preferences', { signal })).data });
  const [critical, setCritical] = useState(false);
  const save = useMutation({
    mutationFn: (body) => api.patch('/users/me/preferences', body),
    onSuccess: (response) => { queryClient.setQueryData(['preferences'], response.data); queryClient.invalidateQueries({ queryKey: ['notifications'] }); },
  });
  if (prefs.isPending) return <CardSkeleton lines={6} />;
  if (prefs.isError) return <Card><ErrorState error={prefs.error} onRetry={() => prefs.refetch()} /></Card>;
  const toggle = (id, value, acknowledgeCritical) => save.mutate(
    { notifications: { [id]: value }, ...(acknowledgeCritical ? { acknowledgeCritical: true } : {}) },
    { onSuccess: () => { setCritical(false); toast.success(value ? 'Turned on' : 'Turned off'); }, onError: (error) => toast.error('Not saved', describeError(error)) },
  );
  return (
    <Card>
      <CardHeader title="In-app notifications" description="Choose which events notify you. These settings are yours; other members choose their own." />
      <div className={styles.stack}>
        {NOTIFICATION_TYPES.map((t) => (
          <Switch
            key={t.id}
            label={t.label}
            description={t.description}
            checked={Boolean(prefs.data.notifications[t.id])}
            disabled={save.isPending}
            onChange={(value) => (t.id === 'forecast_below_zero' && !value ? setCritical(true) : toggle(t.id, value))}
          />
        ))}
      </div>
      <ConfirmDialog
        open={critical}
        onClose={() => setCritical(false)}
        onConfirm={() => toggle('forecast_below_zero', false, true)}
        loading={save.isPending}
        destructive
        title="Turn off the cash warning?"
        description="You will not be warned when your cash forecast falls below zero. You can turn it back on at any time."
        confirmLabel="Turn it off"
      />
    </Card>
  );
}

/** Settings (PRODUCT_REQUIREMENTS.md #2, #3, #24): profile, company, members and notification preferences. */
export default function SettingsPage() {
  const { role } = useAuth();
  const canManage = role === 'owner';
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'profile';
  return (
    <>
      <PageHeader title="Settings" description="Your profile, your company and how Accora keeps you informed." />
      <div className={ledger.toolbar}>
        <Tabs tabs={TABS} value={tab} onChange={(id) => setParams(id === 'profile' ? {} : { tab: id }, { replace: true })} label="Settings sections" />
      </div>
      {tab === 'profile' && <Profile />}
      {tab === 'company' && <Company canManage={canManage} />}
      {tab === 'members' && <Members canManage={canManage} />}
      {tab === 'notifications' && <NotificationPreferences />}
    </>
  );
}
