// ============================================================
// HEBLI – Client Support / Reclamations (Ticket → Owner Chat)
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LifeBuoy, Send, Clock, CheckCircle2, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import ChatPanel from '@/components/ChatPanel';
import { addTicket, getTickets, addNotification } from '@/utils/store';
import { useApp } from '@/contexts/AppContext';
import type { Ticket } from '@/types';

export default function Support() {
  const navigate = useNavigate();
  const { syncTick } = useApp();
  const [clientName, setClientName] = useState(localStorage.getItem('hebli_client_name') || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const loadTickets = () => {
    const name = localStorage.getItem('hebli_client_name') || clientName;
    if (!name) return;
    const mine = getTickets()
      .filter((t) => t.clientName.toLowerCase() === name.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setMyTickets(mine);
    if (activeTicket) {
      const updated = mine.find((t) => t.id === activeTicket.id);
      if (updated) setActiveTicket(updated);
    }
  };

  useEffect(() => {
    loadTickets();
    const int = setInterval(loadTickets, 2500);
    return () => clearInterval(int);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncTick, clientName]);

  const submitTicket = () => {
    if (!clientName.trim() || !subject.trim() || !message.trim()) return;
    localStorage.setItem('hebli_client_name', clientName.trim());
    const id = 'TKT-' + String(Date.now()).slice(-6);
    addTicket({
      id,
      clientName: clientName.trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    addNotification({
      id: 'ntf-' + Date.now(),
      target: 'Administrator',
      title: 'New Support Request',
      body: `${clientName.trim()}: ${subject.trim()}`,
      type: 'message',
      read: false,
      createdAt: new Date().toISOString(),
    });
    setSubject('');
    setMessage('');
    loadTickets();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-4">
          <button onClick={() => navigate('/')} className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/5 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-[#D4AF37]">HEBLI</span> Support
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {activeTicket ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => setActiveTicket(null)} className="mb-6 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to my requests
            </button>

            <GlassCard className="mb-6" hover={false}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-white/40 tracking-wider uppercase">{activeTicket.id}</div>
                  <h2 className="mt-1 text-lg font-bold">{activeTicket.subject}</h2>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                  activeTicket.status === 'accepted' ? 'border-green-500/20 bg-green-500/10 text-green-400' :
                  activeTicket.status === 'closed' ? 'border-white/10 bg-white/5 text-white/40' :
                  'border-amber-500/20 bg-amber-500/10 text-amber-400'
                }`}>
                  {activeTicket.status === 'accepted' ? 'Live Chat' : activeTicket.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-white/60">{activeTicket.message}</p>
            </GlassCard>

            {activeTicket.status === 'accepted' ? (
              <GlassCard hover={false}>
                <h3 className="text-sm font-semibold tracking-wider uppercase text-white/40 mb-4 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-[#D4AF37]" /> Chat with Owner
                </h3>
                <ChatPanel
                  conversationId={`ticket:${activeTicket.id}`}
                  senderName={activeTicket.clientName}
                  senderRole="Client"
                  heightClass="h-[340px]"
                  emptyText="The owner accepted your request. Start chatting!"
                />
              </GlassCard>
            ) : (
              <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] p-6 text-center">
                <Clock className="mx-auto h-8 w-8 text-amber-400/60" />
                <p className="mt-3 text-sm text-white/60">
                  Your request is pending. The owner will open a live chat once they accept it.
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* New request form */}
            <GlassCard className="mb-8" hover={false}>
              <div className="flex items-center gap-2 mb-4">
                <LifeBuoy className="h-5 w-5 text-[#D4AF37]" />
                <h2 className="text-lg font-bold">Contact the Owner</h2>
              </div>
              <p className="text-sm text-white/40 mb-5">
                Have a request or a complaint (reclamation)? Send it and the owner will chat with you live.
              </p>
              <div className="space-y-3">
                <input
                  type="text" placeholder="Your name"
                  value={clientName} onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D4AF37]/50"
                />
                <input
                  type="text" placeholder="Subject (e.g. Cold coffee, Refund...)"
                  value={subject} onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D4AF37]/50"
                />
                <textarea
                  placeholder="Describe your request or complaint..."
                  value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D4AF37]/50 resize-none"
                />
                <button
                  onClick={submitTicket}
                  disabled={!clientName.trim() || !subject.trim() || !message.trim()}
                  className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-black hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" /> Send Request
                </button>
              </div>
            </GlassCard>

            {/* My requests */}
            <h3 className="text-sm font-semibold tracking-wider uppercase text-white/30 mb-4">My Requests</h3>
            {myTickets.length > 0 ? (
              <div className="space-y-3">
                {myTickets.map((t) => (
                  <button key={t.id} onClick={() => setActiveTicket(t)} className="w-full text-left">
                    <GlassCard className="flex items-center justify-between p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#D4AF37]">{t.id}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                            t.status === 'accepted' ? 'border-green-500/20 bg-green-500/10 text-green-400' :
                            t.status === 'closed' ? 'border-white/10 bg-white/5 text-white/40' :
                            'border-amber-500/20 bg-amber-500/10 text-amber-400'
                          }`}>
                            {t.status === 'accepted' ? 'Live' : t.status}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-white/60">{t.subject}</div>
                      </div>
                      {t.status === 'accepted' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-400/50" />
                      )}
                    </GlassCard>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-white/20">
                <LifeBuoy className="mx-auto h-10 w-10 opacity-30" />
                <p className="mt-3 text-sm">No requests yet.</p>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
