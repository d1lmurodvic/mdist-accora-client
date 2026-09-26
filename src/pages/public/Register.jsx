import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { PublicPanel } from './PublicLayout.jsx';
import { Button, IconButton } from '../../components/ui/Button.jsx';
import { Field, Input } from '../../components/ui/Field.jsx';
import { Alert } from '../../components/ui/Feedback.jsx';
import { describeError } from '../../lib/api/errors.js';
import { useRegister } from '../../features/auth/api.js';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, isEmail, sentence, serverFieldErrors } from '../../features/auth/forms.js';
import styles from './AuthForm.module.css';

export default function Register() {
  const register = useRegister();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const clientErrors = {
    name: !form.name.trim() ? 'Enter your name.' : undefined,
    email: !form.email.trim() ? 'Enter your email.' : !isEmail(form.email) ? 'Enter a valid email address.' : undefined,
    password: form.password.length < PASSWORD_MIN_LENGTH ? `Use at least ${PASSWORD_MIN_LENGTH} characters.`
      : form.password.length > PASSWORD_MAX_LENGTH ? `Use at most ${PASSWORD_MAX_LENGTH} characters.` : undefined,
  };
  const server = serverFieldErrors(register.error);
  const conflict = register.error?.kind === 'conflict';
  const errors = {
    name: (touched && clientErrors.name) || sentence(server.name),
    email: (touched && clientErrors.email) || sentence(server.email) || (conflict ? 'This email cannot be used to register.' : undefined),
    password: (touched && clientErrors.password) || sentence(server.password),
  };
  const formError = register.error && !['validation', 'conflict'].includes(register.error.kind) ? describeError(register.error) : null;

  const onSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (Object.values(clientErrors).some(Boolean)) return;
    register.mutate({ name: form.name.trim(), email: form.email.trim(), password: form.password });
  };
  const set = (key) => (event) => { setForm((current) => ({ ...current, [key]: event.target.value })); if (register.error) register.reset(); };

  return (
    <PublicPanel title="Create your account" description="Then set up your company in a minute.">
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {formError && <Alert tone="danger" title={formError} />}
        <Field label="Your name" error={errors.name}>
          {(props) => <Input autoComplete="name" autoFocus maxLength={200} value={form.name} onChange={set('name')} {...props} />}
        </Field>
        <Field label="Work email" error={errors.email}>
          {(props) => <Input type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set('email')} {...props} />}
        </Field>
        <Field label="Password" hint={`At least ${PASSWORD_MIN_LENGTH} characters.`} error={errors.password}>
          {(props) => (
            <div className={styles.password}>
              <Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} value={form.password} onChange={set('password')} {...props} />
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
        <Button type="submit" size="lg" fullWidth loading={register.isPending} iconEnd={ArrowRight}>Create account</Button>
      </form>
      <p className={styles.switch}>Already have an account? <Link to="/login">Sign in</Link></p>
    </PublicPanel>
  );
}
