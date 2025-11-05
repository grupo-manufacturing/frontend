'use client';

import { useEffect, useState } from 'react';
import apiService from '../../lib/apiService';

interface ChatListProps {
  onOpenConversation: (conversationId: string, buyerId: string, manufacturerId: string, title?: string) => void;
}

export default function ChatList({ onOpenConversation }: ChatListProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await apiService.listConversations({ limit: 50 });
        if (!mounted) return;
        setItems(res.data.conversations || []);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 font-semibold text-white">Conversations</div>
      <div className="divide-y divide-white/10">
        {loading && <div className="p-4 text-sm text-gray-400">Loading...</div>}
        {!loading && items.length === 0 && <div className="p-4 text-sm text-gray-400">No conversations yet.</div>}
        {items.map((c) => {
          const title = c?.peer?.displayName || 'Conversation';
          const last = c.last_message_at ? new Date(c.last_message_at).toLocaleString() : '';
          return (
            <button key={c.id} onClick={() => onOpenConversation(c.id, c.buyer_id, c.manufacturer_id, title)} className="w-full text-left p-4 hover:bg-slate-800">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white">{title}</div>
                <div className="text-xs text-gray-400">{last}</div>
              </div>
              <div className="mt-1 text-sm text-gray-400 line-clamp-1">{c.last_message_text || 'No messages yet'}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


