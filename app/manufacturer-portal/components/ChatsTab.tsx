'use client';

import { useState, useEffect } from 'react';
import ChatList from '../../components/chat/ChatList';
import ChatWindow from '../../components/chat/ChatWindow';

type TabType = 'chats' | 'requirements' | 'ai-requirements' | 'analytics' | 'profile';

interface ChatsTabProps {
  onUnreadCountChange: (count: number) => void;
  activeTab: TabType;
  onActiveTabChange?: (tab: TabType) => void;
}

// Type guard to ensure tab is valid
const isValidTab = (tab: string): tab is TabType => {
  return ['chats', 'requirements', 'ai-requirements', 'analytics', 'profile'].includes(tab);
};

export default function ChatsTab({ onUnreadCountChange, activeTab, onActiveTabChange }: ChatsTabProps) {
  // Chat state (chats inbox)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeBuyerId, setActiveBuyerId] = useState<string | null>(null);
  const [activeManufacturerId, setActiveManufacturerId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | undefined>(undefined);
  const [chatUnreadClearSignal, setChatUnreadClearSignal] = useState<{ conversationId: string; at: number } | null>(null);

  // Restore chat state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedChatState = localStorage.getItem('manufacturer_chat_state');
      if (storedChatState) {
        try {
          const chatState = JSON.parse(storedChatState);
          if (chatState.conversationId && chatState.buyerId && chatState.manufacturerId) {
            setActiveConversationId(chatState.conversationId);
            setActiveBuyerId(chatState.buyerId);
            setActiveManufacturerId(chatState.manufacturerId);
            setActiveTitle(chatState.title || undefined);
            if (chatState.activeTab && onActiveTabChange) {
              // Convert old 'all-requirements' tab to 'requirements' for backward compatibility
              let tab = chatState.activeTab === 'all-requirements' ? 'requirements' : chatState.activeTab;
              // Filter out invalid tabs (like 'my-designs' which was removed)
              if (!isValidTab(tab)) {
                tab = 'chats'; // Default to chats if invalid tab
              }
              onActiveTabChange(tab);
            } else if (chatState.conversationId && onActiveTabChange) {
              onActiveTabChange('chats');
            }
          }
        } catch (e) {
          console.error('Failed to restore chat state:', e);
        }
      }
    }
  }, [onActiveTabChange]);

  // Persist chat state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeConversationId && activeBuyerId && activeManufacturerId) {
        const chatState = {
          conversationId: activeConversationId,
          buyerId: activeBuyerId,
          manufacturerId: activeManufacturerId,
          title: activeTitle,
          activeTab: activeTab
        };
        localStorage.setItem('manufacturer_chat_state', JSON.stringify(chatState));
      } else {
        localStorage.removeItem('manufacturer_chat_state');
      }
    }
  }, [activeConversationId, activeBuyerId, activeManufacturerId, activeTitle, activeTab]);

  const handleOpenConversation = (cid: string, bid: string, mid: string, title?: string) => {
    setActiveConversationId(cid);
    setActiveBuyerId(bid);
    setActiveManufacturerId(mid);
    setActiveTitle(title);
    setChatUnreadClearSignal({ conversationId: cid, at: Date.now() });
  };

  const handleCloseConversation = () => {
    setActiveConversationId(null);
    setActiveBuyerId(null);
    setActiveManufacturerId(null);
    setActiveTitle(undefined);
    // Clear localStorage when closing chat
    if (typeof window !== 'undefined') {
      localStorage.removeItem('manufacturer_chat_state');
    }
  };

  const handleConversationRead = (cid: string) => {
    setChatUnreadClearSignal({ conversationId: cid, at: Date.now() });
  };

  return (
    <div className="animate-fade-in-up h-full flex flex-col">
      {/* Chat Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-0">
        {/* Conversations Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 h-[300px] lg:h-[calc(100vh-280px)] min-h-[400px] bg-white border border-[#22a2f2]/30 rounded-xl shadow-sm">
          <ChatList 
            selectedConversationId={activeConversationId}
            onUnreadCountChange={onUnreadCountChange}
            selfRole="manufacturer"
            clearUnreadSignal={chatUnreadClearSignal}
            onOpenConversation={handleOpenConversation} 
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
              selfRole={'manufacturer'}
              onConversationRead={handleConversationRead}
              onClose={handleCloseConversation}
            />
          ) : (
            <div className="h-full bg-white rounded-xl border border-[#22a2f2]/30 flex items-center justify-center p-6 shadow-sm">
              <div className="text-center max-w-sm">
                <div className="relative mx-auto mb-6 w-20 h-20">
                  <div className="absolute inset-0 bg-[#22a2f2]/25 rounded-full blur-xl opacity-60"></div>
                  <div className="relative bg-[#22a2f2]/10 rounded-full flex items-center justify-center w-full h-full border border-[#22a2f2]/30">
                    <svg className="w-10 h-10 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">Select a requirement</h3>
                <p className="text-sm text-gray-500">Choose a conversation from the list to view and respond</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

