import type { Metadata } from 'next';
import RfqList from './RfqList';

export const metadata: Metadata = {
  title: 'RFQs | Grupo Admin',
  robots: { index: false, follow: false },
};

export default function RfqsPage() {
  return <RfqList />;
}
