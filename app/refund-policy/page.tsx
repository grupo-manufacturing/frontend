import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <Navbar />
      <main className="pt-20 pb-16">
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg md:p-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#22a2f2]">
              Legal
            </p>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Refund Policy</h1>
            <div className="mt-6 space-y-6 text-base leading-7 text-gray-700">
              <p>
                Grupo provides its customers with only strictly quality-controlled goods without exemption according to
                Grupo quality standards. We follow the specifications instructed by the customer at the time of order.
                Any changes during production will be notified and confirmed by the customer.
              </p>

              <p>
                We do not accept returns or refunds for any customized goods once the order has been placed or shipped.
                You may ask for pictures, video conferences, or anything feasible to verify that your specifications are
                being followed.
              </p>

              <p>
                You can request changes to the garment as long as the sample has not been approved for bulk production
                or shipped out. Changes can also be made after shipping, but you will need to pay for the shipment and
                re-shipment of the garment.
              </p>
              <p>
                No refunds shall be issued for any cancellations made after the commmencement of production. 
              </p>

              <h2 className="pt-2 text-xl font-semibold text-gray-900">Shipping & Delivery Charges</h2>

              <p>
                We do not take responsibility for guaranteed delivery. The guarantee of delivery of your order is
                undertaken by the shipping company, which provides the tracking information.
              </p>

              <p>
                Once we provide the tracking ID, it is your responsibility to contact the shipping company regarding
                shipment status. We do not own a shipping company. We ship goods as a favor to clients to reduce
                additional hassles, but we do not take responsibility for lost shipments.
              </p>

              <p>
                In case of lost shipment, the client will need to pay the production charges again. If the shipping
                company does not waive shipping charges, those charges must also be paid by the client.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
