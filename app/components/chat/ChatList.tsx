'use client';

import { useEffect, useState } from 'react';
import apiService from '../../lib/apiService';
import { useSocket } from '../../hooks/useSocket';

interface ChatListProps {
  onOpenConversation: (conversationId: string, buyerId: string, manufacturerId: string, title?: string) => void;
  selectedConversationId?: string | null;
}

export default function ChatList({ onOpenConversation, selectedConversationId }: ChatListProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time socket connection
  const { isConnected, on, off } = useSocket({
    onConnect: () => console.log('[ChatList] Socket connected'),
    onDisconnect: () => console.log('[ChatList] Socket disconnected'),
  });

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ChatList] Loading conversations...');
      const res = await apiService.listConversations({ limit: 50 });
      console.log('[ChatList] Loaded conversations:', res.data.conversations?.length || 0);
      setItems(res.data.conversations || []);
    } catch (err: any) {
      console.error('[ChatList] Failed to load conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for real-time message updates
  useEffect(() => {
    if (!isConnected) return;

    const handleNewMessage = (data: any) => {
      console.log('[ChatList] Received new message:', data);
      const { conversationSummary } = data;
      
      if (conversationSummary) {
        setItems((prevItems) => {
          // Find if conversation exists
          const existingIndex = prevItems.findIndex((item) => item.id === conversationSummary.id);
          
          if (existingIndex !== -1) {
            // Update existing conversation
            const updatedItems = [...prevItems];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              last_message_at: conversationSummary.last_message_at,
              last_message_text: conversationSummary.last_message_text,
              is_archived: conversationSummary.is_archived,
            };
            
            // Move to top (sort by last_message_at)
            return updatedItems.sort((a, b) => {
              const dateA = new Date(a.last_message_at || 0).getTime();
              const dateB = new Date(b.last_message_at || 0).getTime();
              return dateB - dateA;
            });
          } else {
            // New conversation - reload to fetch it with peer info
            setTimeout(() => loadConversations(), 100);
            return prevItems;
          }
        });
      }
    };

    on('message:new', handleNewMessage);

    return () => {
      off('message:new', handleNewMessage);
    };
  }, [isConnected, on, off]);

  // Helper to format relative time
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 text-sm">Conversations</h3>
          {isConnected && (
            <div className="flex items-center gap-1" title="Real-time updates active">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 hidden sm:inline">Live</span>
            </div>
          )}
        </div>
        <button 
          onClick={loadConversations}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
          title="Refresh conversations"
        >
          <svg className="w-4 h-4 text-gray-500 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
              <p className="text-xs text-gray-500">Loading conversations...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-600">Failed to load</p>
                <p className="text-xs text-red-500 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {!loading && !error && items.length === 0 && (
          <div className="flex items-center justify-center py-12 px-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 font-medium">No conversations yet</p>
              <p className="text-xs text-gray-500 mt-1">Start a conversation to get started</p>
            </div>
          </div>
        )}
        
        {!error && items.map((c) => {
          const title = c?.peer?.displayName || 'Conversation';
          const lastMessageTrimmed = typeof c.last_message_text === 'string' ? c.last_message_text.trim() : '';
          const lastMessage = lastMessageTrimmed
            ? lastMessageTrimmed
            : (c.last_message_at ? '[Attachment]' : 'No messages yet');
          const timeAgo = formatTime(c.last_message_at);
          const isActive = selectedConversationId === c.id;
          
          return (
            <button 
              key={c.id} 
              onClick={() => onOpenConversation(c.id, c.buyer_id, c.manufacturer_id, title)} 
              className={`w-full text-left px-4 py-3 transition-all border-l-2 ${
                isActive 
                  ? 'bg-gray-100 border-black' 
                  : 'border-transparent hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <span className={`text-sm font-semibold ${
                    isActive ? 'text-white' : 'text-gray-600'
                  }`}>
                    {title.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm font-medium truncate ${
                      isActive ? 'text-black' : 'text-gray-800'
                    }`}>
                      {title}
                    </h4>
                    {timeAgo && (
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{timeAgo}</span>
                    )}
                  </div>
                  <p className={`text-xs truncate ${
                    isActive ? 'text-gray-600' : 'text-gray-500'
                  }`}>
                    {lastMessage}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


