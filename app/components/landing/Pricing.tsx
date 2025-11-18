'use client';

const Pricing = () => {
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: '',
      matchings: 'Up to 50 matchings',
      description: 'Perfect for getting started',
      features: [
        'Access to verified leads',
        'Basic AI matching',
        'Email support',
        'Dashboard analytics',
        'Quality verification',
      ],
      cta: 'Get Started Free',
      popular: false,
      gradient: 'from-gray-500 to-gray-600',
      borderColor: 'border-gray-300',
    },
    {
      name: 'Growth',
      price: '₹2,000',
      period: 'month',
      matchings: 'Up to 500 matchings',
      description: 'Scale your manufacturing operations',
      features: [
        'Everything in Starter',
        'Advanced AI matching',
        'Priority support',
        'Custom sourcing',
        'Dedicated account manager',
        'API access',
      ],
      cta: 'Get Started',
      popular: false,
      gradient: 'from-blue-500 to-indigo-600',
      borderColor: 'border-blue-400',
    },
    {
      name: 'Professional',
      price: '₹5,000',
      period: 'month',
      matchings: 'Up to 1000 matchings',
      description: 'For high-volume manufacturers',
      features: [
        'Everything in Growth',
        'White-glove service',
        'Custom integrations',
        'Advanced analytics & reporting',
        'Multi-user accounts',
        'Priority matching algorithm',
      ],
      cta: 'Get Started',
      popular: true,
      gradient: 'from-blue-500 to-indigo-600',
      borderColor: 'border-blue-400',
    },
    {
      name: 'Export',
      price: '₹10,000',
      period: 'month',
      matchings: 'Unlimited matchings',
      description: 'Complete solution for global exports',
      features: [
        'Everything in Professional',
        'Global export capabilities',
        'International compliance support',
        'Multi-currency support',
        'Customs & logistics assistance',
        'Dedicated export consultant',
        'Premium support (24/7)',
      ],
      cta: 'Get Started',
      popular: false,
      gradient: 'from-purple-500 to-pink-600',
      borderColor: 'border-purple-400',
    },
  ];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-600 font-semibold">Pricing</span>
          </div>
        </div>

        {/* Main Heading */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 text-center mb-4">
          Transparent Pricing
        </h2>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-600 text-center max-w-3xl mx-auto mb-16">
          Choose the perfect plan for your manufacturing needs. All plans include our core features.
        </p>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl p-8 border-2 ${
                plan.popular
                  ? 'border-blue-400 shadow-2xl scale-105 lg:scale-110'
                  : 'border-gray-200 shadow-lg'
              } hover:shadow-xl transition-all duration-300 flex flex-col`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Name */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-500 text-lg">/{plan.period}</span>
                  )}
                </div>
                <div className="mt-3">
                  <span className="text-gray-600 font-medium">{plan.matchings}</span>
                </div>
              </div>

              {/* Features List */}
              <div className="flex-grow mb-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <button
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-105'
                    : plan.name === 'Starter'
                    ? 'bg-gray-700 hover:bg-gray-800 shadow-md hover:shadow-lg'
                    : 'bg-gray-700 hover:bg-gray-800 shadow-md hover:shadow-lg'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>14-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>No hidden fees</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

