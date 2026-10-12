import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <Navbar />
      <main className="pt-20 pb-16">
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg md:p-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#1C8FD7]">
              Legal
            </p>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Privacy Policy</h1>
            <p className="mt-2 text-sm text-gray-500">Last updated: 12 October 2026</p>

            <div className="mt-6 space-y-6 text-base leading-7 text-gray-700">
              <p>
                Grupo.in (&ldquo;Grupo&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is an apparel
                manufacturing and export company based in India. This Privacy Policy explains what personal information
                we collect when you use our website grupo.in (&ldquo;Website&rdquo;), place an order in our Wholesale
                Shop, or request a quotation, and how we use and protect it.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">1. Information We Collect</h2>

              <h3 className="text-lg font-semibold text-gray-900">1.1 Wholesale Shop Orders</h3>
              <p>When you place an order, we collect:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Your full name, email address, phone number, and company name (optional).</li>
                <li>Your shipping address, city, state, and pincode.</li>
                <li>Order details: products, colours, sizes, quantities, pricing tier, and amounts.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900">1.2 Payments</h3>
              <p>
                Payments are processed by Razorpay. We receive the payment status and transaction reference numbers.
                We do not receive or store your card, UPI, or bank account details; these are handled by Razorpay under
                its own privacy policy.
              </p>

              <h3 className="text-lg font-semibold text-gray-900">1.3 Quotation Requests</h3>
              <p>
                Requests for Quotation are submitted through a Google Form. We collect the information you choose to
                provide, such as your name, contact details, brand or company, target market, product requirements,
                quantities, and any reference images or tech packs. Google processes form submissions on our behalf
                under its own privacy policy.
              </p>

              <h3 className="text-lg font-semibold text-gray-900">1.4 Communications</h3>
              <p>
                If you contact us by email, phone, WhatsApp, or Instagram, we keep a record of the conversation and the
                details you share so we can respond and manage your order.
              </p>

              <h3 className="text-lg font-semibold text-gray-900">1.5 Technical Information</h3>
              <p>
                Our hosting providers automatically record standard technical data when you visit the Website, such as
                IP address, browser type, device information, and pages requested. We use this only to operate, secure,
                and troubleshoot the Website.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">2. How We Use Your Information</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>To process, produce, ship, and deliver your orders.</li>
                <li>To verify payments and prevent fraudulent orders.</li>
                <li>To respond to quotation requests and manage custom manufacturing projects.</li>
                <li>To send order confirmations, status updates, and service messages.</li>
                <li>To provide customer support and resolve disputes.</li>
                <li>To meet legal, tax, accounting, and export obligations.</li>
                <li>To keep the Website secure and working properly.</li>
              </ul>
              <p>
                We do not sell your personal information. We will only send you marketing messages if you have agreed
                to receive them, and you can opt out at any time.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">3. Order Tracking</h2>
              <p>
                Anyone with an order number can look up that order on the Track Order page. To protect your privacy, the
                tracking page shows only the order status, product, colours, sizes, quantities, pricing, order dates,
                and delivery city and state &mdash; not your name, email, phone number, or full address. Please share your order number only with
                people you trust.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">4. How We Share Information</h2>
              <p>We share personal information only as needed to run our business:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Manufacturing partners</strong> &mdash; order and product specifications needed to produce
                  your order.
                </li>
                <li>
                  <strong>Logistics and courier partners</strong> &mdash; your name, phone number, and delivery address
                  to ship your order.
                </li>
                <li>
                  <strong>Payment processor</strong> &mdash; Razorpay, to process and verify payments.
                </li>
                <li>
                  <strong>Service providers</strong> &mdash; website hosting, database, image hosting, and Google
                  Workspace, under confidentiality obligations.
                </li>
                <li>
                  <strong>Legal and regulatory authorities</strong> &mdash; when required by law, court order, or
                  government authority, including tax and customs authorities.
                </li>
                <li>
                  <strong>Business transfers</strong> &mdash; if Grupo is merged, acquired, or sold, subject to
                  equivalent privacy protections.
                </li>
              </ul>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">5. Cookies and Browser Storage</h2>
              <p>
                We do not use advertising or analytics cookies. The Website uses your browser&apos;s storage only to
                carry your selected colours, sizes, and quantities from the product page to checkout, and to keep
                authorised staff and partners signed in to the shop management pages. Razorpay and other embedded
                services may set their own cookies when you use them.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">6. Data Retention</h2>
              <p>
                We keep order and transaction records for as long as required under Indian tax and company laws,
                including the Companies Act, 2013 and GST regulations. Quotation requests and related correspondence are
                kept for as long as needed to respond to you and manage our business relationship, after which they are
                deleted or anonymised.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">7. Data Security</h2>
              <p>
                We use reasonable safeguards to protect your information, including encrypted (HTTPS) connections and
                restricted access to order data. No method of transmission or storage is completely secure, but we work
                to protect your information and will respond promptly to any security incident.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">8. Your Rights</h2>
              <p>
                Subject to applicable law, including the Digital Personal Data Protection Act, 2023 (India), and
                depending on where you are located, you may have the right to:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Access the personal data we hold about you.</li>
                <li>Correct inaccurate or incomplete data.</li>
                <li>Request deletion, subject to our legal record-keeping obligations.</li>
                <li>Withdraw consent or object to marketing messages.</li>
                <li>Nominate a person to exercise your rights in case of death or incapacity.</li>
              </ul>
              <p>To exercise these rights, contact privacy@grupo.in. We respond within 30 days.</p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">9. International Customers and Transfers</h2>
              <p>
                Grupo is based in India and serves customers internationally. Information you send us may be processed
                in India and by our service providers in other countries. We take reasonable steps to ensure it remains
                protected in line with this policy and applicable law.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">10. Children&apos;s Privacy</h2>
              <p>
                The Website is intended for business customers aged 18 and above. We do not knowingly collect personal
                information from minors.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. The updated version will be posted on this page
                with a new &ldquo;Last updated&rdquo; date.
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">12. Contact Us</h2>
              <p>For privacy questions or requests, contact:</p>
              <p>
                Grupo.in
                <br />
                Privacy: privacy@grupo.in
                <br />
                General: contact@grupo.in
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
