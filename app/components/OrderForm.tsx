'use client';

import { useState } from 'react';

interface OrderFormProps {
  manufacturerName: string;
  estimatedPrice: string;
  location: string;
  onSubmit: (orderData: OrderData) => void;
  onCancel: () => void;
}

interface OrderData {
  productType: string;
  quantity: string;
  requirements: string;
}

export default function OrderForm({
  manufacturerName,
  estimatedPrice,
  location,
  onSubmit,
  onCancel
}: OrderFormProps) {
  const [formData, setFormData] = useState<OrderData>({
    productType: '',
    quantity: '',
    requirements: ''
  });

  const [errors, setErrors] = useState<Partial<OrderData>>({});

  const handleInputChange = (field: keyof OrderData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<OrderData> = {};
    
    if (!formData.productType.trim()) {
      newErrors.productType = 'Product type is required';
    }
    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    }
    if (!formData.requirements.trim()) {
      newErrors.requirements = 'Requirements are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="bg-blue-50 px-4 py-3 rounded-t-xl flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="font-semibold text-blue-800">Order Details - {manufacturerName}</h3>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Product Type and Quantity Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.productType}
              onChange={(e) => handleInputChange('productType', e.target.value)}
              placeholder="e.g., T-Shirts"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${
                errors.productType ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.productType && (
              <p className="text-xs text-red-500 mt-1">{errors.productType}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              placeholder="e.g., 1000"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${
                errors.quantity ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.quantity && (
              <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
            )}
          </div>
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Requirements <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.requirements}
            onChange={(e) => handleInputChange('requirements', e.target.value)}
            placeholder="Describe your requirements (material, colors, sizes, etc.)"
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none ${
              errors.requirements ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.requirements && (
            <p className="text-xs text-red-500 mt-1">{errors.requirements}</p>
          )}
        </div>

        {/* Information Display */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Estimated Price:</span>
            <span className="text-sm font-semibold text-blue-600">{estimatedPrice}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Location:</span>
            <span className="text-sm text-gray-800">{location}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Submit Order Request
          </button>
        </div>
      </form>
    </div>
  );
}
