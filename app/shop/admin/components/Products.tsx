'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import type { ShopProduct, BulkPricingTier, CreateProductPayload } from '../../lib/types';
import { createProduct, updateProduct, deleteProduct, uploadImage, getProductOptions, type ProductOptions } from '../../lib/api';

interface ProductsProps {
  products: ShopProduct[];
  onReload: () => void;
}

const PER_PAGE = 8;

const DEFAULT_TIERS: BulkPricingTier[] = [
  { label: 'Standard', range: '10-50 units', unitPrice: 0 },
  { label: 'Silver', range: '50-200 units', unitPrice: 0 },
  { label: 'Gold', range: '200-500 units', unitPrice: 0 },
  { label: 'Diamond', range: '500+ units', unitPrice: 0, isRFQ: true },
];

export default function Products({ products, onReload }: ProductsProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [options, setOptions] = useState<ProductOptions | null>(null);

  useEffect(() => {
    getProductOptions().then(setOptions).catch(() => setOptions(null));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openCreate = () => { setEditingProduct(null); setShowForm(true); setActionError(''); };
  const openEdit = (p: ShopProduct) => { setEditingProduct(p); setShowForm(true); setActionError(''); };
  const closeForm = () => { setShowForm(false); setEditingProduct(null); };

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      return;
    }
    try {
      setActionError('');
      await deleteProduct(id);
      setDeletingId(null);
      onReload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-72 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30"
        />
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[#22a2f2] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b8bd0]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Product
        </button>
      </div>

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">{actionError}</div>
      )}

      {/* ── Product Table ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Starting Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
                    {search ? 'No products match your search.' : 'No products yet. Add your first product!'}
                  </td>
                </tr>
              ) : (
                paginated.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{product.name}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[200px]">{product.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">
                      ₹{product.bulkPricing[0]?.unitPrice?.toLocaleString('en-IN') ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${
                        product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                            deletingId === product.id
                              ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-red-300 hover:text-red-600'
                          }`}
                        >
                          {deletingId === product.id ? 'Confirm?' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">{filtered.length} products</p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                    page === p ? 'bg-[#22a2f2] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Product Form Modal ───────────────────────────────────────── */}
      {showForm && options && (
        <ProductFormModal
          product={editingProduct}
          options={options}
          onClose={closeForm}
          onSaved={() => { closeForm(); onReload(); }}
        />
      )}
    </div>
  );
}

/* ── Product Form Modal ──────────────────────────────────────────────── */

