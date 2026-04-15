import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <Navbar />
      <main className="pt-20 pb-16">
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg md:p-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#22a2f2]">
              Legal
            </p>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Terms & Conditions</h1>

            <div className="mt-6 space-y-6 text-base leading-7 text-gray-700">
              <p>
                These Terms and Conditions ("Terms") govern your access to and use of the Grupo.in platform
                ("Platform"), operated by Grupo.in ("Grupo", "we", "us"). By registering for or using the Platform,
                you agree to be bound by these Terms. If you do not agree, do not use the Platform.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">1. About Grupo</h2>
              <p>
                Grupo is an AI-powered B2B manufacturing operating system for the global apparel industry. The Platform
                enables clothing brands ("Brands") to connect with verified Indian garment factories ("Factory
                Partners") to source, manage, and fulfill manufacturing orders.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">2. Eligibility and Registration</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>You must be at least 18 years old and have legal authority to bind your business entity.</li>
                <li>You agree to provide accurate and complete registration information and keep it updated.</li>
                <li>You are responsible for all activity under your account and must report unauthorized access.</li>
                <li>
                  Grupo may verify the identity and legitimacy of Brands or Factory Partners and may refuse or revoke
                  access at its sole discretion.
                </li>
              </ul>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">3. Platform Services</h2>
              <h3 className="text-lg font-semibold text-gray-900">3.1 For Brands</h3>
              <ul className="list-disc space-y-2 pl-6">
                <li>Submit sourcing requirements and receive AI-powered factory recommendations.</li>
                <li>Browse verified factory profiles, certifications, and production capabilities.</li>
                <li>Manage orders end-to-end, including specifications, sampling, tracking, and quality assurance.</li>
                <li>Access communication logs, order management tools, and invoice tracking.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900">3.2 For Factory Partners</h3>
              <ul className="list-disc space-y-2 pl-6">
                <li>Create and maintain a verified business profile.</li>
                <li>Receive qualified order leads matched by Grupo&apos;s AI system.</li>
                <li>Manage timelines, sample approvals, and delivery confirmations.</li>
                <li>Access payment records and commission deduction statements.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900">3.3 AI-Powered Features</h3>
              <p>
                Grupo&apos;s Platform uses artificial intelligence for matching, order management, and analytics. While we
                strive for accuracy, AI recommendations are informational and do not guarantee business outcomes.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">4. Commissions and Payments</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>Payment terms and invoicing schedules are communicated at order confirmation.</li>                <li>In disputed transactions, Grupo may withhold payment pending resolution.</li>
              </ul>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">5. Verified Factory Partners</h2>
              <p>
                Grupo performs due diligence to onboard Factory Partners, including verification of registration,
                manufacturing capability, and certifications.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">6. User Obligations</h2>
              <p>All users agree to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Use the Platform lawfully and in compliance with applicable Indian and international laws.</li>
                <li>
                  If a user chooses to transact directly with a manufacturer, Grupo shall not be held liable for any payments, damages, or losses arising from such transactions.
                </li>
                <li>Maintain confidentiality of commercially sensitive information.</li>
                <li>Not submit false, misleading, or fraudulent information.</li>
                <li>Not use bots, scrapers, or automated extraction tools without written consent.</li>
                <li>Not disrupt, damage, or impair the Platform or infrastructure.</li>
                <li>Comply with applicable export control laws for international markets.</li>
              </ul>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">7. Intellectual Property</h2>
              <p>
                All intellectual property on the Platform, including software, AI models, algorithms, branding, content,
                and data compilations, is owned by or licensed to Grupo. You receive a limited, non-exclusive,
                non-transferable license for intended business use.
              </p>
              <p>
                You may not copy, reverse-engineer, adapt, or create derivative works without written consent. You
                retain ownership of submitted content but grant Grupo a license to use it to provide and improve services.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">8. Confidentiality</h2>
              <p>
                Parties may access commercially sensitive information (pricing, production methods, supplier
                relationships, and order data) and agree to keep it confidential, except where disclosure is required by
                law.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">9. Disclaimer of Warranties</h2>
              <p>
                The Platform is provided "as is" and "as available." To the maximum extent permitted by law, Grupo
                disclaims all warranties, express or implied, including merchantability, fitness for a particular
                purpose, and non-infringement.
              </p>
              <p>
                Grupo does not warrant uninterrupted, error-free operation or that the Platform is free of viruses or
                harmful components.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">10. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted under Indian law, Grupo&apos;s total aggregate liability for claims related
                to these Terms or the Platform is limited to commissions paid by the relevant user to Grupo in the
                15-days period preceding the claim event.
              </p>
              <p>
                Grupo is not liable for indirect, incidental, special, consequential, or punitive damages, including
                loss of profits, data loss, or business interruption.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">11. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Grupo and its directors, officers, employees, and agents from
                claims, liabilities, costs, and expenses (including legal fees) arising from your use of the Platform,
                violation of these Terms, infringement of third-party rights, or goods manufactured through Platform
                orders.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">12. Termination</h2>
              <p>
                Grupo may suspend or terminate
                immediately in cases of fraud, material breach, circumvention, or harmful conduct.
              </p>
              <p>
                Upon termination, outstanding commissions become immediately payable. Confidentiality, intellectual
                property, and dispute resolution obligations survive termination.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">13. Dispute Resolution</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>First, good-faith negotiation within 30 days of notice.</li>
                <li>In the event of any dispute between a customer and a manufacturer, Grupo will facilitate discussions between both parties and provide a final resolution.</li>
                <li>If unresolved, mediation through a mutually agreed mediator.</li>
                <li>
                  If mediation fails, binding arbitration under the Arbitration and Conciliation Act, 1996 (India), in
                  Bengaluru, Karnataka.
                </li>
                <li>Either party may seek urgent injunctive relief from a competent court to prevent irreparable harm.</li>
              </ul>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">14. Governing Law and Jurisdiction</h2>
              <p>
                These Terms are governed by the laws of India. Subject to the arbitration clause, courts in Bengaluru,
                Karnataka, India have exclusive jurisdiction.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">15. Modifications to Terms</h2>
              <p>
                Grupo may modify these Terms at any time and will provide at least 15 days&apos; notice of material changes
                via email or platform notice. Continued use after effective date means acceptance of revised Terms.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">16. Contact Information</h2>
              <p>
                Grupo.in
                <br />
                Email: contact@grupo.in
                <br />
                Website: www.grupo.in
                <br />
                Registered in India
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
