import Reveal from './Reveal';

const TESTIMONIALS = [
  {
    quote:
      'We needed a reliable partner for our first bulk run from India. Grupo handled sampling, fabric sourcing, and QC without the usual WhatsApp chaos. Shipped on time to the UK.',
    name: 'Sarah Mitchell',
    role: 'Founder',
    market: 'London, UK',
  },
  {
    quote:
      'MOQs that actually make sense for a growing brand. Clear quotes, direct factory communication, and specs that matched the approved sample. Exactly what we were missing.',
    name: 'James Carter',
    role: 'Product Lead',
    market: 'New York, USA',
  },
  {
    quote:
      'From tech pack to export in one workflow. Grupo kept us updated at every stage — development, sampling, bulk, and packing. No surprises at the warehouse.',
    name: 'Amira Hassan',
    role: 'Brand Director',
    market: 'Dubai, UAE',
  },
];

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative scroll-mt-20 overflow-hidden bg-surface py-20 sm:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 45% 40% at 50% 100%, rgba(28,143,215,0.08), transparent 65%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal from="up">
          <div className="max-w-2xl">
            <p className="font-nav text-[11px] uppercase tracking-[0.18em] text-[#1C8FD7] sm:text-xs">
              Social Proof
            </p>
            <h2 className="font-heading mt-3 text-3xl font-black uppercase tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl">
              Testimonials.
              <span className="mt-1 block text-[#1C8FD7]">Trusted by Global Buyers.</span>
            </h2>
            <p className="font-body mt-5 max-w-xl text-base leading-relaxed text-foreground/70 sm:text-lg">
              Real feedback from brands who manufacture with Grupo across markets, categories, and
              order sizes.
            </p>
          </div>
        </Reveal>

        <Reveal from="up" delay={0.12}>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {TESTIMONIALS.map((item, i) => (
              <blockquote
                key={item.name}
                className="flex flex-col border-t border-[#1C8FD7]/30 pt-6 animate-[why-stage-in_0.55s_cubic-bezier(0.22,1,0.36,1)_both]"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <p className="font-heading text-4xl font-black leading-none text-[#1C8FD7]/40">“</p>
                <p className="font-body mt-2 flex-1 text-base leading-relaxed text-foreground/80 sm:text-[17px]">
                  {item.quote}
                </p>
                <footer className="mt-6 border-t border-foreground/10 pt-4">
                  <cite className="font-heading not-italic text-sm font-bold uppercase tracking-wide text-foreground">
                    {item.name}
                  </cite>
                  <p className="font-nav mt-1 text-[11px] uppercase tracking-[0.14em] text-foreground/50">
                    {item.role} · {item.market}
                  </p>
                </footer>
              </blockquote>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
