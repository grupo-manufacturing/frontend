'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import apiService, { getApiBaseOrigin } from '../../lib/apiService';

interface ChatListProps {
  onOpenConversation: (conversationId: string, buyerId: string, manufacturerId: string, title?: string) => void;
  selectedConversationId?: string | null;
  selfRole?: 'buyer' | 'manufacturer';
  conversationUnreadCounts?: Record<string, number>;
  onClearConversationUnread?: (conversationId: string) => void;
}

export default function ChatList({
  onOpenConversation,
  selectedConversationId,
  selfRole = 'buyer',
  conversationUnreadCounts = {},
  onClearConversationUnread
}: ChatListProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  // Track unread message counts per conversation
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  // Use ref to track selected conversation without causing socket reconnection
  const selectedConversationIdRef = useRef<string | null>(selectedConversationId || null);
  
  // Get token and WS URL (same pattern as ChatWindow)
  const token = useMemo(() => apiService.getToken(), []);
  const wsUrl = useMemo(() => process.env.NEXT_PUBLIC_WS_URL || getApiBaseOrigin(), []);
  const wsPath = useMemo(() => process.env.NEXT_PUBLIC_WS_PATH || '/socket.io', []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.listConversations({ limit: 50 });
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

  // Update title when conversations load and there's a selected conversation
  // This ensures the title is updated from the backend data (which includes buyer_identifier)
  // rather than using stale data from localStorage
  useEffect(() => {
    if (selectedConversationId && items.length > 0 && !loading) {
      const selectedConversation = items.find(c => c.id === selectedConversationId);
      if (selectedConversation) {
        const title = selectedConversation?.peer?.displayName || 'Conversation';
        onOpenConversation(
          selectedConversation.id,
          selectedConversation.buyer_id,
          selectedConversation.manufacturer_id,
          title
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedConversationId, loading]);

  // Use ref to store the latest loadConversations function
  const loadConversationsRef = useRef(loadConversations);
  useEffect(() => {
    loadConversationsRef.current = loadConversations;
  }, [loadConversations]);

  // Keep selectedConversationIdRef in sync
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId || null;
  }, [selectedConversationId]);

  // Socket connection for real-time updates (same pattern as ChatWindow)
  useEffect(() => {
    if (!token || !wsUrl) return;

    const socket = io(wsUrl, { path: wsPath, auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for new messages to update conversation list
    socket.on('message:new', ({ message }) => {
      if (!message || !message.conversation_id) {
        return;
      }

      const conversationId = message.conversation_id;
      const currentSelectedId = selectedConversationIdRef.current;
      
      // Increment unread count if this conversation is not currently selected
      if (conversationId !== currentSelectedId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1
        }));
      }

      setItems((prevItems) => {
        // Find if conversation exists
        const existingIndex = prevItems.findIndex((item) => item.id === conversationId);
        
        if (existingIndex !== -1) {
          // Update existing conversation
          const updatedItems = [...prevItems];
          const messageText = message.body || (message.attachments && message.attachments.length > 0 ? '[Attachment]' : '');
          const messageTime = message.created_at || new Date().toISOString();
          
          const updatedConversation = {
            ...updatedItems[existingIndex],
            last_message_at: messageTime,
            last_message_text: messageText,
          };

          updatedItems[existingIndex] = updatedConversation;
          
          // Move to top (sort by last_message_at)
          return updatedItems.sort((a, b) => {
            const dateA = new Date(a.last_message_at || 0).getTime();
            const dateB = new Date(b.last_message_at || 0).getTime();
            return dateB - dateA;
          });
        } else {
          // New conversation - reload to fetch it with peer info
          setTimeout(() => loadConversationsRef.current(), 100);
          return prevItems;
        }
      });
    });

    // Listen for message:read events to clear unread counts
    socket.on('message:read', ({ conversationId }) => {
      const currentSelectedId = selectedConversationIdRef.current;
      if (conversationId && conversationId === currentSelectedId) {
        setUnreadCounts((prev) => {
          const updated = { ...prev };
          delete updated[conversationId];
          return updated;
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, wsUrl, wsPath]);

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
          const unreadCount = conversationUnreadCounts[c.id] || unreadCounts[c.id] || 0;
          
          return (
            <button 
              key={c.id} 
              onClick={() => {
                // Clear unread count when conversation is opened
                if (unreadCount > 0) {
                  // Clear local tracking
                  setUnreadCounts((prev) => {
                    const updated = { ...prev };
                    delete updated[c.id];
                    return updated;
                  });
                  // Clear parent (portal) tracking
                  if (onClearConversationUnread) {
                    onClearConversationUnread(c.id);
                  }
                }
                onOpenConversation(c.id, c.buyer_id, c.manufacturer_id, title);
              }} 
              className={`w-full text-left px-4 py-3 transition-all border-l-2 ${
                isActive 
                  ? 'bg-gray-100 border-black' 
                  : 'border-transparent hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm font-medium truncate ${
                      isActive ? 'text-black' : 'text-gray-800'
                    }`}>
                      {title}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                    {timeAgo && (
                        <span className="text-xs text-gray-500">{timeAgo}</span>
                    )}
                      {unreadCount > 0 && !isActive && (
                        <span className="inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[#22a2f2] text-white text-[10px] font-semibold px-1">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
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


