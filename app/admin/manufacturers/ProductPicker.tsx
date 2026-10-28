'use client';

import { RFQ_PRODUCTS } from '../../request-for-quotation/api';
import { Field, inputCls } from '../ui';

export type ProductSelection = { products: string[]; winnerProduct: string };

/** Product chips plus the winner product, which always stays one of the selected products. */
export default function ProductPicker({
  value,
  onChange,
  winnerHint,
}: {
  value: ProductSelection;
  onChange: (value: ProductSelection) => void;
  winnerHint: string;
}) {
  const { products, winnerProduct } = value;

  const toggle = (product: string) => {
    const next = products.includes(product) ? products.filter((p) => p !== product) : [...products, product];
    onChange({
      products: next,
      winnerProduct: next.includes(winnerProduct) ? winnerProduct : next.length === 1 ? next[0] : '',
    });
  };

  return (
    <>
      <Field label="Type of Products" hint={`${products.length} selected`} className="sm:col-span-2">
        <div className="flex flex-wrap gap-1.5">
          {RFQ_PRODUCTS.map((product) => {
            const selected = products.includes(product);
            return (
              <button
                key={product}
                type="button"
                onClick={() => toggle(product)}
                aria-pressed={selected}
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition ${
                  selected
                    ? 'bg-zinc-900 text-white ring-zinc-900'
                    : 'bg-white text-zinc-600 ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                {product}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Winner Product" htmlFor="winner-product" hint={winnerHint}>
        <select
          id="winner-product"
          required
          value={winnerProduct}
          onChange={(e) => onChange({ products, winnerProduct: e.target.value })}
          disabled={products.length === 0}
          className={`${inputCls} disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400`}
        >
          <option value="" disabled>
            {products.length === 0 ? 'Select products first' : 'Select winner product'}
          </option>
          {products.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}
