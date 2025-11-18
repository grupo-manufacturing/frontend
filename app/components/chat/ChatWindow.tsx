'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import apiService, { getApiBaseOrigin } from '../../lib/apiService';
import MessageAttachment from './MessageAttachment';

interface ChatWindowProps {
  conversationId: string;
  buyerId: string;
  manufacturerId: string;
  onClose?: () => void;
  title?: string;
  inline?: boolean;
  selfRole?: 'buyer' | 'manufacturer';
  onConversationRead?: (conversationId: string) => void;
  requirement?: any | null;
}

interface Attachment {
  id?: string;
  file_url: string;
  file_type?: string;
  mime_type?: string;
  original_name?: string;
  thumbnail_url?: string;
  size_bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
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
  attachments?: Attachment[];
}

export default function ChatWindow({
  conversationId,
  buyerId,
  manufacturerId,
  onClose,
  title,
  inline,
  selfRole = 'buyer',
  onConversationRead,
  requirement
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const token = useMemo(() => apiService.getToken(), []);
  const wsUrl = useMemo(() => process.env.NEXT_PUBLIC_WS_URL || getApiBaseOrigin(), []);
  const wsPath = useMemo(() => process.env.NEXT_PUBLIC_WS_PATH || '/socket.io', []);

  const markConversationRead = useCallback(
    async (latestMessageId?: string) => {
      try {
        await apiService.markRead(conversationId, latestMessageId ? { upToMessageId: latestMessageId } : {});
        onConversationRead?.(conversationId);
      } catch (err) {
        console.error('[ChatWindow] Failed to mark conversation read:', err);
      }
    },
    [conversationId, onConversationRead]
  );

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      try {
        const res = await apiService.listMessages(conversationId, { limit: 50 });
        if (!mounted) return;
        const loadedMessages = res.data.messages || [];
        setMessages(loadedMessages);
        const lastMessage = loadedMessages.length ? loadedMessages[loadedMessages.length - 1] : null;
        await markConversationRead(lastMessage?.id);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadInitial();

    return () => {
      mounted = false;
    };
  }, [conversationId, markConversationRead]);

  useEffect(() => {
    if (!token || !wsUrl) return;
    const socket = io(wsUrl, { path: wsPath, auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      // no-op
    });

    socket.on('message:new', async ({ message }) => {
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
      if (message.sender_role !== selfRole) {
        await markConversationRead(message.id);
      }
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
  }, [token, wsUrl, wsPath, conversationId, selfRole, markConversationRead]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const hasText = input.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;

    if ((!hasText && !hasFiles) || sending) return;

    const body = input.trim();
    const clientTempId = crypto.randomUUID();
    setSending(true);
    setInput('');

    let uploadedAttachments: any[] = [];

    try {
      // Upload files if any
      if (hasFiles) {
        setUploadingFiles(true);
        const uploadPromises = selectedFiles.map(file => 
          apiService.uploadChatFile(file, conversationId)
        );
        const uploadResults = await Promise.all(uploadPromises);
        uploadedAttachments = uploadResults.map(result => result.data);
        setSelectedFiles([]);
        setUploadingFiles(false);
      }

      // optimistic append
      const optimistic: ChatMessage = {
        client_temp_id: clientTempId,
        conversation_id: conversationId,
        sender_role: selfRole,
        sender_id: 'me',
        body,
        created_at: new Date().toISOString(),
        is_read: false,
        attachments: uploadedAttachments
      };
      setMessages((prev) => [...prev, optimistic]);
      scrollToBottom();

      // Prefer WebSocket
      if (socketRef.current?.connected) {
        socketRef.current.emit('message:send', { 
          conversationId, 
          body, 
          clientTempId,
          attachments: uploadedAttachments
        });
      } else {
        // fallback to REST
        await apiService.sendMessage(conversationId, { 
          body, 
          clientTempId,
          attachments: uploadedAttachments
        });
      }
    } catch (err) {
      console.error('Send failed', err);
      setUploadingFiles(false);
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

  function formatDateLabel(date: Date) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    const formatter = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });

    return formatter.format(date);
  }

  const timelineItems = useMemo(() => {
    const items: Array<
      | { type: 'date'; id: string; label: string }
      | { type: 'message'; id: string; data: ChatMessage; timestamp: Date }
    > = [];

    let lastDateKey: string | null = null;

    for (const message of messages) {
      const timestamp = message.created_at ? new Date(message.created_at) : new Date();
      const dateKey = timestamp.toDateString();

      if (dateKey !== lastDateKey) {
        items.push({
          type: 'date',
          id: `date-${dateKey}`,
          label: formatDateLabel(timestamp)
        });
        lastDateKey = dateKey;
      }

      items.push({
        type: 'message',
        id: message.id || message.client_temp_id || `${timestamp.getTime()}`,
        data: message,
        timestamp
      });
    }

    return items;
  }, [messages]);

  const whatsappHref = useMemo(() => 'https://wa.me/917671062042', []);

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <div className={titleClass}>{title || 'Chat'}</div>
        <button onClick={onClose} className={closeClass}>✕</button>
      </div>

      {/* Requirement Details Section */}
      {requirement && (
        <div className="border-b border-gray-200 bg-gradient-to-r from-[#22a2f2]/5 to-blue-50/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-lg bg-[#22a2f2]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#22a2f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900">Requirement Details</h3>
                <span className="text-xs text-gray-500">
                  {requirement.created_at && new Date(requirement.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2 leading-relaxed">{requirement.requirement_text}</p>
              <div className="flex flex-wrap gap-3 text-xs">
                {requirement.quantity && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Quantity:</span>
                    <span className="font-semibold text-gray-900">{requirement.quantity.toLocaleString()}</span>
                  </div>
                )}
                {requirement.brand_name && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Brand:</span>
                    <span className="font-semibold text-gray-900">{requirement.brand_name}</span>
                  </div>
                )}
                {requirement.product_type && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-semibold text-gray-900 capitalize">{requirement.product_type}</span>
                  </div>
                )}
                {requirement.product_link && (
                  <a 
                    href={requirement.product_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#22a2f2] hover:underline flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Reference
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={listRef} className={listClass}>
        {loading && <div className={inline ? 'text-sm text-gray-400' : 'text-sm text-gray-500'}>Loading...</div>}
        {!loading && timelineItems.map((item) => {
          if (item.type === 'date') {
            return (
              <div key={item.id} className="flex justify-center my-3">
                <span className="text-xs font-medium text-gray-500 bg-white/70 backdrop-blur border border-gray-200 rounded-full px-3 py-1 shadow-sm">
                  {item.label}
                </span>
              </div>
            );
          }

          const message = item.data;
          const isSelf = message.sender_role === selfRole;
          const wrapperClass = isSelf ? 'flex justify-end' : 'flex justify-start';
          const bubbleTone = isSelf
            ? 'bg-[#22a2f2] text-white shadow-[#22a2f2]/20'
            : (inline
                ? 'bg-gray-100 text-gray-900 border border-[#22a2f2]/10 shadow-sm'
                : 'bg-white text-gray-900 border border-[#22a2f2]/20 shadow-sm');

          return (
            <div key={item.id} className={wrapperClass}>
              <div
                className={`inline-flex max-w-[80%] w-fit flex-col gap-2 whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm shadow-sm ${bubbleTone}`}
              >
                {message.attachments && message.attachments.length > 0 && (
                  <div className="space-y-2">
                    {message.attachments.map((att, idx) => (
                      <MessageAttachment key={att.id || idx} attachment={att} />
                    ))}
                  </div>
                )}
                {message.body && <div>{message.body}</div>}
              </div>
            </div>
          );
        })}
        {/* Typing indicator disabled */}
      </div>

      <div className={inline ? 'p-3 border-t border-gray-200 bg-white' : 'p-3 border-t border-gray-200'}>
        {/* File preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-xs text-gray-800 shadow-sm"
              >
                <span className="truncate max-w-[160px] font-medium text-gray-900">{file.name}</span>
                <span className="text-[11px] text-gray-500">
                  {(file.size / 1024).toFixed(0)}KB
                </span>
                <button
                  onClick={() => removeSelectedFile(idx)}
                  className="ml-1 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-200 hover:text-red-600"
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* File upload button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploadingFiles}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 rounded-lg hover:bg-gray-100"
            title="Attach file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={uploadingFiles ? "Uploading..." : "Type a message"}
            disabled={uploadingFiles}
            className={inline
              ? 'flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50'
              : 'flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'}
          />
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[#25D366] hover:text-[#1ebe5d] rounded-lg hover:bg-[#25D366]/10 transition-colors"
            aria-label="Continue chat on WhatsApp"
            title="Open WhatsApp chat"
          >
            <svg className="w-6 h-6" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
              <path d="M27.54 4.46A15.88 15.88 0 0016 0a15.9 15.9 0 00-13.5 24.47L0 32l7.74-2.46A15.9 15.9 0 0016 32h.01c8.82 0 15.99-7.17 15.99-16a15.87 15.87 0 00-4.46-11.54zm-11.53 24.5h-.01a13.3 13.3 0 01-6.79-1.86l-.49-.29-4.6 1.47 1.5-4.47-.32-.52A13.31 13.31 0 012.67 16 13.34 13.34 0 0127.33 16c0 7.35-5.98 12.96-11.32 12.96zm7.48-9.72c-.41-.2-2.42-1.19-2.79-1.33-.37-.14-.64-.2-.9.2-.27.41-1.03 1.33-1.26 1.6-.23.27-.46.3-.86.1-.41-.2-1.73-.64-3.3-2.03-1.22-1.09-2.04-2.43-2.27-2.84-.23-.41-.02-.63.18-.83.18-.18.41-.47.61-.7.2-.23.27-.41.41-.68.14-.27.07-.5-.03-.7-.1-.2-.9-2.17-1.23-2.97-.32-.77-.65-.67-.9-.68h-.77c-.27 0-.7.1-1.06.5-.36.41-1.4 1.37-1.4 3.34 0 1.97 1.44 3.87 1.64 4.14.2.27 2.84 4.33 6.88 6.07.96.41 1.7.66 2.28.84.96.31 1.83.27 2.52.16.77-.12 2.42-.99 2.76-1.95.34-.96.34-1.78.23-1.95-.11-.18-.37-.28-.79-.49z" />
            </svg>
          </a>
          <button 
            onClick={handleSend} 
            disabled={sending || uploadingFiles || (!input.trim() && selectedFiles.length === 0)} 
            className='px-3 py-2 bg-[#22a2f2] hover:bg-[#1b8bd0] disabled:opacity-50 text-white rounded-lg text-sm shadow-sm transition-colors'
          >
            {uploadingFiles ? 'Uploading...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}


