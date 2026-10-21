import type { Metadata } from 'next';
import AnalyticsDashboard from './AnalyticsDashboard';

export const metadata: Metadata = {
  title: 'Analytics | Grupo Admin',
  robots: { index: false, follow: false },
};

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
