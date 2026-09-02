// ============================================================
// HEBLI – Barista Dashboard (Production Center)
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee,
  Timer,
  CheckCircle2,
  Bell,
  Clock,
  User,
  Volume2,
  VolumeX,
  DollarSign,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GoldButton from '@/components/ui/GoldButton';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import StaffTopBar from '@/components/StaffTopBar';
import { useApp } from '@/contexts/AppContext';
import { getOrders, updateOrderStatus, addAuditLog, getPayments } from '@/utils/store';
import { getStaffTitle } from '@/utils/roles';
import type { Order } from '@/types';

// Loud, long, attention-grabbing "coffee shop bell" notification.
// Plays a 2-tone chime 4 times over ~4 seconds.
function playBeep() {
  try {
    const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const master = ctx.createGain();
    master.gain.value = 0.9; // overall loudness
    master.connect(ctx.destination);

    // A two-tone bell-like ding (E6 → A5) with a longer ringing decay.
    const playChime = (offset: number) => {
      const tones = [
        { freq: 1318.5, start: 0.00, length: 0.85, vol: 0.55 }, // E6
        { freq: 880.0, start: 0.18, length: 0.85, vol: 0.45 }, // A5
        { freq: 1760.0, start: 0.00, length: 0.30, vol: 0.18 }, // A6 (sparkle)
      ];
      tones.forEach((t) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = t.freq;
        osc.connect(g);
        g.connect(master);
        const start = ctx.currentTime + offset + t.start;
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(t.vol, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, start + t.length);
        osc.start(start);
        osc.stop(start + t.length + 0.05);
      });
    };

    // Ring 4 times, ~1.0s apart → total ~4 seconds
    playChime(0.00);
    playChime(1.00);
    playChime(2.00);
    playChime(3.00);
  } catch { /* ignore */ }
}

function LiveTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const update = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };
    update();
    const int = setInterval(update, 1000);
    return () => clearInterval(int);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return <span>{mins}:{secs.toString().padStart(2, '0')}</span>;
}

