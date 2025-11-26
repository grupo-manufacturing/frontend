'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import apiService from '../../lib/apiService';

// Company details - should be configurable
const COMPANY_DETAILS = {
  name: 'GRUPO TECHNOLOGIES PRIVATE LIMITED',
  gstin: '36AAJCG8727C1ZI',
  address: 'SREERANGAM 7-199, X-ROAD THIRUMALAGIRI Nalgonda, Thirumalgiri, Suryapet, TELANGANA, 508223',
  mobile: '+91 7671062042',
  email: 'ajithtolroy@thegrupo.in',
  bank: {
    name: 'DBS',
    account: '8856210000000198',
    ifsc: 'DBSS0IN0856',
    branch: 'Somajiguda'
  }
};

// Convert number to words (Indian format)
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  function convertHundreds(n: number): string {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result.trim();
  }

  let result = '';
  const crores = Math.floor(num / 10000000);
  if (crores > 0) {
    result += convertHundreds(crores) + 'Crore ';
    num %= 10000000;
  }

  const lakhs = Math.floor(num / 100000);
  if (lakhs > 0) {
    result += convertHundreds(lakhs) + 'Lakh ';
    num %= 100000;
  }

  const thousands = Math.floor(num / 1000);
  if (thousands > 0) {
    result += convertHundreds(thousands) + 'Thousand ';
    num %= 1000;
  }

  if (num > 0) {
    result += convertHundreds(num);
  }

  return result.trim();
}

export default function InvoicePage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Fetch order details
        const response = await apiService.getOrder(orderId);
        
        if (response && response.data) {
          setOrder(response.data);
          // Auto-print when page loads
          setTimeout(() => {
            window.print();
          }, 500);
        } else {
          setError('Order not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading invoice...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error || 'Order not found'}</p>
      </div>
    );
  }

  // Generate invoice number (using order ID)
  const invoiceNumber = `PFI-${order.id.slice(-2)}`;
  const invoiceDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const dueDate = invoiceDate;

  // Calculate amounts
  const quantity = order.quantity || order.requirement?.quantity || 1;
  const ratePerItem = order.price_per_unit || (order.quoted_price && quantity ? order.quoted_price / quantity : 0);
  const finalValue = ratePerItem * quantity;
  const totalAmount = finalValue;

  return (
    <div className="min-h-screen bg-white p-8 print:p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b pb-6 print:border-b-2">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 flex items-center justify-center print:w-16 print:h-16">
            <Image
              src="/groupo-logo.png"
              alt="Grupo Logo"
              width={64}
              height={64}
              className="w-16 h-16 object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{COMPANY_DETAILS.name}</h1>
            <p className="text-sm text-gray-600 mt-1">GSTIN: {COMPANY_DETAILS.gstin}</p>
            <p className="text-sm text-gray-600">{COMPANY_DETAILS.address}</p>
            <p className="text-sm text-gray-600">Mobile: {COMPANY_DETAILS.mobile}</p>
            <p className="text-sm text-gray-600">Email: {COMPANY_DETAILS.email}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-900">INVOICE</h2>
        </div>
      </div>

      {/* Buyer and Manufacturer Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Buyer Details</p>
          <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100">
            <p className="font-semibold text-gray-900">
              {order.buyer?.full_name || order.requirement?.buyer?.full_name || order.buyer?.business_name || 'Buyer'}
            </p>
            {order.buyer?.business_name && (
              <p className="text-sm text-gray-600 mt-1">{order.buyer.business_name}</p>
            )}
            <p className="text-sm text-gray-600 mt-2">
              {order.buyer?.business_address || order.requirement?.buyer?.business_address || 'Address not provided'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Phone: {order.buyer?.phone_number || order.requirement?.buyer?.phone_number || 'N/A'}
            </p>
            {order.buyer?.gstin && (
              <p className="text-sm text-gray-600 mt-1">GSTIN: {order.buyer.gstin}</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Manufacturer Details</p>
          <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100">
            <p className="font-semibold text-gray-900">
              {order.manufacturer?.unit_name || order.manufacturer?.business_name || 'Manufacturer'}
            </p>
            {order.manufacturer?.business_type && (
              <p className="text-sm text-gray-600 mt-1">{order.manufacturer.business_type}</p>
            )}
            <p className="text-sm text-gray-600 mt-2">
              {order.manufacturer?.business_address || order.manufacturer?.location || 'Address not provided'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Phone: {order.manufacturer?.phone_number || 'N/A'}
            </p>
            {order.manufacturer?.gstin && (
              <p className="text-sm text-gray-600 mt-1">GSTIN: {order.manufacturer.gstin}</p>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8 overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 print:bg-gray-200">
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Sr. No</th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Item</th>
              <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700">Price Per Unit</th>
              <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700">Qty</th>
              <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700">Final Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">1</td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">{order.design?.product_name || order.requirement?.product_type || order.requirement?.requirement_text || 'Product'}</td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 text-right">₹{ratePerItem.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 text-right">{quantity}</td>
              <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{finalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mb-8">
        <p className="text-sm text-gray-600 mb-4">Total Items / Qty: 1 / {quantity}</p>
      </div>

      {/* Totals */}
      <div className="mb-8 flex justify-end">
        <div className="w-80">
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
            <span className="text-gray-900">Total:</span>
            <span className="text-gray-900">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg print:bg-gray-100">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Total Amount in Words:</span>{' '}
          INR {numberToWords(Math.round(totalAmount))} Rupees Only.
        </p>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-300">
        <p className="text-sm text-gray-600 text-center mb-4">For {COMPANY_DETAILS.name}</p>
        <div className="text-center">
          <div className="inline-block border-t-2 border-gray-400 w-48 pt-2">
            <p className="text-sm text-gray-600">Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

