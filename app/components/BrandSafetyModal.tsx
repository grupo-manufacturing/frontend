'use client';

import { useState, useEffect } from 'react';

interface BrandSafetyModalProps {
  onAgree: () => void;
  onClose: () => void;
}

export default function BrandSafetyModal({ onAgree, onClose }: BrandSafetyModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  const handleAgree = () => {
    setIsOpen(false);
    onAgree();
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[75vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#22a2f2] to-[#1b8bd0] px-6 py-3 rounded-t-xl flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Brand Safety & Transaction Guidelines</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/20"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="space-y-3">
            <p className="text-gray-700 leading-relaxed text-sm">
              Please review and agree to the following guidelines to ensure safe and transparent transactions on the Grupo platform:
            </p>

            <div className="space-y-3 mt-4">
              <div className="flex gap-2.5">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-800 font-medium text-sm">Stay on Platform</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    Do not move conversations or payments outside the Grupo platform. This ensures transparency, dispute protection, and verified transaction records.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-800 font-medium text-sm">Request Samples</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    Always request production samples and real factory photos before finalizing orders.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-800 font-medium text-sm">Confirm Details in Writing</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    Confirm order quantity, specs, and timelines in writing to avoid misunderstandings.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-800 font-medium text-sm">Use Grupo Payment System</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    Release payments only after verification milestones [Pay via Grupo]. Ask for the Grupo payment link.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-800 font-medium text-sm">Report Issues Immediately</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    Report inconsistencies immediately to maintain platform safety and integrity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-3 rounded-b-xl border-t border-gray-200">
          <button
            onClick={handleAgree}
            className="w-full bg-[#22a2f2] hover:bg-[#1b8bd0] text-white font-semibold py-2.5 px-6 rounded-lg transition-all shadow-md hover:shadow-lg text-sm"
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}

