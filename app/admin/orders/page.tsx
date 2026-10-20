import type { Metadata } from 'next';
import OrderList from './OrderList';

export const metadata: Metadata = {
  title: 'Orders | Grupo Admin',
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return <OrderList />;
}
