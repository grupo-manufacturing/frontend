const AIFeatures = () => {
  const capabilities = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10M7 17h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
        </svg>
      ),
      title: 'Submit Detailed Requirements',
      description:
        'Create structured product requirements and receive relevant manufacturer responses in one place.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: 'Collaborate in Real Time',
      description:
        'Use built-in chat to discuss specs, revisions, timelines, and updates without switching tools.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3a.75.75 0 00-.75.75v2.087A7.5 7.5 0 005.25 12c0 2.36 1.09 4.466 2.79 5.84v2.41a.75.75 0 00.75.75h6.42a.75.75 0 00.75-.75v-2.41A7.497 7.497 0 0018.75 12a7.5 7.5 0 00-3.75-6.163V3.75a.75.75 0 00-.75-.75h-4.5zM9 12h6" />
        </svg>
      ),
      title: 'Use AI to Speed Up Design Work',
      description:
        'Generate and refine design directions with AI-assisted flows built into the buyer portal.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Track Activity Across Teams',
      description:
        'Manage conversations, requests, and operations through role-based buyer, manufacturer, and admin views.',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm text-blue-600 font-semibold">What You Can Do on Grupo</span>
          </div>
        </div>

        {/* Main Heading */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 text-center mb-4">
          Built for Real Workflows
        </h2>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-600 text-center max-w-3xl mx-auto mb-12">
          From requirements to communication and team operations, Grupo keeps your production flow in one place.
        </p>

        {/* Capabilities Grid */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {capabilities.map((capability, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                {capability.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {capability.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {capability.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIFeatures;

