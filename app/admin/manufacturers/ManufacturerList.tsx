'use client';

import { useEffect, useState } from 'react';
import { getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import PhoneInput from '../../request-for-quotation/PhoneInput';
import { useAdminToken } from '../AdminShell';
import {
  AdminAuthError,
  clearSession,
  createManufacturer,
  deleteManufacturer,
  fetchManufacturers,
  updateManufacturer,
  type Manufacturer,
  type ManufacturerInput,
} from '../api';
import {
  DataTable,
  dateFormatter,
  EmptyState,
  ErrorBanner,
  FilterChips,
  formatPhone,
  ghostButtonCls,
  Icon,
  ICONS,
  inputCls,
  PageHeader,
  primaryButtonCls,
  SearchBox,
  StatusPill,
  type StatusStyle,
} from '../ui';
import { useAdminList } from '../useAdminList';

const STATUS_STYLES: Record<string, StatusStyle> = {
  active: { label: 'Active', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  inactive: { label: 'Inactive', pill: 'bg-zinc-100 text-zinc-600 ring-zinc-500/15', dot: 'bg-zinc-400' },
};

const COLUMNS = ['Company', 'Contact', 'Location', 'Status', 'Added', ''];

type FormState = Omit<ManufacturerInput, 'phone'> & { phoneCountry: CountryCode; phoneNumber: string };

const EMPTY_FORM: FormState = { companyName: '', email: '', phoneCountry: 'IN', phoneNumber: '', location: '', status: 'active' };

type DialogState = { mode: 'add' } | { mode: 'edit'; manufacturer: Manufacturer } | null;

export default function ManufacturerList() {
  const token = useAdminToken();
  const list = useAdminList(token, fetchManufacturers, 'Failed to load manufacturers.');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remove = async (manufacturer: Manufacturer) => {
    if (!window.confirm(`Delete ${manufacturer.companyName}? This cannot be undone.`)) return;
    setDeletingId(manufacturer.id);
    list.setError('');
    try {
      await deleteManufacturer(token, manufacturer.id);
      list.setData(
        (current) =>
          current && {
            ...current,
            manufacturers: current.manufacturers.filter((m) => m.id !== manufacturer.id),
            total: current.total - 1,
          },
      );
      list.reloadQuietly();
    } catch (err) {
      list.handleError(err, 'Failed to delete manufacturer.');
    } finally {
      setDeletingId(null);
    }
  };

  const onSaved = () => {
    setDialog(null);
    list.reloadQuietly();
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Manufacturers" loading={list.loading} onRefresh={list.refresh}>
        <button type="button" onClick={() => setDialog({ mode: 'add' })} className={primaryButtonCls}>
          <Icon d={ICONS.plus} />
          Add Manufacturer
        </button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips styles={STATUS_STYLES} value={list.statusFilter} counts={list.data?.counts} onChange={list.selectStatus} />
        <SearchBox value={list.searchInput} onChange={list.setSearchInput} placeholder="Search company, email, phone, location…" />
      </div>

      <ErrorBanner message={list.error} />

      <DataTable
        columns={COLUMNS}
        minWidth="900px"
        loading={list.loading}
        loadingLabel="Loading manufacturers…"
        isEmpty={!list.data || list.data.manufacturers.length === 0}
        empty={
          <EmptyState
            filtered={list.isFiltered}
            noun="manufacturers"
            emptyHint="Add your first manufacturer to start building your network."
            onClearFilters={list.clearFilters}
          />
        }
        page={list.page}
        totalPages={list.totalPages}
        onPageChange={list.goToPage}
      >
        {list.data?.manufacturers.map((m) => (
          <tr key={m.id} className="align-top transition-colors hover:bg-zinc-50/70">
            <td className="px-4 py-4 font-medium text-zinc-900">{m.companyName}</td>
            <td className="px-4 py-4">
              <a href={`mailto:${m.email}`} className="block break-all text-zinc-900 underline-offset-2 hover:underline">
                {m.email}
              </a>
              <a href={`tel:${m.phone}`} className="admin-mono block whitespace-nowrap text-xs text-zinc-500 hover:text-zinc-900">
                {formatPhone(m.phone)}
              </a>
            </td>
            <td className="max-w-[240px] px-4 py-4 text-zinc-600">{m.location}</td>
            <td className="px-4 py-4">
              <StatusPill status={m.status} styles={STATUS_STYLES} />
            </td>
            <td className="whitespace-nowrap px-4 py-4 text-zinc-600">{dateFormatter.format(new Date(m.createdAt))}</td>
            <td className="px-4 py-4">
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setDialog({ mode: 'edit', manufacturer: m })}
                  aria-label={`Edit ${m.companyName}`}
                  title="Edit"
                  className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <Icon d={ICONS.edit} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(m)}
                  disabled={deletingId !== null}
                  aria-label={`Delete ${m.companyName}`}
                  title="Delete"
                  className="grid h-8 w-8 place-items-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon d={ICONS.trash} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {dialog && (
        <ManufacturerDialog
          token={token}
          manufacturer={dialog.mode === 'edit' ? dialog.manufacturer : null}
          onClose={() => setDialog(null)}
          onSaved={onSaved}
        />
      )}
    </main>
  );
}

function ManufacturerDialog({
  token,
  manufacturer,
  onClose,
  onSaved,
}: {
  token: string;
  manufacturer: Manufacturer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (!manufacturer) return EMPTY_FORM;
    const parsed = parsePhoneNumberFromString(manufacturer.phone);
    return {
      companyName: manufacturer.companyName,
      email: manufacturer.email,
      phoneCountry: parsed?.country ?? 'IN',
      phoneNumber: parsed?.nationalNumber ?? manufacturer.phone,
      location: manufacturer.location,
      status: manufacturer.status,
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPhone = parsePhoneNumberFromString(form.phoneNumber, form.phoneCountry);
    if (!parsedPhone?.isValid()) {
      setError(`Enter a valid phone number for +${getCountryCallingCode(form.phoneCountry)}.`);
      return;
    }

    setSaving(true);
    setError('');
    const input: ManufacturerInput = {
      companyName: form.companyName.trim(),
      email: form.email.trim(),
      phone: parsedPhone.number,
      location: form.location.trim(),
      status: form.status,
    };
    try {
      if (manufacturer) await updateManufacturer(token, manufacturer.id, input);
      else await createManufacturer(token, input);
      onSaved();
    } catch (err) {
      if (err instanceof AdminAuthError) {
        clearSession();
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to save manufacturer.');
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-zinc-900/30 px-4 py-16 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manufacturer-dialog-title"
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 id="manufacturer-dialog-title" className="text-base font-semibold">
            {manufacturer ? 'Edit Manufacturer' : 'Add Manufacturer'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <Field label="Company name" htmlFor="m-company">
            <input
              id="m-company"
              required
              autoFocus
              maxLength={150}
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              placeholder="Shree Ganesh Garments"
              className={inputCls}
            />
          </Field>
          <Field label="Email" htmlFor="m-email">
            <input
              id="m-email"
              type="email"
              required
              maxLength={254}
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="contact@shreeganesh.in"
              className={inputCls}
            />
          </Field>
          <Field label="Phone" htmlFor="m-phone">
            <PhoneInput
              id="m-phone"
              variant="admin"
              country={form.phoneCountry}
              onCountryChange={(country) => set('phoneCountry', country)}
              number={form.phoneNumber}
              onNumberChange={(number) => set('phoneNumber', number)}
            />
          </Field>
          <Field label="Location" htmlFor="m-location">
            <input
              id="m-location"
              required
              maxLength={200}
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Tiruppur, Tamil Nadu"
              className={inputCls}
            />
          </Field>
          <Field label="Status">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1">
              {(['active', 'inactive'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => set('status', status)}
                  aria-pressed={form.status === status}
                  className={`flex items-center justify-center gap-2 rounded-md py-1.5 text-sm font-medium transition ${
                    form.status === status ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLES[status].dot}`} />
                  {STATUS_STYLES[status].label}
                </button>
              ))}
            </div>
          </Field>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/15">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <button type="button" onClick={onClose} className={ghostButtonCls}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={primaryButtonCls}>
            {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            {manufacturer ? 'Save Changes' : 'Add Manufacturer'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