function ProductFormModal({
  product,
  options,
  onClose,
  onSaved,
}: {
  product: ShopProduct | null;
  options: ProductOptions;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = !!product;

  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [selectedColors, setSelectedColors] = useState<string[]>(product?.colors ?? []);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(product?.sizes ?? []);
  const [inStock, setInStock] = useState(product?.inStock ?? true);
  const [tiers, setTiers] = useState<BulkPricingTier[]>(
    product?.bulkPricing?.length ? product.bulkPricing : DEFAULT_TIERS
  );

  // Image state: URL strings (either pre-existing or freshly uploaded)
  const [mainImage, setMainImage] = useState(product?.image ?? '');
  const [additionalImages, setAdditionalImages] = useState<string[]>(
    product?.images?.filter((u) => u !== product?.image) ?? []
  );
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateTierPrice = (index: number, value: string) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], unitPrice: Number(value) || 0 };
    setTiers(updated);
  };

  /* ── Upload helpers ──────────────────────────────────────────────── */
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    setError('');
    try {
      const url = await uploadImage(file);
      setMainImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploadingMain(false);
      e.target.value = '';
    }
  };

  const handleAdditionalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingExtra(true);
    setError('');
    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i]);
        uploaded.push(url);
      }
      setAdditionalImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploadingExtra(false);
      e.target.value = '';
    }
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── Submit ──────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainImage) { setError('Please upload a main image.'); return; }
    if (!category) { setError('Please select a category.'); return; }
    setSaving(true);
    setError('');

    const allImages = [mainImage, ...additionalImages];
    const colors = selectedColors;
    const sizes = selectedSizes;

    const payload: CreateProductPayload = {
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      image: mainImage,
      images: allImages,
      colors,
      sizes,
      bulk_pricing: tiers,
      in_stock: inStock,
    };

    try {
      if (isEditing && product) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-16 pb-16">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Name + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Product Name" required>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Premium Cotton T-Shirt" className={inputCls} />
            </FormField>
            <FormField label="Category" required>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
              >
                <option value="">Select category…</option>
                {options.categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Description */}
          <FormField label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Product description…" rows={2} className={`${inputCls} resize-none`} />
          </FormField>

          {/* ── Main Image Upload ──────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Main Image<span className="text-red-400 ml-0.5">*</span>
            </label>

            {mainImage ? (
              <div className="relative inline-block group">
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50">
                  <Image src={mainImage} alt="Main" fill className="object-cover" sizes="128px" />
                </div>
                <button
                  type="button"
                  onClick={() => setMainImage('')}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition ${
                uploadingMain ? 'border-[#22a2f2] bg-[#22a2f2]/5' : 'border-slate-300 hover:border-[#22a2f2] hover:bg-slate-50'
              }`}>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleMainImageUpload} disabled={uploadingMain} />
                {uploadingMain ? (
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-6 h-6 animate-spin text-[#22a2f2]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-xs text-[#22a2f2] font-medium">Uploading…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-xs text-slate-500">Click to upload main image</span>
                    <span className="text-[10px] text-slate-400">JPEG, PNG, or WebP (max 10MB)</span>
                  </div>
                )}
              </label>
            )}
          </div>

          {/* ── Additional Images Upload ───────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Additional Images
              <span className="text-xs font-normal text-slate-400 ml-1.5">(optional)</span>
            </label>

            <div className="flex flex-wrap gap-3">
              {additionalImages.map((url, i) => (
                <div key={i} className="relative group">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    <Image src={url} alt={`Extra ${i + 1}`} fill className="object-cover" sizes="80px" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAdditionalImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] shadow-md hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Upload more button */}
              <label className={`flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed rounded-lg cursor-pointer transition ${
                uploadingExtra ? 'border-[#22a2f2] bg-[#22a2f2]/5' : 'border-slate-300 hover:border-[#22a2f2] hover:bg-slate-50'
              }`}>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={handleAdditionalUpload} disabled={uploadingExtra} />
                {uploadingExtra ? (
                  <svg className="w-5 h-5 animate-spin text-[#22a2f2]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )}
              </label>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Colors
              {selectedColors.length > 0 && <span className="text-xs font-normal text-slate-400 ml-1.5">({selectedColors.length} selected)</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {options.colors.map((color) => {
                const active = selectedColors.includes(color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColors((prev) => active ? prev.filter((c) => c !== color) : [...prev, color])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      active
                        ? 'border-[#22a2f2] bg-[#22a2f2]/10 text-[#22a2f2]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Sizes
              {selectedSizes.length > 0 && <span className="text-xs font-normal text-slate-400 ml-1.5">({selectedSizes.length} selected)</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {options.sizes.map((size) => {
                const active = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSizes((prev) => active ? prev.filter((s) => s !== size) : [...prev, size])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      active
                        ? 'border-[#22a2f2] bg-[#22a2f2]/10 text-[#22a2f2]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bulk Pricing Tiers */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Bulk Pricing Tiers</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {tiers.map((tier, i) => (
                <div key={tier.label} className="rounded-lg border border-slate-200 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-600">{tier.label}</p>
                  <p className="text-[10px] text-slate-400">{tier.range}</p>
                  {tier.isRFQ ? (
                    <p className="text-xs font-medium text-amber-600">RFQ</p>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={tier.unitPrice || ''}
                      onChange={(e) => updateTierPrice(i, e.target.value)}
                      placeholder="₹ price"
                      className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:border-[#22a2f2] focus:outline-none focus:ring-1 focus:ring-[#22a2f2]/30"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* In Stock Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setInStock(!inStock)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                inStock ? 'bg-[#22a2f2]' : 'bg-slate-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                inStock ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <span className="text-sm text-slate-700">{inStock ? 'In Stock' : 'Out of Stock'}</span>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={(e) => { e.preventDefault(); document.querySelector<HTMLFormElement>('form')?.requestSubmit(); }}
            disabled={saving || uploadingMain || uploadingExtra}
            className="inline-flex items-center gap-2 rounded-lg bg-[#22a2f2] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b8bd0] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : (
              isEditing ? 'Update Product' : 'Create Product'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Shared helpers ──────────────────────────────────────────────────── */

const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#22a2f2] focus:outline-none focus:ring-2 focus:ring-[#22a2f2]/30';

function FormField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="text-xs font-normal text-slate-400 ml-1.5">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
