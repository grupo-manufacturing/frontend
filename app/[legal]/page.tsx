import type { ComponentType } from 'react';
import { notFound } from 'next/navigation';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import PrivacyPolicy from './privacy-policy';
import RefundPolicy from './refund-policy';
import TermsAndConditions from './terms-and-conditions';

type LegalPage = {
  title: string;
  lastUpdated?: string;
  Content: ComponentType;
};

const LEGAL_PAGES: Record<string, LegalPage> = {
  'privacy-policy': { title: 'Privacy Policy', lastUpdated: '14 October 2026', Content: PrivacyPolicy },
  'refund-policy': { title: 'Refund Policy', Content: RefundPolicy },
  'terms-and-conditions': { title: 'Terms & Conditions', lastUpdated: '14 October 2026', Content: TermsAndConditions },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(LEGAL_PAGES).map((legal) => ({ legal }));
}

export default async function LegalPage({ params }: { params: Promise<{ legal: string }> }) {
  const { legal } = await params;
  const page = LEGAL_PAGES[legal];
  if (!page) notFound();

  const { title, lastUpdated, Content } = page;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <Navbar />
      <main className="pt-20 pb-16">
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg md:p-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#1C8FD7]">
              Legal
            </p>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{title}</h1>
            {lastUpdated && <p className="mt-2 text-sm text-gray-500">Last updated: {lastUpdated}</p>}
            <div className="mt-6 space-y-6 text-base leading-7 text-gray-700">
              <Content />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
