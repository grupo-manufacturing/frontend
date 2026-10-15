import Link from 'next/link';

export default function TermsAndConditions() {
  return (
    <>
      <p>
        These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of the website grupo.in
        (&ldquo;Website&rdquo;) and any purchase or manufacturing order placed with Grupo.in
        (&ldquo;Grupo&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By using the Website, placing an order, or
        submitting a quotation request, you agree to these Terms. If you do not agree, please do not use the
        Website.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">1. About Grupo</h2>
      <p>
        Grupo is an apparel manufacturing and export company based in India. We work with brands, wholesalers,
        and businesses (&ldquo;Customers&rdquo;, &ldquo;you&rdquo;) in two ways:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>Wholesale Shop</strong> &mdash; ready-to-order products sold in bulk quantities and paid for
          online through the Website.
        </li>
        <li>
          <strong>Custom Manufacturing</strong> &mdash; products developed to your specifications, starting
          with a Request for Quotation (&ldquo;RFQ&rdquo;) and continuing through product development,
          sampling, bulk production, quality control, and export.
        </li>
      </ul>
      <p>
        Products are produced by Grupo and its manufacturing partners in India. Grupo remains your point of
        contact for every order placed with us.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">2. Using the Website</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          You must be at least 18 years old and, if ordering for a business, authorised to act on its behalf.
        </li>
        <li>You agree to provide accurate and complete information when ordering or requesting a quote.</li>
        <li>
          No customer account is required to browse, order from the Wholesale Shop, or submit an RFQ.
        </li>
      </ul>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">3. Wholesale Shop Orders</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          Products are sold in bulk. Unit prices depend on the quantity tier shown on each product page, and a
          minimum order quantity applies.
        </li>
        <li>
          All prices are in Indian Rupees (INR). Shipping charges are shown at checkout before you pay.
          Applicable taxes are charged as required by law.
        </li>
        <li>
          Shop orders are currently delivered to addresses in India. For international delivery, please submit
          an RFQ.
        </li>
        <li>
          An order is confirmed only after your payment is successfully verified. You will receive an order
          number, which you can use on the Track Order page.
        </li>
        <li>
          Products are produced or prepared after confirmation. The production time shown on the product page
          is an estimate, not a guaranteed delivery date.
        </li>
        <li>
          Product images are for reference. Slight variations in colour, shade, or finish may occur between
          production batches and on different screens.
        </li>
        <li>
          Quantities marked &ldquo;Custom Quote&rdquo; are not sold online and are handled as Custom
          Manufacturing.
        </li>
        <li>
          If a product becomes unavailable or was listed at an obviously incorrect price, we may cancel the
          order and refund the amount paid in full.
        </li>
      </ul>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">4. Payments</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          Online payments are processed by Razorpay, a third-party payment gateway, using UPI, cards, net
          banking, or wallets. Grupo does not receive or store your card or bank details.
        </li>
        <li>
          If a payment fails or is cancelled, no order is created. Amounts debited for a failed payment are
          reversed by your bank or payment provider according to their timelines.
        </li>
        <li>
          Payment terms for Custom Manufacturing (such as advance and balance payments) are stated in your
          quotation or order confirmation.
        </li>
      </ul>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">5. Custom Manufacturing and Quotations</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          You can request a quotation using our{' '}
          <Link href="/request-for-quotation" className="text-[#1C8FD7] underline underline-offset-2">
            Request for Quotation form
          </Link>
          . Submitting an RFQ does not create a binding order for either party.
        </li>
        <li>
          Quotations are based on the information you provide and are valid for the period stated in the
          quotation. Changes to specifications, quantities, or materials may change the price and timeline.
        </li>
        <li>
          A custom order is confirmed once you accept the quotation in writing and make any required advance
          payment. Specifications, sample approval, timelines, and payment schedule are agreed per order.
        </li>
        <li>
          Bulk production follows the approved sample and agreed specifications. Changes requested after sample
          approval may incur additional cost and time.
        </li>
        <li>
          For export orders, you are responsible for import duties, taxes, and compliance requirements in the
          destination country unless otherwise agreed in writing.
        </li>
      </ul>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">6. Cancellations, Returns, and Refunds</h2>
      <p>
        Cancellations, returns, refunds, and shipping responsibilities are governed by our{' '}
        <Link href="/refund-policy" className="text-[#1C8FD7] underline underline-offset-2">
          Refund Policy
        </Link>
        , which forms part of these Terms.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">7. Your Designs and Intellectual Property</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          You keep ownership of the designs, logos, artwork, tech packs, and other materials you provide. You
          grant Grupo and its manufacturing partners permission to use them only to quote for, develop,
          produce, and deliver your order.
        </li>
        <li>
          You confirm that you have the rights to the materials you provide and that producing them will not
          infringe anyone else&apos;s intellectual property. You are responsible for any claim that it does.
        </li>
        <li>
          All content on the Website, including text, images, branding, and design, belongs to Grupo or its
          licensors and may not be copied or reused without written permission.
        </li>
      </ul>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">8. Confidentiality</h2>
      <p>
        We treat your designs, specifications, pricing, and order details as confidential and share them only
        with the manufacturing, logistics, and payment partners who need them to fulfil your order, or where
        required by law. We ask you to keep our quotations and pricing confidential as well.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">9. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul className="list-disc space-y-2 pl-6">
        <li>Use the Website unlawfully or submit false, misleading, or fraudulent information or orders.</li>
        <li>Use bots, scrapers, or automated tools to extract content or data from the Website.</li>
        <li>Attempt to disrupt, damage, or gain unauthorised access to the Website or its systems.</li>
      </ul>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">10. Third-Party Services</h2>
      <p>
        The Website uses or links to third-party services, including Razorpay (payments) and Instagram. Their use is subject to their own terms and privacy policies, and
        Grupo is not responsible for their content or availability.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">11. Disclaimer</h2>
      <p>
        The Website is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. We work to keep product
        information, pricing, and availability accurate, but we do not guarantee that the Website will be
        error-free or uninterrupted.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">12. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted under Indian law, Grupo&apos;s total liability for any claim relating to
        an order or to these Terms is limited to the amount you paid for the specific order that gave rise to
        the claim. Grupo is not liable for indirect, incidental, or consequential losses, including loss of
        profit, revenue, or business opportunity.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">13. Indemnification</h2>
      <p>
        You agree to indemnify Grupo against claims, losses, and expenses (including reasonable legal fees)
        arising from your breach of these Terms, materials you provide that infringe third-party rights, or your
        resale or use of the goods.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">14. Dispute Resolution</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>First, good-faith negotiation within 30 days of written notice.</li>
        <li>If unresolved, mediation through a mutually agreed mediator.</li>
        <li>
          If mediation fails, binding arbitration under the Arbitration and Conciliation Act, 1996 (India), in
          Bengaluru, Karnataka.
        </li>
        <li>Either party may seek urgent injunctive relief from a competent court to prevent irreparable harm.</li>
      </ul>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">15. Governing Law and Jurisdiction</h2>
      <p>
        These Terms are governed by the laws of India. Subject to the arbitration clause, courts in Bengaluru,
        Karnataka, India have exclusive jurisdiction.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">16. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. The updated version will be posted on this page with a new
        &ldquo;Last updated&rdquo; date. Orders are governed by the Terms in effect when the order was placed.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">17. Contact Information</h2>
      <p>
        Grupo.in
        <br />
        Email: contact@grupo.in
        <br />
        Website: www.grupo.in
        <br />
        Registered in India
      </p>
    </>
  );
}
