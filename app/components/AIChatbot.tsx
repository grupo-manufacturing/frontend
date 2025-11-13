'use client';

import { useState, useEffect } from 'react';
import InstantQuote from './InstantQuote';

interface AIChatbotProps {
  onQuoteChat?: (quote: any) => void;
}

export default function AIChatbot({ onQuoteChat }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOpenChat = (quote: any) => {
    if (onQuoteChat) {
      onQuoteChat(quote);
    } else {
      alert(`Opening chat with ${quote.manufacturer}. Please use the Instant Quote feature from the Buyer Portal for full chat functionality.`);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Static Floating Chat Button - Bottom Right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
        aria-label="Open AI Chatbot"
      >
        <div className="relative">
          {/* Pulsing Ring Animation */}
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
          
          {/* Button */}
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full p-3 sm:p-4 shadow-2xl transition-all duration-200 hover:scale-110">
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
        </div>
      </button>

      {/* Backdrop Overlay - Prevents scrolling */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Modal Window - Centered */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70]
          w-full sm:w-[95vw] md:w-[90vw] lg:w-[85vw] max-w-4xl 
          h-full sm:h-[95vh] md:h-[90vh] lg:h-[85vh] max-h-[800px] 
          bg-white sm:rounded-2xl shadow-2xl transition-all duration-300 transform flex flex-col ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header - Responsive */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 md:px-8 py-4 sm:py-5 sm:rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <div className="relative">
              <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg md:text-xl">Instant Quote Generator</h3>
              <p className="text-xs sm:text-sm text-blue-100 hidden sm:block">Powered by Grupo AI • Get Instant Quotes</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 sm:p-2 transition-colors"
            aria-label="Close chat"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Instant Quote Content */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 md:p-8 bg-gray-50">
          <InstantQuote onOpenChat={handleOpenChat} />
        </div>
      </div>
    </>
  );
}

