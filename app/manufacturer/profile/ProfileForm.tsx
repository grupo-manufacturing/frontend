'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import ProductPicker, { type ProductSelection } from '../../admin/manufacturers/ProductPicker';
import { toast } from '../../admin/toast';
import { ErrorBanner, Field, ghostButtonCls, Icon, ICONS, inputCls, PageHeader, primaryButtonCls } from '../../admin/ui';
import PhoneInput from '../../request-for-quotation/PhoneInput';
import {
  expireManufacturerSession,
  fetchProfile,
  ManufacturerAuthError,
  updateProfile,
  type ManufacturerDetails,
  type ProfileInput,
} from '../api';
import { useManufacturerToken } from '../ManufacturerShell';

const TYPE_LABELS: Record<ManufacturerDetails['manufacturerType'], string> = {
  garments: 'Garments Manufacturer',
  fabric: 'Fabric Manufacturer',
};

type FormState = ProductSelection & {
  phoneCountry: CountryCode;
  phoneNumber: string;
  location: string;
  fabrics: string;
};

function toForm(profile: ManufacturerDetails): FormState {
  const phone = parsePhoneNumberFromString(profile.phone);
  return {
    phoneCountry: phone?.country ?? 'IN',
    phoneNumber: phone?.nationalNumber ?? profile.phone,
    location: profile.location,
    fabrics: profile.fabrics ?? '',
    products: profile.products,
    winnerProduct: profile.winnerProduct ?? '',
  };
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

function errorMessage(err: unknown, fallback: string): string | null {
  if (err instanceof ManufacturerAuthError) {
    expireManufacturerSession();
    return null;
  }
  return err instanceof Error ? err.message : fallback;
}

export default function ProfileForm() {
  const token = useManufacturerToken();
  const [profile, setProfile] = useState<ManufacturerDetails | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await fetchProfile(token);
      setProfile(result);
      setForm(toForm(result));
      setSaveError('');
    } catch (err) {
      const message = errorMessage(err, 'Failed to load your profile.');
      if (message) setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => f && { ...f, [key]: value });

  const dirty = !!profile && !!form && JSON.stringify(form) !== JSON.stringify(toForm(profile));

  const discard = () => {
    if (!profile) return;
    setForm(toForm(profile));
    setSaveError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !form) return;

    const phone = parsePhoneNumberFromString(form.phoneNumber, form.phoneCountry);
    if (!phone?.isValid()) {
      setSaveError(`Enter a valid phone number for +${getCountryCallingCode(form.phoneCountry)}.`);
      return;
    }
    if (profile.manufacturerType === 'garments' && form.products.length === 0) {
      setSaveError('Select at least one product.');
      return;
    }

    const contact = { phone: phone.number, location: form.location.trim() };
    const input: ProfileInput =
      profile.manufacturerType === 'fabric'
        ? { ...contact, fabrics: form.fabrics.trim() }
        : { ...contact, products: form.products, winnerProduct: form.winnerProduct };

    setSaving(true);
    setSaveError('');
    try {
      const saved = await updateProfile(token, input);
      setProfile(saved);
      setForm(toForm(saved));
      toast.success('Profile saved');
    } catch (err) {
      const message = errorMessage(err, 'Failed to save your profile.');
      if (message) setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Profile" loading={loading} onRefresh={load} />

      <ErrorBanner message={loadError} />

      {loading && !profile ? (
        <ProfileSkeleton />
      ) : (
        profile &&
        form && (
          <div className="space-y-6">
            <CompanyCard profile={profile} />

            <form onSubmit={handleSubmit} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="divide-y divide-zinc-100">
                <Section title="Contact details" description="How Grupo reaches you about orders and payments.">
                  <Field label="Phone" htmlFor="p-phone">
                    <PhoneInput
                      id="p-phone"
                      variant="admin"
                      country={form.phoneCountry}
                      onCountryChange={(country) => set('phoneCountry', country)}
                      number={form.phoneNumber}
                      onNumberChange={(number) => set('phoneNumber', number)}
                    />
                  </Field>
                  <Field label="Location" htmlFor="p-location">
                    <input
                      id="p-location"
                      required
                      maxLength={200}
                      value={form.location}
                      onChange={(e) => set('location', e.target.value)}
                      placeholder="Tiruppur, Tamil Nadu"
                      className={inputCls}
                    />
                  </Field>
                </Section>

                {profile.manufacturerType === 'fabric' ? (
                  <Section title="Fabrics" description="The fabrics you make. Grupo uses this to match you with the right orders.">
                    <Field label="Fabrics you manufacture" htmlFor="p-fabrics" hint="Separate fabrics with commas." className="sm:col-span-2">
                      <textarea
                        id="p-fabrics"
                        required
                        rows={3}
                        maxLength={500}
                        value={form.fabrics}
                        onChange={(e) => set('fabrics', e.target.value)}
                        placeholder="Cotton jersey, French terry, Fleece, Denim"
                        className={`${inputCls} min-h-20 resize-none py-2`}
                      />
                    </Field>
                  </Section>
                ) : (
                  <Section
                    title="Products"
                    description="The products you make, and the one you're best at. Grupo uses this to match you with the right orders."
                  >
                    <ProductPicker
                      value={{ products: form.products, winnerProduct: form.winnerProduct }}
                      onChange={(selection) => setForm((f) => f && { ...f, ...selection })}
                      winnerHint="The product you're best at."
                    />
                  </Section>
                )}
              </div>

              {saveError && (
                <p className="mx-6 mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/15">
                  {saveError}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50/60 px-6 py-3.5">
                <p className="flex items-center gap-2 text-sm text-zinc-500">
                  {dirty ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      You have unsaved changes
                    </>
                  ) : (
                    <>
                      <Icon d={ICONS.check} className="h-4 w-4 text-emerald-600" />
                      All changes saved
                    </>
                  )}
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={discard} disabled={!dirty || saving} className={ghostButtonCls}>
                    Discard
                  </button>
                  <button type="submit" disabled={!dirty || saving} className={primaryButtonCls}>
                    {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        )
      )}
    </main>
  );
}

function CompanyCard({ profile }: { profile: ManufacturerDetails }) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-zinc-900 text-lg font-semibold tracking-wide text-white">
            {initials(profile.companyName)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-zinc-900">{profile.companyName}</h2>
            <span className="mt-1 inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
              {TYPE_LABELS[profile.manufacturerType]}
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-x-10 gap-y-4 text-sm sm:grid-cols-2">
          <Detail icon={ICONS.mail} label="Email" value={profile.email} />
          <Detail icon={ICONS.info} label="GST No." value={profile.gstNumber} mono />
        </dl>
      </div>
    </section>
  );
}

function Detail({ icon, label, value, mono = false }: { icon: string; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-500">
        <Icon d={icon} />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-zinc-500">{label}</dt>
        <dd className={`mt-0.5 break-all font-medium text-zinc-900 ${mono ? 'admin-mono' : ''}`}>{value}</dd>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-5 px-6 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
      <div className="grid max-w-3xl grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading your profile">
      <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="h-14 w-14 animate-pulse rounded-xl bg-zinc-100" />
        <div className="space-y-2">
          <div className="h-4 w-48 animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-100" />
        </div>
      </div>
      <div className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        {[0, 1].map((row) => (
          <div key={row} className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />
              <div className="h-3 w-52 animate-pulse rounded bg-zinc-100" />
            </div>
            <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="h-10 animate-pulse rounded-lg bg-zinc-100" />
              <div className="h-10 animate-pulse rounded-lg bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
