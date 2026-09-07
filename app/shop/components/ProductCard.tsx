'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShopProduct } from '../lib/types';

interface ProductCardProps {
  product: ShopProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const startingPrice = product.bulkPricing[0]?.unitPrice;

  return (
    <article className="group relative flex flex-col overflow-hidden border border-brand/10 bg-surface transition-all duration-500 hover:border-brand/35">
      <Link
        href={`/shop/${product.id}`}
        className="relative aspect-[4/5] overflow-hidden bg-brand/5 block"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80"
          aria-hidden
        />
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <span className="font-nav border border-surface/40 bg-black/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-surface backdrop-blur-sm">
              Out of Stock
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <p className="font-nav text-[10px] uppercase tracking-[0.18em] text-[#1C8FD7]">
            {product.category}
          </p>
          <h3 className="font-heading mt-1 text-base font-semibold uppercase tracking-[-0.01em] text-surface sm:text-lg">
            {product.name}
          </h3>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 border-t border-brand/10 p-4 sm:p-5">
        <p className="font-body text-sm text-foreground/55">
          From{' '}
          <span className="font-semibold text-foreground">₹{startingPrice}</span>
          <span className="text-foreground/40">/unit</span>
        </p>

        <div className="mt-auto">
          {product.inStock ? (
            <Link
              href={`/shop/${product.id}`}
              className="font-nav inline-flex w-full items-center justify-center bg-[#1C8FD7] px-3 py-2.5 text-[10px] uppercase tracking-[0.14em] text-[#0b1220] transition-colors duration-200 hover:bg-[#1678B5] hover:text-surface sm:text-[11px]"
            >
              View Product →
            </Link>
          ) : (
            <button
              disabled
              className="font-nav inline-flex w-full cursor-not-allowed items-center justify-center border border-foreground/10 px-3 py-2.5 text-[10px] uppercase tracking-[0.14em] text-foreground/35 sm:text-[11px]"
            >
              Unavailable
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
