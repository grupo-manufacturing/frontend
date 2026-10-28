'use client';

import { useState } from 'react';
import { getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import PhoneInput from '../../request-for-quotation/PhoneInput';
import { useAdminToken } from '../AdminShell';
import {
  AdminAuthError,
  expireSession,
  createManufacturer,
  deleteManufacturer,
  fetchManufacturers,
  updateManufacturer,
  type Manufacturer,
  type ManufacturerInput,
  type ManufacturerType,
} from '../api';
import { toast } from '../toast';
import {
  DataTable,
  dateFormatter,
  Dialog,
  DialogFooter,
  EmptyState,
  ErrorBanner,
  Field,
  FilterChips,
  formatPhone,
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
import ProductPicker from './ProductPicker';

const STATUS_STYLES: Record<string, StatusStyle> = {
  active: { label: 'Active', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  inactive: { label: 'Inactive', pill: 'bg-zinc-100 text-zinc-600 ring-zinc-500/15', dot: 'bg-zinc-400' },
};

const TYPE_LABELS: Record<ManufacturerType, string> = { garments: 'Garments', fabric: 'Fabric' };

const GST_NUMBER = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const COLUMNS = ['Company', 'Contact', 'Type', 'Produces', 'Location', 'Status', 'Added', ''];

type FormState = {
  companyName: string;
  email: string;
  password: string;
  phoneCountry: CountryCode;
  phoneNumber: string;
  location: string;
  gstNumber: string;
  manufacturerType: ManufacturerType;
  fabrics: string;
  products: string[];
  winnerProduct: string;
  status: Manufacturer['status'];
};

const EMPTY_FORM: FormState = {
  companyName: '',
  email: '',
  password: '',
  phoneCountry: 'IN',
  phoneNumber: '',
  location: '',
  gstNumber: '',
  manufacturerType: 'garments',
  fabrics: '',
  products: [],
  winnerProduct: '',
  status: 'active',
};

function ProducesCell({ manufacturer }: { manufacturer: Manufacturer }) {
  if (manufacturer.manufacturerType === 'fabric') {
    return (
      <p className="line-clamp-2 text-zinc-600" title={manufacturer.fabrics ?? undefined}>
        {manufacturer.fabrics}
      </p>
    );
  }

  const others = manufacturer.products.filter((product) => product !== manufacturer.winnerProduct);
  return (
    <div className="space-y-1">
      {manufacturer.winnerProduct && (
        <span
          title="Winner product"
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20"
        >
          ★ {manufacturer.winnerProduct}
        </span>
      )}
      {others.length > 0 && (
        <p className="line-clamp-2 text-xs text-zinc-500" title={others.join(', ')}>
          {others.join(', ')}
        </p>
      )}
    </div>
  );
}

type DialogState = { mode: 'add' } | { mode: 'edit'; manufacturer: Manufacturer } | null;

export default function ManufacturerList() {
  const token = useAdminToken();
  const list = useAdminList(token, fetchManufacturers, 'Failed to load manufacturers.');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remove = async (manufacturer: Manufacturer) => {
    if (!window.confirm(`Delete ${manufacturer.companyName}? This cannot be undone.`)) return;
    setDeletingId(manufacturer.id);
    try {
      await deleteManufacturer(token, manufacturer.id);
      toast.success(`${manufacturer.companyName} deleted`);
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
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Manufacturers" loading={list.loading} onRefresh={list.refresh}>
        <button type="button" onClick={() => setDialog({ mode: 'add' })} className={primaryButtonCls}>
          <Icon d={ICONS.plus} />
          Add Manufacturer
        </button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips styles={STATUS_STYLES} value={list.statusFilter} counts={list.data?.counts} onChange={list.selectStatus} />
        <SearchBox
          value={list.searchInput}
          onChange={list.setSearchInput}
          placeholder="Search company, GST, email, phone, location…"
        />
      </div>

      <ErrorBanner message={list.error} />

      <DataTable
        columns={COLUMNS}
        minWidth="1150px"
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
            <td className="px-4 py-4">
              <span className="block font-medium text-zinc-900">{m.companyName}</span>
              <span className="admin-mono block whitespace-nowrap text-xs text-zinc-500" title="GST No.">
                {m.gstNumber}
              </span>
            </td>
            <td className="px-4 py-4">
              <a href={`mailto:${m.email}`} className="block break-all text-zinc-900 underline-offset-2 hover:underline">
                {m.email}
              </a>
              <a href={`tel:${m.phone}`} className="admin-mono block whitespace-nowrap text-xs text-zinc-500 hover:text-zinc-900">
                {formatPhone(m.phone)}
              </a>
            </td>
            <td className="whitespace-nowrap px-4 py-4">
              <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                {TYPE_LABELS[m.manufacturerType]}
              </span>
            </td>
            <td className="max-w-[260px] px-4 py-4">
              <ProducesCell manufacturer={m} />
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
      password: manufacturer.password,
      phoneCountry: parsed?.country ?? 'IN',
      phoneNumber: parsed?.nationalNumber ?? manufacturer.phone,
      location: manufacturer.location,
      gstNumber: manufacturer.gstNumber,
      manufacturerType: manufacturer.manufacturerType,
      fabrics: manufacturer.fabrics ?? '',
      products: manufacturer.products,
      winnerProduct: manufacturer.winnerProduct ?? '',
      status: manufacturer.status,
    };
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPhone = parsePhoneNumberFromString(form.phoneNumber, form.phoneCountry);
    if (!parsedPhone?.isValid()) {
      setError(`Enter a valid phone number for +${getCountryCallingCode(form.phoneCountry)}.`);
      return;
    }
    const gstNumber = form.gstNumber.trim().toUpperCase();
    if (!GST_NUMBER.test(gstNumber)) {
      setError('Enter a valid 15-character GST number, e.g. 33ABCDE1234F1Z5.');
      return;
    }
    if (form.manufacturerType === 'garments' && form.products.length === 0) {
      setError('Select at least one product.');
      return;
    }

    setSaving(true);
    setError('');
    const base = {
      companyName: form.companyName.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: parsedPhone.number,
      location: form.location.trim(),
      gstNumber,
      status: form.status,
    };
    const input: ManufacturerInput =
      form.manufacturerType === 'fabric'
        ? { ...base, manufacturerType: 'fabric', fabrics: form.fabrics.trim() }
        : { ...base, manufacturerType: 'garments', products: form.products, winnerProduct: form.winnerProduct };
    try {
      if (manufacturer) await updateManufacturer(token, manufacturer.id, input);
      else await createManufacturer(token, input);
      toast.success(`${input.companyName} ${manufacturer ? 'updated' : 'added'}`);
      onSaved();
    } catch (err) {
      if (err instanceof AdminAuthError) {
        expireSession();
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to save manufacturer.');
      setSaving(false);
    }
  };

  return (
    <Dialog
      title={manufacturer ? 'Edit Manufacturer' : 'Add Manufacturer'}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={<DialogFooter saving={saving} submitLabel={manufacturer ? 'Save Changes' : 'Add Manufacturer'} onCancel={onClose} />}
    >
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 px-6 py-5 sm:grid-cols-2">
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
        <Field label="GST No." htmlFor="m-gst">
          <input
            id="m-gst"
            required
            maxLength={15}
            value={form.gstNumber}
            onChange={(e) => set('gstNumber', e.target.value.toUpperCase())}
            placeholder="33ABCDE1234F1Z5"
            autoComplete="off"
            spellCheck={false}
            className={`${inputCls} admin-mono uppercase`}
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
        <Field label="Portal password" htmlFor="m-password" hint="The manufacturer signs in with this email and password.">
          <div className="relative">
            <input
              id="m-password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              maxLength={100}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="At least 8 characters"
              className={`${inputCls} admin-mono pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((show) => !show)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
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
        <Field label="Type of Manufacturer">
          <Segmented
            options={(['garments', 'fabric'] as const).map((type) => ({ value: type, label: TYPE_LABELS[type] }))}
            value={form.manufacturerType}
            onChange={(type) => set('manufacturerType', type)}
          />
        </Field>
        <Field label="Status" hint="Only active manufacturers can sign in.">
          <Segmented
            options={(['active', 'inactive'] as const).map((status) => ({
              value: status,
              label: STATUS_STYLES[status].label,
              dot: STATUS_STYLES[status].dot,
            }))}
            value={form.status}
            onChange={(status) => set('status', status)}
          />
        </Field>

        {form.manufacturerType === 'fabric' ? (
          <Field label="Fabrics you manufacture" htmlFor="m-fabrics" hint="Separate fabrics with commas.">
            <textarea
              id="m-fabrics"
              required
              rows={3}
              maxLength={500}
              value={form.fabrics}
              onChange={(e) => set('fabrics', e.target.value)}
              placeholder="Cotton jersey, French terry, Fleece, Denim"
              className={`${inputCls} min-h-20 resize-none py-2`}
            />
          </Field>
        ) : (
          <ProductPicker
            value={{ products: form.products, winnerProduct: form.winnerProduct }}
            onChange={(selection) => setForm((f) => ({ ...f, ...selection }))}
            winnerHint="The product this manufacturer is best at."
          />
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/15 sm:col-span-2">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; dot?: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`flex items-center justify-center gap-2 rounded-md py-1.5 text-sm font-medium transition ${
            value === option.value ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          {option.dot && <span className={`h-1.5 w-1.5 rounded-full ${option.dot}`} />}
          {option.label}
        </button>
      ))}
    </div>
  );
}
