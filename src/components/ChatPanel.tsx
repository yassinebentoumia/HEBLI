// ============================================================
// HEBLI – Reusable Live Chat Panel
// (Owner can delete messages and clear whole conversation)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, MoreVertical, AlertTriangle, X } from 'lucide-react';
import { getConversation, addChatMessage, deleteChatMessage, deleteConversation } from '@/utils/store';
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
  const { syncTick, user } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.role === 'Administrator';

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

  const handleDeleteMessage = (id: string) => {
    deleteChatMessage(id);
    setOpenMenu(null);
    load();
  };

  const handleClearAll = () => {
    deleteConversation(conversationId);
    setConfirmClear(false);
    load();
  };

  // Close kebab menu when clicking outside
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    setTimeout(() => document.addEventListener('click', close, { once: true }), 50);
    return () => document.removeEventListener('click', close);
  }, [openMenu]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Owner toolbar: clear whole conversation */}
      {isOwner && messages.length > 0 && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setConfirmClear(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-500/15 transition-colors"
            title="Owner only: clear entire conversation"
          >
            <Trash2 className="h-3 w-3" />
            Clear all
          </button>
        </div>
      )}

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
            // Owner can delete ANY message; otherwise only own messages.
            const canDelete = isOwner || isMine;
            const menuOpen = openMenu === m.id;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'} group relative`}
              >
                <div className={`relative max-w-[78%] rounded-2xl px-3.5 py-2 ${
                  isMine
                    ? 'bg-[#D4AF37] text-black'
                    : 'bg-white/[0.05] text-white/90'
                }`}>
                  {!isMine && (
                    <div className="text-[10px] font-semibold tracking-wider uppercase opacity-60 mb-0.5">
                      {m.senderName} · {m.senderRole}
                    </div>
                  )}
                  <div className="text-sm leading-snug whitespace-pre-wrap break-words pr-5">{m.text}</div>
                  <div className={`text-[9px] mt-1 ${isMine ? 'text-black/50' : 'text-white/30'}`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {/* Delete menu (kebab in top corner) */}
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(menuOpen ? null : m.id);
                      }}
                      className={`absolute top-1 right-1 rounded-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                        isMine ? 'hover:bg-black/15 text-black/50' : 'hover:bg-white/10 text-white/40'
                      } ${menuOpen ? 'opacity-100' : ''}`}
                      title="Message actions"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </button>
                  )}

                  {/* Dropdown menu */}
                  {menuOpen && canDelete && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`absolute top-7 ${isMine ? 'right-0' : 'left-0'} z-10 rounded-lg border border-white/10 bg-[#1a1a1a] shadow-2xl py-1 min-w-[140px]`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleDeleteMessage(m.id)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete message
                      </button>
                      {isOwner && !isMine && (
                        <div className="px-3 py-1 text-[9px] text-white/30 border-t border-white/[0.06] mt-1">
                          Owner moderation
                        </div>
                      )}
                    </motion.div>
                  )}
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

      {/* Confirm Clear All dialog */}
      <AnimatePresence>
        {confirmClear && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setConfirmClear(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-[#111] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold">Clear all messages?</h3>
                  <p className="mt-1 text-xs text-white/40">
                    This deletes all {messages.length} message{messages.length !== 1 ? 's' : ''} in this conversation for everyone. Cannot be undone.
                  </p>
                </div>
                <button onClick={() => setConfirmClear(false)} className="text-white/40 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-400"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
