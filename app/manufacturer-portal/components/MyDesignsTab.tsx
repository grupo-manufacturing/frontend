'use client';

import { useState, useEffect } from 'react';
import apiService from '../../lib/apiService';

type SubTabType = 'my-designs' | 'design-orders';

export default function MyDesignsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('my-designs');
  
  // Designs states
  const [designs, setDesigns] = useState<any[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  
  // Orders states
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [editingDesign, setEditingDesign] = useState<any | null>(null);
  const [designForm, setDesignForm] = useState({
    product_name: '',
    product_category: '',
    image_url: '',
    price_1_50: '',
    price_51_100: '',
    price_101_200: '',
    tags: [] as string[]
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmittingDesign, setIsSubmittingDesign] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Fetch designs
  const fetchDesigns = async () => {
    setIsLoadingDesigns(true);
    try {
      const response = await apiService.getDesigns();
      if (response.success && response.data) {
        setDesigns(response.data.designs || []);
      } else {
        console.error('Failed to fetch designs');
        setDesigns([]);
      }
    } catch (error) {
      console.error('Failed to fetch designs:', error);
      setDesigns([]);
    } finally {
      setIsLoadingDesigns(false);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await apiService.getManufacturerOrders({});
      if (response.success && response.data) {
        setOrders(response.data || []);
      } else {
        console.error('Failed to fetch orders');
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Fetch designs on mount
  useEffect(() => {
    fetchDesigns();
    fetchOrders();
  }, []);

  // Handle design image upload
  const handleDesignImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const response = await apiService.uploadDesignImage(file);
      if (response.success && response.data) {
        setDesignForm({ ...designForm, image_url: response.data.url });
        return response.data.url;
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error: any) {
      console.error('Failed to upload design image:', error);
      alert(error.message || 'Failed to upload image');
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle create/update design
  const handleSubmitDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!designForm.product_category) {
      alert('Please select a product category');
      return;
    }
    
    setIsSubmittingDesign(true);
    try {
      const designData = {
        product_name: designForm.product_name,
        product_category: designForm.product_category,
        image_url: designForm.image_url,
        price_1_50: designForm.price_1_50 ? parseFloat(designForm.price_1_50) : undefined,
        price_51_100: designForm.price_51_100 ? parseFloat(designForm.price_51_100) : undefined,
        price_101_200: designForm.price_101_200 ? parseFloat(designForm.price_101_200) : undefined,
        tags: designForm.tags
      };

      if (editingDesign) {
        await apiService.updateDesign(editingDesign.id, designData);
      } else {
        await apiService.createDesign(designData);
      }

      // Reset form and close modal
      setDesignForm({
        product_name: '',
        product_category: '',
        image_url: '',
        price_1_50: '',
        price_51_100: '',
        price_101_200: '',
        tags: []
      });
      setEditingDesign(null);
      setShowDesignModal(false);
      
      // Refresh designs
      await fetchDesigns();
    } catch (error: any) {
      console.error('Failed to save design:', error);
      alert(error.message || 'Failed to save design');
    } finally {
      setIsSubmittingDesign(false);
    }
  };

  // Handle edit design
  const handleEditDesign = (design: any) => {
    setEditingDesign(design);
    setDesignForm({
      product_name: design.product_name,
      product_category: design.product_category,
      image_url: design.image_url,
      price_1_50: design.price_1_50 ? design.price_1_50.toString() : '',
      price_51_100: design.price_51_100 ? design.price_51_100.toString() : '',
      price_101_200: design.price_101_200 ? design.price_101_200.toString() : '',
      tags: design.tags || []
    });
    setShowDesignModal(true);
  };

  // Handle delete design
  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return;
    
    try {
      await apiService.deleteDesign(designId);
      await fetchDesigns();
    } catch (error: any) {
      console.error('Failed to delete design:', error);
      alert(error.message || 'Failed to delete design');
    }
  };

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22a2f2]/10 text-[#22a2f2] text-sm font-semibold mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>My Designs</span>
            </div>
            <h1 className="text-3xl font-bold text-black mb-2">Design Portfolio</h1>
            <p className="text-gray-600">Manage and showcase your design collection</p>
          </div>
          {activeSubTab === 'my-designs' && (
            <button
              onClick={() => {
                setEditingDesign(null);
                setDesignForm({
                  product_name: '',
                  product_category: '',
                  image_url: '',
                  price_1_50: '',
                  price_51_100: '',
                  price_101_200: '',
                  tags: []
                });
                setShowDesignModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#22a2f2] text-white rounded-xl font-semibold hover:bg-[#1b8bd0] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Design</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveSubTab('my-designs')}
            className={`relative flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-all ${
              activeSubTab === 'my-designs'
                ? 'text-[#22a2f2]'
                : 'text-gray-500 hover:text-[#22a2f2]'
            }`}
          >
            {activeSubTab === 'my-designs' && (
              <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-t-lg border-b-2 border-[#22a2f2]"></div>
            )}
            <svg
              className="relative z-10 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="relative z-10">My Designs</span>
          </button>

          <button
            onClick={() => setActiveSubTab('design-orders')}
            className={`relative flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-all ${
              activeSubTab === 'design-orders'
                ? 'text-[#22a2f2]'
                : 'text-gray-500 hover:text-[#22a2f2]'
            }`}
          >
            {activeSubTab === 'design-orders' && (
              <div className="absolute inset-0 bg-[#22a2f2]/10 rounded-t-lg border-b-2 border-[#22a2f2]"></div>
            )}
            <svg
              className="relative z-10 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="relative z-10">Design Orders</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Content */}
      <div>
        {activeSubTab === 'my-designs' && (
          <>

      {/* Loading State */}
      {isLoadingDesigns && (
        <div className="bg-white rounded-xl border border-[#22a2f2]/30 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <svg className="animate-spin w-12 h-12 text-[#22a2f2] mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500">Loading designs...</p>
          </div>
        </div>
      )}

      {/* Designs Grid */}
      {!isLoadingDesigns && designs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design: any) => (
            <div
              key={design.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#22a2f2]/50 transition-all duration-200 overflow-hidden group"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                  src={design.image_url}
                  alt={design.product_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Product Type Badge - Top Left */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-[#22a2f2]/90 backdrop-blur-sm text-white text-xs font-semibold rounded-md">
                    {design.product_category}
                  </span>
                </div>
                {/* Edit/Delete Buttons - Top Right */}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleEditDesign(design)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteDesign(design.id)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Product Info */}
              <div className="p-5">
                <div className="mb-2">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{design.product_name}</h3>
                </div>
                {design.tags && design.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {design.tags.slice(0, 3).map((tag: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingDesigns && designs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="relative group mb-6">
              <div className="bg-[#22a2f2]/10 rounded-2xl p-8 border border-[#22a2f2]/30 shadow-sm">
                <svg
                  className="mx-auto h-20 w-20 text-[#22a2f2]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-lg font-semibold text-[#22a2f2] mb-2">No designs yet</p>
            <p className="text-sm text-gray-500 mb-6">
              Start building your design portfolio by adding your first design
            </p>
            <button
              onClick={() => {
                setEditingDesign(null);
                setDesignForm({
                  product_name: '',
                  product_category: '',
                  image_url: '',
                  price_1_50: '',
                  price_51_100: '',
                  price_101_200: '',
                  tags: []
                });
                setShowDesignModal(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#22a2f2] text-white rounded-xl font-semibold hover:bg-[#1b8bd0] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Your First Design</span>
            </button>
          </div>
        </div>
      )}

      {/* Design Modal */}
      {showDesignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-black">{editingDesign ? 'Edit Design' : 'Add New Design'}</h3>
              <button
                onClick={() => {
                  setShowDesignModal(false);
                  setEditingDesign(null);
                  setDesignForm({
                    product_name: '',
                    product_category: '',
                    image_url: '',
                    price_1_50: '',
                    price_51_100: '',
                    price_101_200: '',
                    tags: []
                  });
                }}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitDesign} className="p-6 space-y-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={designForm.product_name}
                  onChange={(e) => setDesignForm({ ...designForm, product_name: e.target.value })}
                  placeholder="Enter product name"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500"
                  required
                />
              </div>

              {/* Product Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="hidden"
                    value={designForm.product_category}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    onBlur={() => setTimeout(() => setIsCategoryDropdownOpen(false), 200)}
                    className={`appearance-none w-full px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black cursor-pointer transition-all text-left flex items-center justify-between ${
                      !designForm.product_category ? 'text-gray-500' : 'text-black'
                    }`}
                  >
                    <span>
                      {designForm.product_category 
                        ? designForm.product_category
                        : 'Select category'}
                    </span>
                    <svg 
                      className={`h-5 w-5 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'transform rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  
                  {isCategoryDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      <div className="max-h-[300px] overflow-y-auto">
                        {[
                          { value: 'Tshirts Plain', label: 'Tshirts Plain' },
                          { value: 'Tshirts Printed', label: 'Tshirts Printed' },
                          { value: 'Acid Wash Plain', label: 'Acid Wash Plain' },
                          { value: 'Cargos', label: 'Cargos' },
                          { value: 'Polos', label: 'Polos' },
                          { value: 'Mesh', label: 'Mesh' },
                          { value: 'Denim Jeans', label: 'Denim Jeans' },
                          { value: 'Twill Jacket', label: 'Twill Jacket' },
                          { value: 'Wind Cheaters', label: 'Wind Cheaters' },
                          { value: 'Vests', label: 'Vests' },
                          { value: 'Cotton Shirts', label: 'Cotton Shirts' },
                          { value: 'Silk Shirts', label: 'Silk Shirts' },
                          { value: 'Carduroy Shirts', label: 'Carduroy Shirts' },
                          { value: 'Varsity Jackets', label: 'Varsity Jackets' },
                          { value: 'Sweatshirts', label: 'Sweatshirts' },
                          { value: 'Hoodies Plain', label: 'Hoodies Plain' },
                          { value: 'Hoodies Printed', label: 'Hoodies Printed' },
                          { value: 'Tops', label: 'Tops' },
                          { value: 'Women Dresss', label: 'Women Dresss' },
                          { value: 'Leather Products', label: 'Leather Products' },
                          { value: 'Caps', label: 'Caps' },
                          { value: 'Bags', label: 'Bags' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setDesignForm({ ...designForm, product_category: option.value });
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                              designForm.product_category === option.value ? 'bg-[#22a2f2]/10 text-[#22a2f2] font-medium' : 'text-gray-900'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Image <span className="text-red-500">*</span>
                </label>
                {designForm.image_url ? (
                  <div className="relative">
                    <img src={designForm.image_url} alt="Design preview" className="w-full h-64 object-cover rounded-xl border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setDesignForm({ ...designForm, image_url: '' })}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            await handleDesignImageUpload(file);
                          } catch (error) {
                            console.error('Upload failed:', error);
                          }
                        }
                      }}
                      className="hidden"
                      id="design-image-upload"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="design-image-upload"
                      className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        uploadingImage
                          ? 'border-gray-300 bg-gray-50'
                          : 'border-gray-300 hover:border-[#22a2f2] hover:bg-[#22a2f2]/5'
                      }`}
                    >
                      {uploadingImage ? (
                        <>
                          <svg className="animate-spin w-8 h-8 text-[#22a2f2] mb-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm text-gray-500">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">Click to upload image</span>
                          <span className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Pricing Tiers */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pricing (₹ per unit)
                  </label>
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <span className="font-semibold">Note:</span> A 10% commission will be automatically added to your prices when buyers view your designs. You set the base price, and buyers will see the final price (base + 10% commission).
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        1-50 pieces
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={designForm.price_1_50}
                        onChange={(e) => setDesignForm({ ...designForm, price_1_50: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        51-100 pieces
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={designForm.price_51_100}
                        onChange={(e) => setDesignForm({ ...designForm, price_51_100: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        101-200 pieces
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={designForm.price_101_200}
                        onChange={(e) => setDesignForm({ ...designForm, price_101_200: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22a2f2] focus:border-[#22a2f2] outline-none text-black placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDesignModal(false);
                    setEditingDesign(null);
                    setDesignForm({
                      product_name: '',
                      product_category: '',
                      image_url: '',
                      price_1_50: '',
                      price_51_100: '',
                      price_101_200: '',
                      tags: []
                    });
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDesign || !designForm.image_url}
                  className="flex-1 px-4 py-3 bg-[#22a2f2] text-white rounded-xl font-semibold hover:bg-[#1b8bd0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingDesign ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingDesign ? 'Update Design' : 'Submit'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
          </>
        )}

        {activeSubTab === 'design-orders' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black mb-2">Design Orders</h3>
              <p className="text-sm text-gray-600">View and manage all your design orders</p>
            </div>
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <svg className="animate-spin w-12 h-12 text-[#22a2f2] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-500">Loading orders...</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-[#22a2f2]/15 rounded-2xl opacity-0 group-hover:opacity-100 transition"></div>
                    <div className="relative bg-white rounded-2xl p-8 mb-4 border border-[#22a2f2]/30">
                      <svg className="w-16 h-16 text-[#22a2f2] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                  </div>
                  <p className="text-lg font-medium text-gray-600 mb-2">No orders yet</p>
                  <p className="text-sm text-gray-500">Receive orders to start tracking distribution</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((order: any) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden group"
                  >
                    {/* Product Image */}
                    {order.design?.image_url && (
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        <img
                          src={order.design.image_url}
                          alt={order.design.product_name || 'Product'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Order Details */}
                    <div className="p-5">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {order.design?.product_name || 'Product'}
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Buyer: {order.buyer?.full_name || order.buyer?.phone_number || 'Unknown'}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium text-gray-900">{order.quantity}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Price/Unit:</span>
                          <span className="font-medium text-gray-900">₹{order.price_per_unit}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                          <span className="text-gray-900 font-semibold">Total:</span>
                          <span className="font-bold text-[#22a2f2] text-lg">₹{order.total_price}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-4">
                        {new Date(order.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                        {/* Status Change Buttons */}
                        {order.status === 'pending' && (
                          <button
                            onClick={async () => {
                              try {
                                await apiService.updateOrderStatus(order.id, 'confirmed');
                                fetchOrders();
                              } catch (error: any) {
                                alert(error.message || 'Failed to update order status');
                              }
                            }}
                            className="w-full px-4 py-2 bg-[#22a2f2] text-white rounded-lg font-medium hover:bg-[#1b8bd0] transition-colors text-sm"
                          >
                            Confirm Order
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={async () => {
                              try {
                                await apiService.updateOrderStatus(order.id, 'shipped');
                                fetchOrders();
                              } catch (error: any) {
                                alert(error.message || 'Failed to update order status');
                              }
                            }}
                            className="w-full px-4 py-2 bg-[#22a2f2] text-white rounded-lg font-medium hover:bg-[#1b8bd0] transition-colors text-sm"
                          >
                            Mark as Shipped
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={async () => {
                              try {
                                await apiService.updateOrderStatus(order.id, 'delivered');
                                fetchOrders();
                              } catch (error: any) {
                                alert(error.message || 'Failed to update order status');
                              }
                            }}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                          >
                            Mark as Delivered
                          </button>
                        )}
                        
                        {/* Print Invoice Button - Available for all statuses */}
                        <button
                          onClick={() => {
                            // Open invoice in new tab as PDF
                            window.open(`/invoice/${order.id}`, '_blank');
                          }}
                          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

