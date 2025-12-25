'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import ChatList from '../../components/chat/ChatList';
import ChatWindow from '../../components/chat/ChatWindow';
import apiService from '../../lib/apiService';

interface ChatsTabProps {
  onTabChange?: () => void;
  conversationUnreadCounts?: Record<string, number>;
  onClearConversationUnread?: (conversationId: string) => void;
}

export interface ChatsTabRef {
  openChat: (conversationId: string, buyerId: string, manufacturerId: string, title?: string, requirement?: any) => void;
  openChatFromQuote: (quote: any) => Promise<void>;
  openChatFromNegotiation: (requirement: any, response: any) => Promise<void>;
  openChatFromRequirementAccept: (requirement: any, response: any) => Promise<void>;
  openChatFromAIDesignAccept: (aiDesign: any, response: any) => Promise<void>;
}

const ChatsTab = forwardRef<ChatsTabRef, ChatsTabProps>(({ onTabChange, conversationUnreadCounts = {}, onClearConversationUnread }, ref) => {
  // Chat States
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeBuyerId, setActiveBuyerId] = useState<string | null>(null);
  const [activeManufacturerId, setActiveManufacturerId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | undefined>(undefined);
  const [activeRequirement, setActiveRequirement] = useState<any | null>(null);
  const [activeAIDesign, setActiveAIDesign] = useState<any | null>(null);

  // Helper to get buyerId from localStorage or profile (fallback)
  const getBuyerId = async () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('buyerId');
      if (stored) return stored;
    }
    try {
      const prof = await apiService.getBuyerProfile();
      const id = prof?.data?.profile?.id;
      if (id) {
        const idString = String(id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('buyerId', idString);
        }
        return idString;
      }
      // If profile exists but no id, this is an error condition
      console.error('Buyer profile exists but has no id field:', prof);
      return null;
    } catch (error) {
      console.error('Failed to get buyer profile for buyerId:', error);
      return null;
    }
  };

  // Persist chat state to localStorage whenever it changes
  useEffect(() => {
      if (typeof window !== 'undefined') {
        if (activeConversationId && activeBuyerId && activeManufacturerId) {
          const chatState = {
            conversationId: activeConversationId,
            buyerId: activeBuyerId,
            manufacturerId: activeManufacturerId,
            title: activeTitle,
            requirement: activeRequirement,
            aiDesign: activeAIDesign
          };
          localStorage.setItem('buyer_chat_state', JSON.stringify(chatState));
        } else {
          localStorage.removeItem('buyer_chat_state');
        }
      }
    }, [activeConversationId, activeBuyerId, activeManufacturerId, activeTitle, activeRequirement, activeAIDesign]);

  // Listen for chat open events from components like ManufacturerCard
  useEffect(() => {
    function onOpenChat(e: any) {
      if (!e?.detail) return;
      const { conversationId, buyerId, manufacturerId } = e.detail;
      if (onTabChange) onTabChange();
      setActiveConversationId(conversationId);
      setActiveBuyerId(buyerId);
      setActiveManufacturerId(manufacturerId);
      setActiveTitle(undefined);
      setActiveRequirement(null);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('open-chat', onOpenChat as any);
      return () => window.removeEventListener('open-chat', onOpenChat as any);
    }
  }, [onTabChange]);

  // Restore chat state from localStorage on mount (only if no active conversation is set)
  useEffect(() => {
    if (typeof window !== 'undefined' && !activeConversationId) {
      const stored = localStorage.getItem('buyer_chat_state');
      if (stored) {
        try {
          const chatState = JSON.parse(stored);
          if (chatState.conversationId && chatState.buyerId && chatState.manufacturerId) {
            setActiveConversationId(chatState.conversationId);
            setActiveBuyerId(chatState.buyerId);
            setActiveManufacturerId(chatState.manufacturerId);
            setActiveTitle(chatState.title);
            setActiveRequirement(chatState.requirement || null);
            setActiveAIDesign(chatState.aiDesign || null);
          }
        } catch (error) {
          console.error('Failed to restore chat state:', error);
        }
      }
    }
  }, [activeConversationId]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    openChat: (conversationId: string, buyerId: string, manufacturerId: string, title?: string, requirement?: any) => {
      if (onTabChange) onTabChange();
      setActiveConversationId(conversationId);
      setActiveBuyerId(buyerId);
      setActiveManufacturerId(manufacturerId);
      setActiveTitle(title);
      setActiveRequirement(requirement || null);
    },
    openChatFromQuote: async (quote: any) => {
      try {
        const buyerId = await getBuyerId();
        const manufacturerId = String(quote.id);
        if (!buyerId) {
          if (onTabChange) onTabChange();
          alert('We could not load your buyer profile. Please refresh the page and try again. If the issue persists, please contact support.');
          return;
        }
        if (!manufacturerId) {
          if (onTabChange) onTabChange();
          alert('Unable to determine the manufacturer. Please try again later.');
          return;
        }
        const res = await apiService.ensureConversation(buyerId, manufacturerId);
        const conversationId = res?.data?.conversation?.id;
        if (onTabChange) onTabChange();
        if (conversationId) {
          setActiveConversationId(conversationId);
          setActiveBuyerId(buyerId);
          setActiveManufacturerId(manufacturerId);
          setActiveTitle(undefined);
          setActiveRequirement(null);
        }
      } catch (e) {
        console.error('Failed to open chat from quote', e);
        if (onTabChange) onTabChange();
      }
    },
    openChatFromNegotiation: async (requirement: any, response: any) => {
      const manufacturerIdRaw = response?.manufacturer_id || response?.manufacturer?.id;
      const manufacturerId = manufacturerIdRaw ? String(manufacturerIdRaw) : null;

      if (!manufacturerId) {
        alert('Unable to determine the manufacturer for this response. Please try again later.');
        return;
      }

      try {
        // Get buyerId first before updating status
        const buyerId = await getBuyerId();

        if (!buyerId) {
          if (onTabChange) onTabChange();
          alert('We could not load your buyer profile. Please refresh the page and try again. If the issue persists, please contact support.');
          return;
        }

        // Update response status to 'negotiating' first
        try {
          await apiService.updateRequirementResponseStatus(response.id, 'negotiating');
        } catch (statusError: any) {
          console.error('Failed to update response status:', statusError);
          // Continue with chat opening even if status update fails
        }

        const ensureRes = await apiService.ensureConversation(buyerId, manufacturerId);
        const conversationId = ensureRes?.data?.conversation?.id;

        if (conversationId) {
          const manufacturerIdDisplay = response?.manufacturer?.manufacturer_id;
          const requirementSummary = requirement?.requirement_text;
          const fallbackTitle = requirementSummary
            ? requirementSummary.slice(0, 60) + (requirementSummary.length > 60 ? '...' : '')
            : undefined;

          // Set state first
          setActiveConversationId(conversationId);
          setActiveBuyerId(buyerId);
          setActiveManufacturerId(manufacturerId);
          setActiveTitle(manufacturerIdDisplay || fallbackTitle);
          setActiveRequirement(requirement);
          
          // Manually save to localStorage immediately
          if (typeof window !== 'undefined') {
            const chatState = {
              conversationId,
              buyerId,
              manufacturerId,
              title: manufacturerIdDisplay || fallbackTitle,
              requirement: requirement
            };
            localStorage.setItem('buyer_chat_state', JSON.stringify(chatState));
          }
          
          // Note: Tab switching is handled by the parent component
          // The state is set and saved, so the chat window should open
        } else {
          console.error('Failed to create or get conversation');
          if (onTabChange) onTabChange();
          alert('Failed to create conversation. Please try again.');
        }
      } catch (error: any) {
        console.error('Failed to open chat from negotiation:', error);
        if (onTabChange) onTabChange();
        alert(error.message || 'Failed to open chat. Please try again.');
      }
    },
    openChatFromRequirementAccept: async (requirement: any, response: any) => {
      const manufacturerIdRaw = response?.manufacturer_id || response?.manufacturer?.id;
      const manufacturerId = manufacturerIdRaw ? String(manufacturerIdRaw) : null;

      if (!manufacturerId) {
        alert('Unable to determine the manufacturer for this response. Please try again later.');
        return;
      }

      try {
        // Get buyerId first
        const buyerId = await getBuyerId();

        if (!buyerId) {
          if (onTabChange) onTabChange();
          alert('We could not load your buyer profile. Please refresh the page and try again. If the issue persists, please contact support.');
          return;
        }

        // Note: We don't update the response status here since it's already 'accepted'
        // The status was already updated by handleUpdateResponseStatus before calling this method

        const ensureRes = await apiService.ensureConversation(buyerId, manufacturerId);
        const conversationId = ensureRes?.data?.conversation?.id;

        if (conversationId) {
          const manufacturerIdDisplay = response?.manufacturer?.manufacturer_id;
          const requirementSummary = requirement?.requirement_text;
          const fallbackTitle = requirementSummary
            ? requirementSummary.slice(0, 60) + (requirementSummary.length > 60 ? '...' : '')
            : undefined;

          // Set state first
          setActiveConversationId(conversationId);
          setActiveBuyerId(buyerId);
          setActiveManufacturerId(manufacturerId);
          setActiveTitle(manufacturerIdDisplay || fallbackTitle);
          setActiveRequirement(requirement);
          setActiveAIDesign(null); // Clear AI design when opening requirement chat
          
          // Manually save to localStorage immediately
          if (typeof window !== 'undefined') {
            const chatState = {
              conversationId,
              buyerId,
              manufacturerId,
              title: manufacturerIdDisplay || fallbackTitle,
              requirement: requirement
            };
            localStorage.setItem('buyer_chat_state', JSON.stringify(chatState));
          }
          
          // The state is set and saved, so the chat window should open with Requirements tab
        } else {
          console.error('Failed to create or get conversation');
          if (onTabChange) onTabChange();
          alert('Failed to create conversation. Please try again.');
        }
      } catch (error: any) {
        console.error('Failed to open chat from requirement accept:', error);
        if (onTabChange) onTabChange();
        alert(error.message || 'Failed to open chat. Please try again.');
      }
    },
    openChatFromAIDesignAccept: async (aiDesign: any, response: any) => {
      const manufacturerIdRaw = response?.manufacturer_id || response?.manufacturer?.id;
      const manufacturerId = manufacturerIdRaw ? String(manufacturerIdRaw) : null;

      if (!manufacturerId) {
        alert('Unable to determine the manufacturer for this response. Please try again later.');
        return;
      }

      try {
        const buyerId = await getBuyerId();

        if (!buyerId) {
          if (onTabChange) onTabChange();
          alert('We could not load your buyer profile. Please refresh the page and try again. If the issue persists, please contact support.');
          return;
        }

        const ensureRes = await apiService.ensureConversation(buyerId, manufacturerId);
        const conversationId = ensureRes?.data?.conversation?.id;

        if (conversationId) {
          const manufacturerIdDisplay = response?.manufacturer?.manufacturer_id;
          const designSummary = aiDesign?.apparel_type || aiDesign?.design_no;
          const fallbackTitle = designSummary
            ? designSummary.slice(0, 60) + (designSummary.length > 60 ? '...' : '')
            : undefined;

          // Set state first
          setActiveConversationId(conversationId);
          setActiveBuyerId(buyerId);
          setActiveManufacturerId(manufacturerId);
          setActiveTitle(manufacturerIdDisplay || fallbackTitle);
          setActiveAIDesign(aiDesign);
          setActiveRequirement(null); // Clear requirement when opening AI design chat
          
          // Manually save to localStorage immediately
          if (typeof window !== 'undefined') {
            const chatState = {
              conversationId,
              buyerId,
              manufacturerId,
              title: manufacturerIdDisplay || fallbackTitle,
              aiDesign
            };
            localStorage.setItem('buyer_chat_state', JSON.stringify(chatState));
          }

          // The state is set and saved, so the chat window should open
        } else {
          console.error('Failed to create or get conversation');
          if (onTabChange) onTabChange();
          alert('Failed to create conversation. Please try again.');
        }
      } catch (error: any) {
        console.error('Failed to open chat from AI design accept:', error);
        if (onTabChange) onTabChange();
        alert(error.message || 'Failed to open chat. Please try again.');
      }
    }
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Chat Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-0">
        {/* Conversations Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 h-[300px] lg:h-[calc(100vh-280px)] min-h-[400px] bg-white border border-[#22a2f2]/30 rounded-xl shadow-sm">
          <ChatList 
            selectedConversationId={activeConversationId}
            selfRole="buyer"
            conversationUnreadCounts={conversationUnreadCounts}
            onClearConversationUnread={onClearConversationUnread}
            onOpenConversation={(cid, bid, mid, title) => {
              setActiveConversationId(cid);
              setActiveBuyerId(bid);
              setActiveManufacturerId(mid);
              setActiveTitle(title);
              setActiveRequirement(null); // Clear requirement - show all messages with all tabs
              setActiveAIDesign(null); // Clear AI design - show all messages with all tabs
            }} 
          />
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-8 xl:col-span-9 h-[500px] lg:h-[calc(100vh-280px)] min-h-[400px]">
          {activeConversationId && activeBuyerId && activeManufacturerId ? (
            <ChatWindow
              conversationId={activeConversationId}
              buyerId={activeBuyerId}
              manufacturerId={activeManufacturerId}
              title={activeTitle}
              inline
              selfRole={'buyer'}
              requirement={activeRequirement}
              aiDesign={activeAIDesign}
              onClose={() => {
                setActiveConversationId(null);
                setActiveBuyerId(null);
                setActiveManufacturerId(null);
                setActiveTitle(undefined);
                setActiveRequirement(null);
                setActiveAIDesign(null);
                // Clear localStorage when closing chat
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('buyer_chat_state');
                }
              }}
            />
          ) : (
            <div className="h-full bg-white rounded-xl border border-[#22a2f2]/30 flex items-center justify-center p-6 shadow-sm">
              <div className="text-center max-w-sm">
                <div className="relative mx-auto mb-6 w-20 h-20">
                  <div className="absolute inset-0 bg-[#22a2f2]/25 rounded-full blur-xl opacity-60"></div>
                  <div className="relative bg-[#22a2f2]/10 rounded-full flex items-center justify-center w-full h-full border border-[#22a2f2]/30">
                    <svg className="w-10 h-10 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">Select a conversation</h3>
                <p className="text-sm text-gray-500">Choose a manufacturer from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatsTab.displayName = 'ChatsTab';

export default ChatsTab;

