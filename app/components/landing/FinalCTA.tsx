import Link from 'next/link';

const FinalCTA = () => {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#22a2f2] to-[#1c8fd7]">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          Ready to Start Your Next Production Run?
        </h2>
        <p className="text-base sm:text-lg text-blue-50 max-w-3xl mx-auto mb-10 leading-relaxed">
          Whether you're sourcing manufacturing partners or looking for new business opportunities, Grupo gives you the workflows to move faster.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/buyer-portal"
            className="bg-white text-[#1c8fd7] hover:bg-blue-50 font-semibold px-7 py-3 rounded-lg transition-colors duration-200"
          >
            Start as Buyer
          </Link>
          <Link
            href="/manufacturer-portal"
            className="bg-transparent text-white border-2 border-white hover:bg-white/10 font-semibold px-7 py-3 rounded-lg transition-colors duration-200"
          >
            Join as Manufacturer
          </Link>
          <Link
            href="/shop"
            className="bg-blue-900/30 text-white border-2 border-blue-100/60 hover:bg-blue-900/45 font-semibold px-7 py-3 rounded-lg transition-colors duration-200"
          >
            Shop Wholesale
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
