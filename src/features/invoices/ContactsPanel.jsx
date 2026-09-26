import { useEffect, useState } from 'react';
import { Pencil, Plus, Users } from 'lucide-react';
import { Button, IconButton } from '../../components/ui/Button.jsx';
import { Badge, Pill } from '../../components/ui/Badge.jsx';
import { SearchInput } from '../../components/ui/Field.jsx';
import { DataTable } from '../../components/ui/Table.jsx';
import { EmptyState } from '../../components/ui/Feedback.jsx';
import { useContacts } from './api.js';
import { ContactForm } from './ContactForm.jsx';
import ledger from '../ledger/Ledger.module.css';

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

/** Customers and vendors (GET /companies/current/contacts; the full list, not paginated). */
export function ContactsPanel() {
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [type, setType] = useState('');
  const [editing, setEditing] = useState(null);
  const list = useContacts({ q: q.trim() || undefined, type: type || undefined });

  const columns = [
    { key: 'name', header: 'Name', primary: true, render: (c) => <span className={ledger.cellTitle}>{c.name}</span> },
    { key: 'type', header: 'Type', render: (c) => <Badge tone={c.type === 'customer' ? 'success' : 'neutral'}>{c.type === 'customer' ? 'Customer' : 'Vendor'}</Badge> },
    { key: 'email', header: 'Email', render: (c) => c.email ?? '—' },
    { key: 'phone', header: 'Phone', render: (c) => c.phone ?? '—' },
    { key: 'edit', header: '', align: 'end', width: 60, render: (c) => <IconButton icon={Pencil} size="sm" label={`Edit ${c.name}`} onClick={(e) => { e.stopPropagation(); setEditing(c); }} /> },
  ];

  return (
    <>
      <div className={ledger.toolbar}>
        <div className={`${ledger.filters} ${ledger.flush}`}>
          <SearchInput className={ledger.search} value={search} onChange={setSearch} placeholder="Search by name" />
          <Pill selected={!type} onClick={() => setType('')}>All</Pill>
          <Pill selected={type === 'customer'} onClick={() => setType('customer')}>Customers</Pill>
          <Pill selected={type === 'vendor'} onClick={() => setType('vendor')}>Vendors</Pill>
        </div>
        <Button icon={Plus} onClick={() => setEditing('new')}>Add contact</Button>
      </div>
      <DataTable
        caption="Contacts"
        columns={columns}
        rows={list.data ?? []}
        loading={list.isPending}
        error={list.isError ? list.error : null}
        onRetry={() => list.refetch()}
        onRowClick={setEditing}
        empty={q || type
          ? <EmptyState title="No contacts match" compact />
          : <EmptyState icon={Users} title="No contacts yet" description="Customers you bill and vendors who bill you." action={<Button icon={Plus} onClick={() => setEditing('new')}>Add contact</Button>} />}
      />
      <p className={`${ledger.muted} ${ledger.note}`}>Contacts cannot be deleted, and a contact's type is fixed once invoices use it.</p>
      {editing && <ContactForm contact={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
