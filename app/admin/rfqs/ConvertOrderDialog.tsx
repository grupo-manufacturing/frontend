'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { RFQ_MIN_QUANTITY, RFQ_PRODUCTS } from '../../request-for-quotation/api';
import {
  AdminAuthError,
  clearSession,
  convertRfqToOrder,
  fetchAssignableManufacturers,
  type AdminRfq,
  type Manufacturer,
} from '../api';
import { Dialog, DialogFooter, Field, formatInr, ghostButtonCls, Icon, ICONS, inputCls } from '../ui';

type ItemRow = { id: number; product: string; quantity: string; unitPrice: string; manufacturerUnitPrice: string };

const numberInputCls = `${inputCls} admin-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;

/** Multiplies and sums in paise so totals match what the backend computes. */
function totalOf(rows: ItemRow[], price: 'unitPrice' | 'manufacturerUnitPrice'): number {
  return rows.reduce((sum, row) => sum + Math.round((Number(row.quantity) || 0) * (Number(row[price]) || 0) * 100), 0) / 100;
}

function MoneyInput({
  id,
  label,
  value,
  onChange,
  min,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  hint?: string;
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <input
        id={id}
        type="number"
        required
        min={min}
        step={0.01}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className={numberInputCls}
      />
    </Field>
  );
}

function Balance({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-zinc-700">{label}</p>
      <p
        className={`admin-mono flex h-10 items-center rounded-lg px-3 text-sm font-semibold ${
          amount < 0 ? 'bg-red-50 text-red-700' : 'bg-zinc-100 text-zinc-900'
        }`}
      >
        {formatInr(amount)}
      </p>
    </div>
  );
}

export default function ConvertOrderDialog({
  token,
  rfq,
  onClose,
  onConverted,
}: {
  token: string;
  rfq: AdminRfq;
  onClose: () => void;
  onConverted: (order: { id: string; orderNumber: string }) => void;
}) {
  const nextItemId = useRef(rfq.items.length);
  const [items, setItems] = useState<ItemRow[]>(() =>
    rfq.items.map((item, i) => ({
      id: i,
      product: item.product,
      quantity: String(item.quantity),
      unitPrice: '',
      manufacturerUnitPrice: '',
    })),
  );
  const [manufacturers, setManufacturers] = useState<Manufacturer[] | null>(null);
  const [manufacturerId, setManufacturerId] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [amountPaidToManufacturer, setAmountPaidToManufacturer] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchAssignableManufacturers(token)
      .then((list) => {
        if (!cancelled) setManufacturers(list);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof AdminAuthError) {
          clearSession();
          return;
        }
        setManufacturers([]);
        setError(err instanceof Error ? err.message : 'Failed to load manufacturers.');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const updateItem = (id: number, patch: Partial<Omit<ItemRow, 'id'>>) =>
    setItems((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const addItem = () =>
    setItems((rows) => [...rows, { id: nextItemId.current++, product: '', quantity: '', unitPrice: '', manufacturerUnitPrice: '' }]);
  const removeItem = (id: number) => setItems((rows) => rows.filter((row) => row.id !== id));

  const chosenProducts = new Set(items.map((row) => row.product).filter(Boolean));
  const orderTotal = totalOf(items, 'unitPrice');
  const manufacturerTotal = totalOf(items, 'manufacturerUnitPrice');
  const balanceDue = Math.round((orderTotal - (Number(amountReceived) || 0)) * 100) / 100;
  const manufacturerBalanceDue = Math.round((manufacturerTotal - (Number(amountPaidToManufacturer) || 0)) * 100) / 100;
  const selectedManufacturer = manufacturers?.find((m) => m.id === manufacturerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manufacturerId) {
      setError('Select a manufacturer.');
      return;
    }
    if (balanceDue < 0) {
      setError('Amount received cannot be more than the order total.');
      return;
    }
    if (manufacturerBalanceDue < 0) {
      setError('Amount paid to manufacturer cannot be more than the manufacturer total.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const order = await convertRfqToOrder(token, rfq.id, {
        manufacturerId,
        shippingAddress: shippingAddress.trim(),
        items: items.map((row) => ({
          product: row.product,
          quantity: Number(row.quantity),
          unitPrice: Number(row.unitPrice),
          manufacturerUnitPrice: Number(row.manufacturerUnitPrice),
        })),
        amountReceived: Number(amountReceived),
        amountPaidToManufacturer: Number(amountPaidToManufacturer),
      });
      onConverted(order);
    } catch (err) {
      if (err instanceof AdminAuthError) {
        clearSession();
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to convert RFQ to order.');
      setSaving(false);
    }
  };

  return (
    <Dialog
      title={`Convert ${rfq.rfqNumber} to Order`}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={<DialogFooter saving={saving} submitLabel="Create Order" onCancel={onClose} />}
      className="max-w-5xl"
    >
      <div className="space-y-6 px-6 py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-zinc-50 px-4 py-3 text-sm">
          <p>
            <span className="font-medium text-zinc-900">{rfq.brandName}</span>
            <span className="text-zinc-500"> · {rfq.name}</span>
          </p>
          <p className="text-zinc-500">{rfq.location}</p>
        </div>

        <section>
          <div className="mb-2 flex items-end justify-between">
            <h3 className="text-sm font-medium text-zinc-700">Products</h3>
            <p className="text-xs text-zinc-400">Pre-filled from the RFQ. Prices are per unit in INR.</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/60 text-xs font-medium text-zinc-500">
                  <th className="px-3 py-2.5">Product</th>
                  <th className="w-28 px-3 py-2.5">Quantity</th>
                  <th className="w-32 px-3 py-2.5">Customer price</th>
                  <th className="w-32 px-3 py-2.5">Manufacturer price</th>
                  <th className="w-36 px-3 py-2.5 text-right">Line total</th>
                  <th className="w-12 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.map((row, index) => {
                  const lineTotal = totalOf([row], 'unitPrice');
                  const manufacturerLineTotal = totalOf([row], 'manufacturerUnitPrice');
                  return (
                    <tr key={row.id}>
                      <td className="px-3 py-2">
                        <select
                          aria-label={`Product ${index + 1}`}
                          required
                          value={row.product}
                          onChange={(e) => updateItem(row.id, { product: e.target.value })}
                          className={inputCls}
                        >
                          <option value="" disabled>
                            Select a product
                          </option>
                          {RFQ_PRODUCTS.filter((product) => product === row.product || !chosenProducts.has(product)).map((product) => (
                            <option key={product} value={product}>
                              {product}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          aria-label={`Quantity for product ${index + 1}`}
                          type="number"
                          required
                          min={RFQ_MIN_QUANTITY}
                          step={1}
                          inputMode="numeric"
                          value={row.quantity}
                          onChange={(e) => updateItem(row.id, { quantity: e.target.value })}
                          placeholder={`Min ${RFQ_MIN_QUANTITY}`}
                          className={numberInputCls}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          aria-label={`Customer unit price for product ${index + 1}`}
                          type="number"
                          required
                          min={0.01}
                          step={0.01}
                          inputMode="decimal"
                          value={row.unitPrice}
                          onChange={(e) => updateItem(row.id, { unitPrice: e.target.value })}
                          placeholder="0.00"
                          className={numberInputCls}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          aria-label={`Manufacturer unit price for product ${index + 1}`}
                          type="number"
                          required
                          min={0.01}
                          step={0.01}
                          inputMode="decimal"
                          value={row.manufacturerUnitPrice}
                          onChange={(e) => updateItem(row.id, { manufacturerUnitPrice: e.target.value })}
                          placeholder="0.00"
                          className={numberInputCls}
                        />
                      </td>
                      <td className="admin-mono whitespace-nowrap px-3 py-2 text-right">
                        <p className="text-zinc-900">{lineTotal ? formatInr(lineTotal) : <span className="text-zinc-300">—</span>}</p>
                        {manufacturerLineTotal > 0 && (
                          <p className="text-xs text-zinc-400" title="Manufacturer line total">
                            Mfr {formatInr(manufacturerLineTotal)}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(row.id)}
                          disabled={items.length === 1}
                          aria-label={`Remove product ${index + 1}`}
                          title="Remove"
                          className="grid h-8 w-8 place-items-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:invisible"
                        >
                          <Icon d={ICONS.trash} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-200 bg-zinc-50/60">
                  <td colSpan={4} className="px-3 py-2.5">
                    {items.length < RFQ_PRODUCTS.length && (
                      <button type="button" onClick={addItem} className={ghostButtonCls}>
                        <Icon d={ICONS.plus} />
                        Add product
                      </button>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <p>
                      <span className="mr-2 text-xs text-zinc-500">Order total</span>
                      <span className="admin-mono font-semibold text-zinc-900">{formatInr(orderTotal)}</span>
                    </p>
                    <p>
                      <span className="mr-2 text-xs text-zinc-500">Manufacturer total</span>
                      <span className="admin-mono text-zinc-700">{formatInr(manufacturerTotal)}</span>
                    </p>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
          <Field
            label="Manufacturer"
            htmlFor="order-manufacturer"
            hint={
              selectedManufacturer
                ? `Makes: ${selectedManufacturer.products.join(', ')}`
                : 'Only active garments manufacturers are listed.'
            }
          >
            {manufacturers && manufacturers.length === 0 && !error ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
                No active garments manufacturers.{' '}
                <Link href="/admin/manufacturers" className="font-medium underline underline-offset-2">
                  Add one first
                </Link>
                .
              </p>
            ) : (
              <select
                id="order-manufacturer"
                required
                value={manufacturerId}
                onChange={(e) => setManufacturerId(e.target.value)}
                disabled={!manufacturers}
                className={`${inputCls} disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400`}
              >
                <option value="" disabled>
                  {manufacturers ? 'Select a manufacturer' : 'Loading manufacturers…'}
                </option>
                {manufacturers?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.companyName} · {m.location}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Shipping address" htmlFor="order-address">
            <textarea
              id="order-address"
              required
              rows={4}
              maxLength={500}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder={`Full delivery address for ${rfq.brandName}`}
              className={`${inputCls} min-h-24 resize-none py-2`}
            />
          </Field>
        </div>

        <section>
          <h3 className="mb-2 text-sm font-medium text-zinc-700">Payment</h3>
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2">
            <MoneyInput
              id="order-amount-received"
              label="Amount Received (₹)"
              value={amountReceived}
              onChange={setAmountReceived}
              min={0.01}
              hint="An order needs a payment from the customer."
            />
            <Balance label="Balance Due" amount={balanceDue} />
            <MoneyInput
              id="order-amount-paid-to-manufacturer"
              label="Amount Paid to Manufacturer (₹)"
              value={amountPaidToManufacturer}
              onChange={setAmountPaidToManufacturer}
              min={0}
              hint="Enter 0 if nothing has been paid yet."
            />
            <Balance label="Due to Manufacturer" amount={manufacturerBalanceDue} />
          </div>
        </section>

        <p className="text-xs text-zinc-500">
          Converting marks this RFQ as <span className="font-medium text-zinc-700">Won</span>. Products, prices and the manufacturer
          cannot be changed once the order is created.
        </p>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/15">{error}</p>}
      </div>
    </Dialog>
  );
}
