import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <Navbar />
      <main className="pt-20 pb-16">
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg md:p-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#22a2f2]">
              Legal
            </p>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Privacy Policy</h1>

            <div className="mt-6 space-y-6 text-base leading-7 text-gray-700">
              <p>
                Grupo.in ("Grupo", "we", "our", or "us") is an AI-powered B2B manufacturing operating system connecting
                apparel brands with verified Indian factories worldwide. This Privacy Policy explains how we collect,
                use, disclose, and safeguard your information when you use our platform, website (grupo.in), mobile
                applications, and related services (collectively, the "Platform").
              </p>
              <p>
                By accessing or using the Platform, you agree to this Privacy Policy. If you do not agree, please
                discontinue use immediately.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">1. Information We Collect</h2>
              <p>We collect the following categories of information:</p>
              <h3 className="text-lg font-semibold text-gray-900">1.1 Information You Provide Directly</h3>
              <ul className="list-disc space-y-2 pl-6">
                <li>Account registration details: name, email address, phone number, and company/brand name.</li>
                <li>
                  Business information: company size, product categories, target markets, order volumes, and sourcing
                  requirements.
                </li>
                <li>
                  Factory partner information: factory name, location, certifications, production capacity, and
                  compliance documentation.
                </li>
                <li>Order and transaction data: specifications, quantities, pricing, timelines, and communication history.</li>
                <li>Payment and invoicing information (processed through secure third-party payment providers).</li>
                <li>Communications you send us, including support tickets, feedback, and correspondence.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900">1.2 Information Collected Automatically</h3>
              <ul className="list-disc space-y-2 pl-6">
                <li>Device and browser information: IP address, browser type, operating system, and device identifiers.</li>
                <li>Usage data: pages visited, features used, time spent, click patterns, and navigation paths.</li>
                <li>Cookies and similar tracking technologies to enhance experience and analyze platform performance.</li>
                <li>Log data generated when you use the Platform.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900">1.3 Information from Third Parties</h3>
              <ul className="list-disc space-y-2 pl-6">
                <li>Business verification data from public registries and third-party due diligence services.</li>
                <li>Information from business partners, referrals, or linked accounts (e.g., LinkedIn).</li>
                <li>Analytics providers and advertising networks, as applicable.</li>
              </ul>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">2. How We Use Your Information</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>Provide, operate, and improve the Grupo Platform and AI-powered matching features.</li>
                <li>Connect brands with suitable verified Indian factory partners.</li>
                <li>Send transactional communications, service announcements, and updates.</li>
                <li>Verify identity and legitimacy of brands and factory partners.</li>
                <li>Analyze usage and improve recommendation and matching algorithms.</li>
                <li>Detect, prevent, and address fraud, security incidents, and harmful activity.</li>
                <li>Comply with legal obligations, including Indian tax and export/import laws.</li>
                <li>Resolve disputes and enforce Terms and Conditions.</li>
              </ul>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">3. Information Sharing and Disclosure</h2>
              <p>We do not sell your personal data. We may share information in the following circumstances:</p>
              <h3 className="text-lg font-semibold text-gray-900">3.1 With Platform Participants</h3>
              <p>
                To facilitate manufacturing relationships, we share relevant business information between brands and
                verified factory partners, including order specifications, contact details, and product requirements.
              </p>
              <h3 className="text-lg font-semibold text-gray-900">3.2 With Service Providers</h3>
              <p>
                We engage trusted third-party vendors for hosting, payment processing, email delivery, analytics,
                customer support, and fraud prevention under confidentiality obligations.
              </p>
              <h3 className="text-lg font-semibold text-gray-900">3.3 Legal and Regulatory Obligations</h3>
              <p>
                We may disclose information when required by law, court order, or government authority, including the
                Government of India, GSTN, and other regulatory bodies.
              </p>
              <h3 className="text-lg font-semibold text-gray-900">3.4 Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of Grupo, user information may be transferred as part of
                business assets, subject to equivalent privacy protections.
              </p>
              <h3 className="text-lg font-semibold text-gray-900">3.5 With Your Consent</h3>
              <p>We may share information for other purposes with your explicit consent.</p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">4. Data Retention</h2>
              <p>
                We retain personal information as needed to provide services, comply with legal obligations, resolve
                disputes, and enforce agreements. Account data may be retained for up to 5 years after closure per
                Indian accounting and tax regulations.
              </p>
              <p>
                Order and transaction records are retained for a minimum of 7 years as required under the Companies
                Act, 2013 and GST regulations.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">5. Data Security</h2>
              <p>We implement industry-standard measures, including:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>SSL/TLS encryption for data in transit.</li>
                <li>Encrypted storage of sensitive data at rest.</li>
                <li>Role-based access controls and audit logging.</li>
                <li>Regular security assessments and vulnerability testing.</li>
              </ul>
              <p>
                No method of transmission or storage is 100% secure. You are responsible for maintaining the
                confidentiality of your account credentials.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">6. Your Rights and Choices</h2>
              <p>
                Subject to applicable law, including the Digital Personal Data Protection Act, 2023 (India), you may
                have rights to:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Access your personal data.</li>
                <li>Correct inaccurate or incomplete data.</li>
                <li>Request deletion, subject to legal retention obligations.</li>
                <li>Object to certain processing, including direct marketing.</li>
                <li>Request data portability in a structured, machine-readable format.</li>
                <li>Nominate a person to exercise your rights in case of death or incapacity.</li>
              </ul>
              <p>To exercise rights, contact privacy@grupo.in. We respond within 30 days.</p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">7. Cookies Policy</h2>
              <p>
                Grupo uses cookies and similar technologies to enhance functionality, remember preferences, and analyze
                platform performance. Disabling some cookies may affect functionality.
              </p>
              <p>We use:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Strictly necessary cookies.</li>
                <li>Performance cookies.</li>
                <li>Functional cookies.</li>
                <li>Analytics cookies (e.g., Google Analytics).</li>
              </ul>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">8. International Data Transfers</h2>
              <p>
                Grupo is headquartered in India and primarily processes data within India. If data is transferred
                internationally, we apply safeguards consistent with applicable Indian data protection law.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">9. Children&apos;s Privacy</h2>
              <p>
                The Platform is intended solely for business users aged 18 and above. We do not knowingly collect
                personal information from minors.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">10. Changes to This Privacy Policy</h2>
              <p>
                We may update this policy from time to time and notify registered users of material changes by email or
                prominent platform notice. Continued use after notice means acceptance of updates.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">11. Contact Us</h2>
              <p>For privacy-related inquiries or to exercise data rights, contact:</p>
              <p>
                Grupo.in
                <br />
                Email: contact@grupo.in
                <br />
                Website: www.grupo.in
                <br />
                Registered in India.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
