'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import apiService, { getApiBaseOrigin } from '../../lib/apiService';

interface ChatWindowProps {
  conversationId: string;
  buyerId: string;
  manufacturerId: string;
  onClose?: () => void;
  title?: string;
  inline?: boolean;
  selfRole?: 'buyer' | 'manufacturer';
}

interface ChatMessage {
  id?: string;
  client_temp_id?: string;
  conversation_id: string;
  sender_role: 'buyer' | 'manufacturer';
  sender_id: string;
  body: string;
  created_at?: string;
  is_read?: boolean;
}

export default function ChatWindow({ conversationId, buyerId, manufacturerId, onClose, title, inline, selfRole = 'buyer' }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const token = useMemo(() => apiService.getToken(), []);
  const wsUrl = useMemo(() => process.env.NEXT_PUBLIC_WS_URL || getApiBaseOrigin(), []);
  const wsPath = useMemo(() => process.env.NEXT_PUBLIC_WS_PATH || '/socket.io', []);

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      try {
        const res = await apiService.listMessages(conversationId, { limit: 50 });
        if (!mounted) return;
        setMessages(res.data.messages || []);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadInitial();

    return () => {
      mounted = false;
    };
  }, [conversationId]);

  useEffect(() => {
    if (!token || !wsUrl) return;
    const socket = io(wsUrl, { path: wsPath, auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      // no-op
    });

    socket.on('message:new', ({ message }) => {
      if (message.conversation_id !== conversationId) return;
      setMessages((prev) => {
        // Replace optimistic by client_temp_id if present
        if (message.client_temp_id) {
          const idx = prev.findIndex(m => m.client_temp_id === message.client_temp_id);
          if (idx !== -1) {
            const clone = prev.slice();
            clone[idx] = message;
            return clone;
          }
        }
        return [...prev, message];
      });
      scrollToBottom();
    });

    socket.on('typing', ({ conversationId: cid, isTyping: typing }) => {
      if (cid !== conversationId) return;
      // Disable typing indicator UI entirely
      setPeerTyping(false);
    });

    socket.on('message:read', ({ conversationId: cid }) => {
      if (cid !== conversationId) return;
      // could update local read flags if desired
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, wsUrl, wsPath, conversationId]);

  // Reset typing indicator when switching conversations
  useEffect(() => {
    setPeerTyping(false);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, [conversationId]);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const body = input.trim();
    const clientTempId = crypto.randomUUID();
    setSending(true);
    setInput('');

    // optimistic append
    const optimistic: ChatMessage = {
      client_temp_id: clientTempId,
      conversation_id: conversationId,
      sender_role: 'buyer', // actual role will be set on server; optimistic is fine for UI
      sender_id: 'me',
      body,
      created_at: new Date().toISOString(),
      is_read: false
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    try {
      // Prefer WebSocket
      if (socketRef.current?.connected) {
        socketRef.current.emit('message:send', { conversationId, body, clientTempId });
      } else {
        // fallback to REST
        await apiService.sendMessage(conversationId, { body, clientTempId });
      }
    } catch (err) {
      console.error('Send failed', err);
    } finally {
      setSending(false);
    }
  };

  // Typing indicator disabled

  const containerClass = inline
    ? 'h-full bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shadow-sm'
    : 'fixed bottom-4 right-4 w-96 max-w-[95vw] bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden z-50';

  const headerClass = inline
    ? 'flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50'
    : 'flex items-center justify-between px-4 py-3 border-b border-gray-200';

  const titleClass = inline ? 'font-semibold text-black' : 'font-semibold text-gray-900';
  const closeClass = inline ? 'text-gray-500 hover:text-black' : 'text-gray-500 hover:text-gray-700';
  const listClass = inline ? 'flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50' : 'flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50';

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <div className={titleClass}>{title || 'Chat'}</div>
        <button onClick={onClose} className={closeClass}>✕</button>
      </div>

      <div ref={listRef} className={listClass}>
        {loading && <div className={inline ? 'text-sm text-gray-400' : 'text-sm text-gray-500'}>Loading...</div>}
        {!loading && messages.map((m) => {
          const isSelf = m.sender_role === selfRole;
          const bubbleClass = isSelf
            ? 'ml-auto bg-black text-white'
            : (inline ? 'mr-auto bg-gray-200 text-gray-900' : 'mr-auto bg-white border border-gray-200 text-gray-900');
          return (
            <div key={m.id || m.client_temp_id} className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${bubbleClass}`}>
            {m.body}
            </div>
          );
        })}
        {/* Typing indicator disabled */}
      </div>

      <div className={inline ? 'p-3 border-t border-gray-200 bg-white' : 'p-3 border-t border-gray-200'}>
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Type a message"
            className={inline
              ? 'flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black'
              : 'flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'}
          />
          <button onClick={handleSend} disabled={sending || !input.trim()} className={inline ? 'px-3 py-2 bg-black hover:bg-gray-900 disabled:opacity-50 text-white rounded-lg text-sm' : 'px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm'}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}


