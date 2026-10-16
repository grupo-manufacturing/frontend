import { Geist, Geist_Mono } from 'next/font/google';

const geist = Geist({ variable: '--font-admin-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-admin-mono', subsets: ['latin'] });

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${geist.variable} ${geistMono.variable} admin-root`}>{children}</div>;
}
