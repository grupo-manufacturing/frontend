'use client';

import { useState } from 'react';
import type { ShipmentInput } from '../api';
import { Dialog, DialogFooter, Field, inputCls } from '../ui';

/** Asks for the courier and tracking ID before an order is marked shipped. onSubmit throws to show an error. */
export default function ShipmentDialog({
  orderNumber,
  onClose,
  onSubmit,
}: {
  orderNumber: string;
  onClose: () => void;
  onSubmit: (shipment: ShipmentInput) => Promise<void>;
}) {
  const [courierCompany, setCourierCompany] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        courierCompany: courierCompany.trim(),
        trackingId: trackingId.trim(),
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark the order as shipped.');
      setSaving(false);
    }
  };

  return (
    <Dialog
      title={`Mark as Shipped · ${orderNumber}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={<DialogFooter saving={saving} submitLabel="Mark as Shipped" onCancel={onClose} />}
      className="max-w-lg"
    >
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 px-6 py-5 sm:grid-cols-2">
        <Field label="Courier company" htmlFor="ship-courier">
          <input
            id="ship-courier"
            required
            autoFocus
            maxLength={100}
            value={courierCompany}
            onChange={(e) => setCourierCompany(e.target.value)}
            placeholder="Delhivery"
            className={inputCls}
          />
        </Field>
        <Field label="Tracking ID" htmlFor="ship-tracking">
          <input
            id="ship-tracking"
            required
            maxLength={100}
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="AWB1234567890"
            autoComplete="off"
            spellCheck={false}
            className={`${inputCls} admin-mono`}
          />
        </Field>
        <Field label="Notes" htmlFor="ship-notes" hint="Optional, e.g. number of boxes or expected delivery." className="sm:col-span-2">
          <textarea
            id="ship-notes"
            rows={3}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Shipped in 4 cartons"
            className={`${inputCls} min-h-20 resize-none py-2`}
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/15 sm:col-span-2">{error}</p>
        )}
      </div>
    </Dialog>
  );
}
