// ============================================================
// HEBLI – Reusable Live Chat Panel
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { getConversation, addChatMessage } from '@/utils/store';
import { useApp } from '@/contexts/AppContext';
import type { ChatMessage } from '@/types';

interface ChatPanelProps {
  conversationId: string;
  senderName: string;
  senderRole: string;
  placeholder?: string;
  emptyText?: string;
  heightClass?: string;
}

export default function ChatPanel({
  conversationId,
  senderName,
  senderRole,
  placeholder = 'Type a message...',
  emptyText = 'No messages yet. Say hello!',
  heightClass = 'h-[400px]',
}: ChatPanelProps) {
  const { syncTick } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setMessages(getConversation(conversationId));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 1500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, syncTick]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    addChatMessage({
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      conversationId,
      senderName,
      senderRole,
      text: input.trim(),
      timestamp: new Date().toISOString(),
    });
    setInput('');
    load();
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        ref={scrollRef}
        className={`${heightClass} overflow-y-auto space-y-3 pr-1 mb-3`}
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-white/20 text-sm">
            {emptyText}
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.senderName === senderName && m.senderRole === senderRole;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
                  isMine
                    ? 'bg-[#D4AF37] text-black'
                    : 'bg-white/[0.05] text-white/90'
                }`}>
                  {!isMine && (
                    <div className="text-[10px] font-semibold tracking-wider uppercase opacity-60 mb-0.5">
                      {m.senderName} · {m.senderRole}
                    </div>
                  )}
                  <div className="text-sm leading-snug whitespace-pre-wrap break-words">{m.text}</div>
                  <div className={`text-[9px] mt-1 ${isMine ? 'text-black/50' : 'text-white/30'}`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D4AF37]/50 transition-colors"
        />
        <button
          onClick={send}
          className="rounded-xl bg-[#D4AF37] px-4 text-black hover:bg-amber-400 transition-colors active:scale-95"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
