import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import ManufacturerShell from './ManufacturerShell';

const geist = Geist({ variable: '--font-admin-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-admin-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Manufacturer Portal | Grupo',
  robots: { index: false, follow: false },
};

export default function ManufacturerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${geist.variable} ${geistMono.variable} admin-root`}>
      <ManufacturerShell>{children}</ManufacturerShell>
    </div>
  );
}
