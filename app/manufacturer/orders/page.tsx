import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orders | Grupo Manufacturer Portal',
  robots: { index: false, follow: false },
};

export default function ManufacturerOrdersPage() {
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Orders</h1>
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-16 text-center shadow-sm">
        <p className="font-medium text-zinc-900">Your orders will appear here</p>
        <p className="mt-1 text-sm text-zinc-500">Orders Grupo assigns to you will be listed on this page.</p>
      </div>
    </main>
  );
}
