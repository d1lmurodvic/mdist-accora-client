import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { PublicPanel } from './PublicLayout.jsx';
import { Button, IconButton } from '../../components/ui/Button.jsx';
import { Field, Input } from '../../components/ui/Field.jsx';
import { Alert } from '../../components/ui/Feedback.jsx';
import { describeError } from '../../lib/api/errors.js';
import { useLogin } from '../../features/auth/api.js';
import { isEmail, sentence, serverFieldErrors } from '../../features/auth/forms.js';
import styles from './AuthForm.module.css';

export default function Login() {
  const login = useLogin();
  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const clientErrors = {
    email: !form.email.trim() ? 'Enter your email.' : !isEmail(form.email) ? 'Enter a valid email address.' : undefined,
    password: !form.password ? 'Enter your password.' : undefined,
  };
  const server = serverFieldErrors(login.error);
  const errors = {
    email: (touched && clientErrors.email) || sentence(server.email),
    password: (touched && clientErrors.password) || sentence(server.password),
  };
  // 401 is deliberately generic: it never says whether the email exists.
  const formError = login.error && login.error.kind !== 'validation'
    ? (login.error.kind === 'unauthorized' ? 'Email or password is incorrect.' : describeError(login.error))
    : null;

  const onSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (clientErrors.email || clientErrors.password) return;
    login.mutate({ email: form.email.trim(), password: form.password });
  };
  const set = (key) => (event) => { setForm((current) => ({ ...current, [key]: event.target.value })); if (login.error) login.reset(); };

  return (
    <PublicPanel title="Welcome back" description="Sign in to your company workspace.">
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {formError && <Alert tone="danger" title={formError} />}
        <Field label="Email" error={errors.email}>
          {(props) => <Input type="email" autoComplete="email" inputMode="email" autoFocus value={form.email} onChange={set('email')} {...props} />}
        </Field>
        <Field label="Password" error={errors.password}>
          {(props) => (
            <div className={styles.password}>
              <Input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={set('password')} {...props} />
              <IconButton
                icon={showPassword ? EyeOff : Eye}
                label={showPassword ? 'Hide password' : 'Show password'}
                size="sm"
                className={styles.reveal}
                onClick={() => setShowPassword((value) => !value)}
              />
            </div>
          )}
        </Field>
        <Button type="submit" size="lg" fullWidth loading={login.isPending} iconEnd={ArrowRight}>Sign in</Button>
      </form>
      <p className={styles.switch}>New to Accora? <Link to="/register">Create an account</Link></p>
    </PublicPanel>
  );
}
