import Image from 'next/image';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <Navbar />
      <main className="relative overflow-hidden pt-16">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#22a2f2]/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-xl backdrop-blur-sm md:p-10">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#22a2f2]">About</p>
                <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
                  The Man Behind the <span className="text-[#22a2f2]">Grupo</span>
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
                  From one student&apos;s sourcing struggle in Germany to a platform helping global fashion brands manufacture in India with confidence.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <span className="rounded-full border border-[#22a2f2]/25 bg-[#22a2f2]/10 px-4 py-2 text-sm font-medium text-[#1d8ed3]">
                    Founded in December 2023
                  </span>
                  <span className="rounded-full border border-[#22a2f2]/25 bg-[#22a2f2]/10 px-4 py-2 text-sm font-medium text-[#1d8ed3]">
                    Serving UK, US, UAE and beyond
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-[#22a2f2]/30 bg-white shadow-2xl">
                  <Image
                    src="/Ajith.jpeg"
                    alt="Portrait of Ajith, founder of Grupo"
                    width={1000}
                    height={1250}
                    className="h-auto w-full object-cover"
                    priority
                  />
                  <div className="border-t border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-3">
                    <p className="text-sm font-semibold text-gray-800">Ajith</p>
                    <p className="text-xs text-gray-600">Founder, Grupo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
          <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-lg md:p-12">
            <div className="mb-8 h-1 w-20 rounded-full bg-[#22a2f2]" />
            <div className="space-y-6 text-base leading-8 text-gray-700 md:text-lg md:leading-9">
              <p>
                In 2021, Ajith was a student in Germany with a dream and a problem. He wanted to launch his own fashion brand one that drew on India&apos;s legendary textile craftsmanship, brought to European shelves at an honest price point. The idea was clear. The path was not.
              </p>
              <p>
                He spent months chasing leads on WhatsApp, emailing factories that ghosted him, and navigating a fog of minimum order quantities that started at 500 pieces per style a non-starter for any brand just finding its feet.
              </p>
              <p>
                He didn&apos;t launch the brand. He built something more important instead. Ajith returned to India and, in December 2023, founded Grupo which is a manufacturing operating system that does for global fashion brands what no middleman or directory ever could.
              </p>
              <p>
                The core insight was simple but radical: the problem was never India&apos;s manufacturing capacity. India has 50,000+ garment factories, producing everything from premium denim and heavy GSM hoodies to technical athleisure and intricate embroidery. The problem was access, trust, and infrastructure.
              </p>
              <p>
                What Grupo does today: Grupo serves fashion brands in the UK, US, UAE, and beyond who want to manufacture in India without the traditional pain of sourcing. A smart quote calculator gives brands accurate pricing before a single email is sent.
              </p>
              <p>
                Once an order is placed, brands track production in real time, communicate directly through the platform, and receive QC video verification before goods ship. For factories, Grupo is an order engine. For brands, it&apos;s a trusted manufacturing partner that speaks their language.
              </p>
              <p>
                The student in Germany who couldn&apos;t find a factory? He built the platform so no one else has to look.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
