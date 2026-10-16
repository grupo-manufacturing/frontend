import type { Metadata } from 'next';
import ManufacturerList from './ManufacturerList';

export const metadata: Metadata = {
  title: 'Manufacturers | Grupo Admin',
  robots: { index: false, follow: false },
};

export default function ManufacturersPage() {
  return <ManufacturerList />;
}
