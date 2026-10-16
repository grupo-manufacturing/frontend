import { Geist, Geist_Mono } from 'next/font/google';
import AdminShell from './AdminShell';

const geist = Geist({ variable: '--font-admin-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-admin-mono', subsets: ['latin'] });

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${geist.variable} ${geistMono.variable} admin-root`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
