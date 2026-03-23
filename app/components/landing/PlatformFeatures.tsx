'use client';

const PlatformFeatures = () => {
  const journeys = [
    {
      title: 'For Buyers',
      steps: [
        'Create your requirement',
        'Review manufacturer responses',
        'Collaborate and move forward with confidence',
      ],
    },
    {
      title: 'For Manufacturers',
      steps: [
        'Complete onboarding',
        'Receive relevant opportunities',
        'Respond, chat, and manage active work',
      ],
    },
    {
      title: 'For Wholesale Buyers',
      steps: [
        'Browse bulk-ready products',
        'Place order with integrated checkout',
        'Track order status from your portal',
      ],
    },
  ];

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span className="text-sm text-blue-600 font-semibold">How It Works</span>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 text-center mb-4">
          One Platform, Three Clear Paths
        </h2>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-600 text-center max-w-3xl mx-auto mb-12">
          Choose your role and follow a workflow designed to move you from discovery to execution.
        </p>

        {/* Role Journeys */}
        <div className="grid lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {journeys.map((journey, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">{journey.title}</h3>
              <div className="space-y-3">
                {journey.steps.map((step, stepIndex) => (
                  <div key={step} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
                      {stepIndex + 1}
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformFeatures;

