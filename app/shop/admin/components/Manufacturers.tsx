'use client';

import { useEffect, useState } from 'react';
import type { ShopManufacturer } from '../../lib/types';
import {
  createManufacturer,
  getManufacturers,
  updateManufacturer,
  deleteManufacturer,
} from '../../lib/api';

interface ManufacturersProps {
  onReload: () => void;
}

export default function Manufacturers({ onReload }: ManufacturersProps) {
  const [manufacturers, setManufacturers] = useState<ShopManufacturer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadManufacturers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getManufacturers();
      setManufacturers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load manufacturers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadManufacturers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !password.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await createManufacturer({ name: name.trim(), phone: phone.trim(), password: password.trim() });
      setName('');
      setPhone('');
      setPassword('');
      await loadManufacturers();
      onReload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create manufacturer');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (manufacturer: ShopManufacturer) => {
    setEditingId(manufacturer.id);
    setEditName(manufacturer.name);
    setEditPhone(manufacturer.phone);
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPhone('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim() || !editPhone.trim()) return;
    setActionLoadingId(id);
    setError('');
    try {
      await updateManufacturer(id, { name: editName.trim(), phone: editPhone.trim() });
      cancelEdit();
      await loadManufacturers();
      onReload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update manufacturer');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this manufacturer?');
    if (!confirmed) return;
    setActionLoadingId(id);
    setError('');
    try {
      await deleteManufacturer(id);
      if (editingId === id) cancelEdit();
      await loadManufacturers();
      onReload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete manufacturer');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Add Manufacturer</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Manufacturer name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
          />
          <input
            type="text"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
          />
          <input
            type="text"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
          />
          <button
            type="submit"
            disabled={submitting || !name.trim() || !phone.trim() || !password.trim()}
            className="rounded-lg bg-[#22a2f2] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b8bd0] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating…' : 'Create Manufacturer'}
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Manufacturers</h3>
        </div>
        {isLoading ? (
          <div className="px-5 py-10 text-sm text-slate-500">Loading manufacturers...</div>
        ) : manufacturers.length === 0 ? (
          <div className="px-5 py-10 text-sm text-slate-400">No manufacturers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Phone No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {manufacturers.map((m) => {
                  const isEditing = editingId === m.id;
                  const isBusy = actionLoadingId === m.id;
                  return (
                    <tr key={m.id}>
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
                          />
                        ) : (
                          <p className="text-sm font-medium text-slate-900">{m.name}</p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-between gap-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full max-w-[220px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
                            />
                          ) : (
                            <p className="text-sm text-slate-700">{m.phone}</p>
                          )}
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(m.id)}
                                  disabled={isBusy || !editName.trim() || !editPhone.trim()}
                                  className="rounded-lg bg-[#22a2f2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1b8bd0] disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {isBusy ? 'Saving…' : 'Save'}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  disabled={isBusy}
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(m)}
                                  disabled={actionLoadingId !== null}
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(m.id)}
                                  disabled={actionLoadingId !== null}
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {isBusy ? 'Deleting…' : 'Delete'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
