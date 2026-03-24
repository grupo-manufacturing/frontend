'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import apiService from '../../lib/apiService';
import { useToast } from '../../components/Toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSubmitted: () => void;
  requirementResponse: {
    id: string;
    quoted_price: number;
    manufacturer?: {
      unit_name?: string;
    };
  };
  requirement: {
    id: string;
    requirement_no?: string;
    product_type?: string;
    quantity?: number;
  };
  paymentNumber: 1 | 2;
}

type PaymentStep = 'loading' | 'show_qr' | 'enter_utr' | 'error';

export default function PaymentModal({
  isOpen,
  onClose,
  onPaymentSubmitted,
  requirementResponse,
  requirement,
  paymentNumber
}: PaymentModalProps) {
  const toast = useToast();
  const [step, setStep] = useState<PaymentStep>('loading');
  const [qrData, setQrData] = useState<{
    payment_id: string;
    qr_image_base64: string;
    amount: number;
    upi_id: string;
    upi_name: string;
  } | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Generate QR on mount (with flag to prevent double-call from StrictMode)
  const isGeneratingRef = useRef(false);
  
  useEffect(() => {
    if (!isOpen) return;
    if (isGeneratingRef.current) return;
    
    const generateQR = async () => {
      if (isGeneratingRef.current) return;
      isGeneratingRef.current = true;
      
      setStep('loading');
      setErrorMessage('');
      
      try {
        const response = await apiService.createPaymentQR(requirementResponse.id, paymentNumber);
        
        if (response.success && response.data) {
          setQrData(response.data);
          setStep('show_qr');
        } else {
          setErrorMessage(response.message || 'Failed to generate payment QR');
          setStep('error');
        }
      } catch (error: any) {
        console.error('Failed to generate QR:', error);
        setErrorMessage(error.message || 'Failed to generate payment QR');
        setStep('error');
      } finally {
        isGeneratingRef.current = false;
      }
    };

    generateQR();
  }, [isOpen, requirementResponse.id, paymentNumber]);

  const handleProceedToUTR = () => {
    setStep('enter_utr');
  };

  const handleSubmitUTR = async () => {
    if (!utrInput.trim() || utrInput.trim().length < 6) {
      toast.error('Please enter a valid UTR number (minimum 6 characters)');
      return;
    }

    if (!qrData) return;

    setIsSubmitting(true);
    try {
      const response = await apiService.submitUTR(qrData.payment_id, utrInput.trim());
      
      if (response.success) {
        toast.info('UTR submitted! Awaiting admin verification.');
        onPaymentSubmitted();
        onClose();
      } else {
        toast.error(response.message || 'Failed to submit UTR');
      }
    } catch (error: any) {
      console.error('Failed to submit UTR:', error);
      toast.error(error.message || 'Failed to submit UTR');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setStep('loading');
    setErrorMessage('');
    setUtrInput('');
    
    const generateQR = async () => {
      try {
        const response = await apiService.createPaymentQR(requirementResponse.id, paymentNumber);
        
        if (response.success && response.data) {
          setQrData(response.data);
          setStep('show_qr');
        } else {
          setErrorMessage(response.message || 'Failed to generate payment QR');
          setStep('error');
        }
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to generate payment QR');
        setStep('error');
      }
    };

    generateQR();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {paymentNumber === 1 ? 'Pay 50% Advance' : 'Pay Remaining 50%'}
              </h2>
              <p className="text-sm text-gray-500">
                {requirement.requirement_no || `Order for ${requirement.product_type}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading State */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="animate-spin w-12 h-12 text-[#22a2f2] mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-500">Generating payment QR...</p>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-sm text-gray-500 text-center mb-6">{errorMessage}</p>
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 bg-[#22a2f2] hover:bg-[#1a8cd8] text-white font-semibold rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Show QR State */}
          {step === 'show_qr' && qrData && (
            <div className="space-y-6">
              {/* Amount Display */}
              <div className="text-center bg-gradient-to-r from-[#22a2f2]/10 to-[#22a2f2]/5 rounded-xl p-4 border border-[#22a2f2]/20">
                <p className="text-sm text-gray-500 mb-1">Amount to Pay</p>
                <p className="text-3xl font-bold text-[#22a2f2]">{formatCurrency(qrData.amount)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {paymentNumber === 1 ? '50% of' : 'Remaining 50% of'} {formatCurrency(requirementResponse.quoted_price)}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 shadow-inner">
                  <img 
                    src={qrData.qr_image_base64} 
                    alt="UPI QR Code" 
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-3">Scan with any UPI app</p>
              </div>

              {/* UPI Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">UPI ID</span>
                  <span className="text-sm font-mono font-semibold text-gray-900">{qrData.upi_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Pay to</span>
                  <span className="text-sm font-semibold text-gray-900">{qrData.upi_name}</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Important:</p>
                    <p>After completing the payment, note down the UTR/Reference number from your UPI app and click the button below to submit it.</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleProceedToUTR}
                className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                I've Paid — Enter UTR
              </button>
            </div>
          )}

          {/* Enter UTR State */}
          {step === 'enter_utr' && qrData && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#22a2f2]/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter UTR Number</h3>
                <p className="text-sm text-gray-500">
                  Find the UTR/Reference number in your UPI app's transaction history
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UTR / Reference Number
                </label>
                <input
                  type="text"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value.toUpperCase())}
                  placeholder="e.g., 123456789012"
                  className="w-full px-4 py-3 border border-gray-300 bg-white rounded-xl text-lg font-mono tracking-wide text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none transition-all"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2">
                  Usually 12-22 characters, found in payment confirmation
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('show_qr')}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitUTR}
                  disabled={isSubmitting || utrInput.trim().length < 6}
                  className="flex-1 py-3 bg-[#22a2f2] hover:bg-[#1a8cd8] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit UTR'
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return null;
}
