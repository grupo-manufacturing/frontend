import type { Metadata } from 'next';
import OrderList from './OrderList';

export const metadata: Metadata = {
  title: 'Orders | Grupo Manufacturer Portal',
  robots: { index: false, follow: false },
};

export default function ManufacturerOrdersPage() {
  return <OrderList />;
}
