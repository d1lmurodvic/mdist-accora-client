import { useState } from 'react';
import { ArrowRight, Building2, Check, Database, FlaskConical, LogOut } from 'lucide-react';
import { PublicPanel } from './PublicLayout.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, Input, Select } from '../../components/ui/Field.jsx';
import { Alert } from '../../components/ui/Feedback.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { describeError } from '../../lib/api/errors.js';
import { SUPPORTED_CURRENCIES } from '../../lib/format.js';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useCreateCompany, useFinishOnboarding } from '../../features/auth/api.js';
import { sentence, serverFieldErrors } from '../../features/auth/forms.js';
import styles from './Onboarding.module.css';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SIZES = ['Just me', '2–10 people', '11–50 people', '51–200 people', 'More than 200'];

/**
 * Onboarding (PRODUCT_REQUIREMENTS.md #3): 1) the company — POST /companies;
 * 2) start empty or load the clearly labelled demo dataset, then
 * POST /companies/current/complete-onboarding. A reload resumes at step 2
 * once the company exists.
 */
export default function Onboarding() {
  const { onboarding, signOut, user } = useAuth();
  const step = onboarding?.companyCreated ? 2 : 1;
  const firstName = user?.name?.split(/\s+/)[0];

  return (
    <PublicPanel
      wide
      title={step === 1 ? `Welcome${firstName ? `, ${firstName}` : ''}` : 'How would you like to start?'}
      description={step === 1 ? 'Tell us about your company. You can change these details later.' : 'You can remove demo data at any time.'}
    >
      <ol className={styles.steps} aria-label="Onboarding progress">
        {['Company', 'Your data'].map((label, index) => {
          const number = index + 1;
          const state = number < step ? 'done' : number === step ? 'current' : 'next';
          return (
            <li key={label} className={`${styles.step} ${styles[state]}`} aria-current={state === 'current' ? 'step' : undefined}>
              <span className={styles.stepDot}>{state === 'done' ? <Check size={14} aria-hidden="true" /> : number}</span>
              {label}
            </li>
          );
        })}
      </ol>
      {step === 1 ? <CompanyStep /> : <DataStep />}
      <button type="button" className={styles.signOut} onClick={signOut}><LogOut size={14} aria-hidden="true" /> Sign out</button>
    </PublicPanel>
  );
}

function CompanyStep() {
  const create = useCreateCompany();
  const [form, setForm] = useState({ name: '', currency: 'UZS', industry: '', size: '', fiscalYearStartMonth: 1 });
  const [touched, setTouched] = useState(false);
  const server = serverFieldErrors(create.error);
  const nameError = (touched && !form.name.trim() ? 'Enter your company name.' : undefined) || sentence(server.name);
  const formError = create.error && create.error.kind !== 'validation' ? describeError(create.error) : null;
  const set = (key, transform = (v) => v) => (event) => { setForm((c) => ({ ...c, [key]: transform(event.target.value) })); if (create.error) create.reset(); };

  const onSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!form.name.trim()) return;
    create.mutate({
      name: form.name.trim(),
      currency: form.currency,
      industry: form.industry.trim() || null,
      size: form.size || null,
      fiscalYearStartMonth: form.fiscalYearStartMonth,
    });
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {formError && <Alert tone="danger" title={formError} />}
      <Field label="Company name" required error={nameError}>
        {(props) => <Input autoFocus maxLength={200} autoComplete="organization" value={form.name} onChange={set('name')} {...props} />}
      </Field>
      <div className={styles.grid}>
        <Field label="Currency" hint="All amounts use this currency." error={sentence(server.currency)}>
          {(props) => (
            <Select value={form.currency} onChange={set('currency')} {...props}>
              {SUPPORTED_CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Fiscal year starts in" error={sentence(server.fiscalYearStartMonth)}>
          {(props) => (
            <Select value={form.fiscalYearStartMonth} onChange={set('fiscalYearStartMonth', Number)} {...props}>
              {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Industry" hint="Optional." error={sentence(server.industry)}>
          {(props) => <Input maxLength={100} placeholder="e.g. Retail, Consulting" value={form.industry} onChange={set('industry')} {...props} />}
        </Field>
        <Field label="Company size" hint="Optional." error={sentence(server.size)}>
          {(props) => (
            <Select value={form.size} onChange={set('size')} {...props}>
              <option value="">Prefer not to say</option>
              {SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
            </Select>
          )}
        </Field>
      </div>
      <p className={styles.note}>The currency cannot be changed once you record financial data.</p>
      <Button type="submit" size="lg" loading={create.isPending} iconEnd={ArrowRight} className={styles.submit}>Continue</Button>
    </form>
  );
}

function DataStep() {
  const finish = useFinishOnboarding();
  const [choice, setChoice] = useState('empty');
  const options = [
    { id: 'empty', icon: Database, title: 'Start with my own data', text: 'Begin with an empty workspace and record your real accounts, transactions and invoices.' },
    {
      id: 'demo', icon: FlaskConical, title: 'Explore with demo data', badge: 'Fictional',
      text: 'Load a fictional company with eight months of activity to see every screen working. It is clearly labelled and can be removed later.',
    },
  ];

  return (
    <div className={styles.form}>
      {finish.error && <Alert tone="danger" title={describeError(finish.error)} />}
      <div className={styles.choices} role="radiogroup" aria-label="Starting data">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={choice === option.id}
            className={`${styles.choice} ${choice === option.id ? styles.selected : ''}`}
            onClick={() => setChoice(option.id)}
          >
            <span className={styles.choiceIcon}><option.icon size={20} aria-hidden="true" /></span>
            <span className={styles.choiceTitle}>{option.title} {option.badge && <Badge tone="warning">{option.badge}</Badge>}</span>
            <span className={styles.choiceText}>{option.text}</span>
            <span className={styles.radio} aria-hidden="true" />
          </button>
        ))}
      </div>
      <Button size="lg" loading={finish.isPending} iconEnd={ArrowRight} className={styles.submit} onClick={() => finish.mutate({ loadDemo: choice === 'demo' })}>
        {finish.isPending && choice === 'demo' ? 'Preparing demo data…' : 'Go to my dashboard'}
      </Button>
      <p className={styles.note}><Building2 size={14} aria-hidden="true" /> Your company is created. You can change its details later in Settings.</p>
    </div>
  );
}
