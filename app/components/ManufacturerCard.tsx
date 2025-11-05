'use client';

import React, { useState } from 'react';

interface ManufacturerCardProps {
  name: string;
  rating: number;
  products: string;
  location: string;
  successRate: string;
  capacity: string;
  priceRange: string;
  onChat?: () => void;
  onOrder: () => void;
  manufacturerId?: string;
  buyerId?: string;
}

export default function ManufacturerCard({
  name,
  rating,
  products,
  location,
  successRate,
  capacity,
  priceRange,
  onChat,
  onOrder,
  manufacturerId,
  buyerId
}: ManufacturerCardProps) {
  const [openChat, setOpenChat] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  async function handleChatClick() {
    if (onChat) return onChat();
    if (!buyerId || !manufacturerId) return;
    const api = (await import('../lib/apiService')).default;
    try {
      const res = await api.ensureConversation(buyerId, manufacturerId);
      const id = res.data?.conversation?.id;
      if (id) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('open-chat', { detail: { conversationId: id, buyerId, manufacturerId } }));
        }
      }
    } catch (e) {
      console.error('Failed to start conversation', e);
    }
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <span className="font-bold text-gray-900">{name}</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">{rating}</span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span>{products}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{location}</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="font-medium">{successRate}</span>
          </div>
          <div className="text-gray-600">
            <span>{capacity}</span>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* Quote */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">Estimated Quote:</span>
        <span className="text-sm font-semibold text-blue-600">{priceRange}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleChatClick}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Chat</span>
        </button>
        
        <button
          onClick={onOrder}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-sm font-medium">Order</span>
        </button>
      </div>
      {openChat && conversationId && buyerId && manufacturerId ? (
        // @ts-ignore - dynamic import path resolution
        (() => {
          const ChatWindow = require('./chat/ChatWindow').default;
          return <ChatWindow conversationId={conversationId} buyerId={buyerId} manufacturerId={manufacturerId} onClose={() => setOpenChat(false)} />;
        })()
      ) : null}
    </div>
  );
}