export default function BaristaDashboard() {
  const navigate = useNavigate();
  const { user, logoutUser, refreshOrders, syncTick } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [search, setSearch] = useState('');
  const prevPendingRef = useRef(0);
  const initializedRef = useRef(false);

  // Filter orders by search (id, client name, item names, note)
  const matchesSearch = (o: Order) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      o.id.toLowerCase().includes(q) ||
      o.clientName.toLowerCase().includes(q) ||
      (o.note || '').toLowerCase().includes(q) ||
      o.items.some((i) => i.name.toLowerCase().includes(q))
    );
  };

  const loadOrders = useCallback(() => {
    const all = getOrders();
    // Barista sees Pending, In Preparation, Ready (unpaid), AND Paid (completed today)
    const relevant = all.filter(
      (o) => o.status === 'Pending' || o.status === 'In Preparation' || o.status === 'Ready' || o.status === 'Paid'
    );
    // Sort: oldest order first (longest waiting time at the top — most urgent)
    setOrders(relevant.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));

    const pendingCount = relevant.filter((o) => o.status === 'Pending').length;
    if (initializedRef.current && pendingCount > prevPendingRef.current) {
      setNotification(`🔔 Nouvelle commande! (${pendingCount} en attente)`);
      if (soundOn) playBeep();
      setTimeout(() => setNotification(null), 4500);
    }
    prevPendingRef.current = pendingCount;
    initializedRef.current = true;
  }, [soundOn]);

  useEffect(() => {
    loadOrders();
    // local poll every 3s
    const interval = setInterval(loadOrders, 3000);
    // hard auto-refresh every 2 minutes
    return () => { clearInterval(interval); };
  }, [loadOrders]);

  // React to cross-device sync updates immediately
  useEffect(() => {
    loadOrders();
  }, [syncTick, loadOrders]);

  const startPreparation = (orderId: string) => {
    updateOrderStatus(orderId, 'In Preparation');
    addAuditLog({
      id: 'log-' + Date.now(),
      action: 'Preparation Started',
      details: `Order ${orderId} → In Preparation by ${user?.name}`,
      user: user?.name || 'Unknown',
      timestamp: new Date().toISOString(),
    });
    refreshOrders();
    loadOrders();
  };

  const markReady = (orderId: string, createdAt: string) => {
    const prepTimeSeconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    updateOrderStatus(orderId, 'Ready', prepTimeSeconds);
    addAuditLog({
      id: 'log-' + Date.now(),
      action: 'Order Ready',
      details: `Order ${orderId} → Ready by ${user?.name} in ${prepTimeSeconds}s`,
      user: user?.name || 'Unknown',
      timestamp: new Date().toISOString(),
    });
    refreshOrders();
    loadOrders();
  };

  // Check if order is paid
  const isPaid = (orderId: string) => {
    return getPayments().some((p) => p.orderId === orderId);
  };

  const pendingOrders = orders.filter((o) => o.status === 'Pending' && matchesSearch(o));
  const preparingOrders = orders.filter((o) => o.status === 'In Preparation' && matchesSearch(o));
  const readyOrders = orders.filter((o) => o.status === 'Ready' && matchesSearch(o));
  // Paid orders: show today's only (sorted newest first since they're completed)
  const today = new Date().toISOString().split('T')[0];
  const paidOrders = orders
    .filter((o) => o.status === 'Paid' && matchesSearch(o) && new Date(o.createdAt).toISOString().split('T')[0] === today)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 flex-shrink-0">
              <Coffee className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">
                <span className="text-[#D4AF37]">HEBLI</span> <span className="hidden sm:inline">{user ? getStaffTitle(user) : 'Barista'}</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-white/30 truncate">{user?.name}</p>
            </div>
          </div>

          <div className="flex-1" />

          <button
            onClick={() => {
              setSoundOn((s) => {
                const next = !s;
                if (next) playBeep(); // preview the new sound when enabling
                return next;
              });
            }}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold transition-colors ${
              soundOn
                ? 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]'
                : 'border-white/[0.08] bg-white/[0.02] text-white/40 hover:text-white'
            }`}
            title={soundOn ? 'Order alert sound ON — tap to mute' : 'Sound is OFF — tap to enable'}
          >
            {soundOn ? <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            <span className="hidden sm:inline">{soundOn ? 'Sound' : 'Muted'}</span>
          </button>

          <StaffTopBar onLogout={() => { logoutUser(); navigate('/staff'); }} />
        </div>
      </header>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed left-1/2 top-4 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-[#D4AF37]/30 bg-[#111] px-6 py-3 shadow-2xl shadow-[#D4AF37]/10">
              <Bell className="h-4 w-4 text-[#D4AF37]" />
              <span className="text-sm font-medium">{notification}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <GlassCard hover={false} className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-amber-400">{pendingOrders.length}</div>
            <div className="mt-1 text-[10px] sm:text-xs text-white/40 tracking-wider uppercase">En attente</div>
          </GlassCard>
          <GlassCard hover={false} className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-400">{preparingOrders.length}</div>
            <div className="mt-1 text-[10px] sm:text-xs text-white/40 tracking-wider uppercase">En préparation</div>
          </GlassCard>
          <GlassCard hover={false} className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400">{readyOrders.length}</div>
            <div className="mt-1 text-[10px] sm:text-xs text-white/40 tracking-wider uppercase">Prêtes</div>
          </GlassCard>
          <GlassCard hover={false} className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-400">{paidOrders.length}</div>
            <div className="mt-1 text-[10px] sm:text-xs text-white/40 tracking-wider uppercase">Payées</div>
          </GlassCard>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher commande, client, produit, note..."
            className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3 pl-11 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#D4AF37]/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/30 hover:text-white hover:bg-white/5"
            >
              ×
            </button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {/* Pending */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-amber-400">
              <Clock className="h-4 w-4" />
              En attente
              <span className="ml-auto text-[10px] text-white/25">{pendingOrders.length}</span>
            </h2>
            <div className="space-y-3">
              <AnimatePresence>
                {pendingOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    layout
                  >
                    <GlassCard>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-[#D4AF37]">{order.id}</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-sm text-white/50">
                            <User className="h-3.5 w-3.5" />
                            {order.clientName}
                          </div>
                          <div className="mt-2 space-y-0.5">
                            {order.items.map((item, i) => (
                              <div key={i} className="text-sm text-white/70">
                                {item.quantity}x {item.name}
                              </div>
                            ))}
                          </div>
                          {order.note && (
                            <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-1.5 text-xs text-amber-300">
                              📝 {order.note}
                            </div>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="text-xs text-amber-400/80 flex items-center gap-1 font-mono">
                              <Clock className="h-3 w-3" /> <LiveTimer startTime={order.createdAt} />
                            </div>
                            <div className="text-sm font-bold text-[#D4AF37]">{order.total.toFixed(2)} DT</div>
                          </div>
                        </div>
                      </div>
                      <GoldButton size="sm" className="mt-3 w-full" onClick={() => startPreparation(order.id)}>
                        <Timer className="h-4 w-4" />
                        Commencer
                      </GoldButton>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>
              {pendingOrders.length === 0 && (
                <div className="py-12 text-center text-white/20">
                  <Coffee className="mx-auto h-8 w-8 opacity-30" />
                  <p className="mt-2 text-sm">Aucune commande</p>
                </div>
              )}
            </div>
          </div>

          {/* In Preparation */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-blue-400">
              <Timer className="h-4 w-4" />
              En préparation
              <span className="ml-auto text-[10px] text-white/25">{preparingOrders.length}</span>
            </h2>
            <div className="space-y-3">
              <AnimatePresence>
                {preparingOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    layout
                  >
                    <GlassCard>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-blue-400">{order.id}</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-sm text-white/50">
                            <User className="h-3.5 w-3.5" />
                            {order.clientName}
                          </div>
                          <div className="mt-2 space-y-0.5">
                            {order.items.map((item, i) => (
                              <div key={i} className="text-sm text-white/70">
                                {item.quantity}x {item.name}
                              </div>
                            ))}
                          </div>
                          {order.note && (
                            <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-1.5 text-xs text-amber-300">
                              📝 {order.note}
                            </div>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="text-xs text-blue-400/80 flex items-center gap-1 font-mono">
                              <Timer className="h-3 w-3" /> <LiveTimer startTime={order.createdAt} />
                            </div>
                            <div className="text-sm font-bold text-[#D4AF37]">{order.total.toFixed(2)} DT</div>
                          </div>
                        </div>
                      </div>
                      <GoldButton size="sm" className="mt-3 w-full" onClick={() => markReady(order.id, order.createdAt)}>
                        <CheckCircle2 className="h-4 w-4" />
                        Prête ✓
                      </GoldButton>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>
              {preparingOrders.length === 0 && (
                <div className="py-12 text-center text-white/20">
                  <Timer className="mx-auto h-8 w-8 opacity-30" />
                  <p className="mt-2 text-sm">Rien en préparation</p>
                </div>
              )}
            </div>
          </div>

          {/* Ready - Awaiting Payment */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Prêtes
              <span className="ml-auto text-[10px] text-white/25">{readyOrders.length}</span>
            </h2>
            <div className="space-y-3">
              <AnimatePresence>
                {readyOrders.map((order) => {
                  const paid = isPaid(order.id);
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      layout
                    >
                      <GlassCard className={paid ? 'border-green-500/20 bg-green-500/[0.02]' : ''}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-emerald-400">{order.id}</span>
                              {paid ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-green-400">
                                  <DollarSign className="h-2.5 w-2.5" /> Payé
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-amber-400 animate-pulse">
                                  À payer au serveur
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-sm text-white/50">
                              <User className="h-3.5 w-3.5" />
                              {order.clientName}
                            </div>
                            <div className="mt-2 space-y-0.5">
                              {order.items.map((item, i) => (
                                <div key={i} className="text-sm text-white/70">
                                  {item.quantity}x {item.name}
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-sm font-bold text-emerald-400">{order.total.toFixed(2)} DT</span>
                              {paid && (
                                <span className="text-[10px] text-green-400/50">✓ Prêt à donner</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {readyOrders.length === 0 && (
                <div className="py-12 text-center text-white/20">
                  <CheckCircle2 className="mx-auto h-8 w-8 opacity-30" />
                  <p className="mt-2 text-sm">Aucune commande prête</p>
                </div>
              )}
            </div>
          </div>

          {/* Paid (today, completed) */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-green-400">
              <DollarSign className="h-4 w-4" />
              Payées (aujourd'hui)
              <span className="ml-auto text-[10px] text-white/25">{paidOrders.length}</span>
            </h2>
            <div className="space-y-3">
              <AnimatePresence>
                {paidOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    layout
                  >
                    <GlassCard className="border-green-500/15 bg-green-500/[0.02]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg font-bold text-green-400">{order.id}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-green-400">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Payé
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-sm text-white/50">
                            <User className="h-3.5 w-3.5" />
                            {order.clientName}
                          </div>
                          <div className="mt-2 space-y-0.5">
                            {order.items.map((item, i) => (
                              <div key={i} className="text-sm text-white/60">
                                {item.quantity}x {item.name}
                              </div>
                            ))}
                          </div>
                          {order.note && (
                            <div className="mt-2 rounded-lg border border-amber-500/15 bg-amber-500/[0.04] px-2.5 py-1.5 text-xs text-amber-300/80">
                              📝 {order.note}
                            </div>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="text-xs text-white/30">
                              {new Date(order.updatedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-sm font-bold text-green-400">{order.total.toFixed(2)} DT</div>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>
              {paidOrders.length === 0 && (
                <div className="py-12 text-center text-white/20">
                  <DollarSign className="mx-auto h-8 w-8 opacity-30" />
                  <p className="mt-2 text-sm">Aucune commande payée aujourd'hui</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
