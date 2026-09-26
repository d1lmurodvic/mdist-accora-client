import { useState } from 'react';
import { Modal } from '../../components/ui/Overlay.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, Input, Textarea } from '../../components/ui/Field.jsx';
import { Alert } from '../../components/ui/Feedback.jsx';
import { useToast } from '../../providers/ToastProvider.jsx';
import { describeError } from '../../lib/api/errors.js';
import { Segmented } from '../ledger/inputs.jsx';
import { useSaveContact } from './api.js';
import styles from '../ledger/Ledger.module.css';

function issueFor(error, field) {
  const item = Array.isArray(error?.details) ? error.details.find((d) => d.field === field) : null;
  return item ? `${item.issue.charAt(0).toUpperCase()}${item.issue.slice(1)}.` : undefined;
}

/** Create or edit a customer/vendor. `fixedType` locks the type (quick-add from an invoice); `initialName` starts a new one with a name (e.g. read from a document). */
export function ContactForm({ contact, fixedType, initialName, onClose, onSaved }) {
  const save = useSaveContact();
  const toast = useToast();
  const [form, setForm] = useState({
    name: contact?.name ?? initialName ?? '', type: contact?.type ?? fixedType ?? 'customer',
    email: contact?.email ?? '', phone: contact?.phone ?? '', address: contact?.address ?? '',
  });
  const [touched, setTouched] = useState(false);
  const set = (key) => (value) => { setForm((c) => ({ ...c, [key]: value?.target ? value.target.value : value })); if (save.error) save.reset(); };
  const errors = {
    name: (touched && !form.name.trim() ? 'Enter a name.' : undefined) || issueFor(save.error, 'name'),
    email: issueFor(save.error, 'email'),
    phone: issueFor(save.error, 'phone'),
    type: issueFor(save.error, 'type'),
  };
  const general = save.error && !Object.values(errors).some(Boolean) ? (save.error.kind === 'unprocessable' ? save.error.message : describeError(save.error)) : null;

  const submit = () => {
    setTouched(true);
    if (!form.name.trim()) return;
    const value = (key) => (form[key].trim() ? form[key].trim() : null);
    let body = { name: form.name.trim(), type: form.type, email: value('email'), phone: value('phone'), address: value('address') };
    if (contact) {
      body = Object.fromEntries(Object.entries(body).filter(([key, v]) => v !== (contact[key] ?? null)));
      if (Object.keys(body).length === 0) { onClose(); return; }
    }
    save.mutate({ id: contact?.id, body }, {
      onSuccess: (response) => { toast.success(contact ? 'Contact updated' : 'Contact added'); onSaved?.(response.data); onClose(); },
    });
  };

  return (
    <Modal
      open
      onClose={save.isPending ? undefined : onClose}
      size="sm"
      title={contact ? 'Edit contact' : fixedType === 'vendor' ? 'Add a vendor' : fixedType === 'customer' ? 'Add a customer' : 'Add a contact'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={save.isPending}>{contact ? 'Save' : 'Add contact'}</Button></>}
    >
      <form className={styles.form} onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        {general && <Alert tone="danger" title={general} />}
        {!fixedType && (
          <Segmented label="Contact type" value={form.type} onChange={set('type')} options={[{ value: 'customer', label: 'Customer' }, { value: 'vendor', label: 'Vendor' }]} />
        )}
        {errors.type && <Alert tone="danger" title={errors.type} />}
        <Field label="Name" required error={errors.name}>{(p) => <Input autoFocus maxLength={200} value={form.name} onChange={set('name')} {...p} />}</Field>
        <div className={styles.grid2}>
          <Field label="Email" error={errors.email}>{(p) => <Input type="email" inputMode="email" maxLength={254} value={form.email} onChange={set('email')} {...p} />}</Field>
          <Field label="Phone" error={errors.phone}>{(p) => <Input type="tel" maxLength={50} value={form.phone} onChange={set('phone')} {...p} />}</Field>
        </div>
        <Field label="Address">{(p) => <Textarea rows={2} maxLength={500} value={form.address} onChange={set('address')} {...p} />}</Field>
      </form>
    </Modal>
  );
}
