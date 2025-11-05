'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

export default function ChatDock() {
  const pathname = usePathname();
  const isPortal = pathname?.startsWith('/buyer-portal') || pathname?.startsWith('/manufacturer-portal');
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<{ id: string; buyerId: string; manufacturerId: string } | null>(null);

  if (!isPortal) return null;

  return (
    <>
      <button
        onClick={() => setOpen((s) => !s)}
        className="fixed bottom-4 left-4 z-40 bg-white border border-gray-200 shadow-lg rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        {open ? 'Close Chats' : 'Chats'}
      </button>

      {open && (
        <div className="fixed bottom-16 left-4 w-80 max-w-[90vw] z-40">
          <ChatList
            onOpenConversation={(cid, bid, mid) => {
              setConversation({ id: cid, buyerId: bid, manufacturerId: mid });
              setOpen(false);
            }}
          />
        </div>
      )}

      {conversation && (
        <ChatWindow
          conversationId={conversation.id}
          buyerId={conversation.buyerId}
          manufacturerId={conversation.manufacturerId}
          onClose={() => setConversation(null)}
        />
      )}
    </>
  );
}


