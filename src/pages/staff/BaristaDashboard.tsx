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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GoldButton from '@/components/ui/GoldButton';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import StaffTopBar from '@/components/StaffTopBar';
import { useApp } from '@/contexts/AppContext';
import { getOrders, updateOrderStatus, addAuditLog, getPayments } from '@/utils/store';
import type { Order } from '@/types';

// Notification beep using Web Audio
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    // second tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.value = 1175;
    gain2.gain.setValueAtTime(0.0001, ctx.currentTime + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.27);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.75);
    osc2.start(ctx.currentTime + 0.25);
    osc2.stop(ctx.currentTime + 0.75);
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
  const prevPendingRef = useRef(0);
  const initializedRef = useRef(false);

  const loadOrders = useCallback(() => {
    const all = getOrders();
    // Barista sees Pending, In Preparation, AND Ready (unpaid)
    const relevant = all.filter(
      (o) => o.status === 'Pending' || o.status === 'In Preparation' || o.status === 'Ready'
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

  const pendingOrders = orders.filter((o) => o.status === 'Pending');
  const preparingOrders = orders.filter((o) => o.status === 'In Preparation');
  const readyOrders = orders.filter((o) => o.status === 'Ready');

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
                <span className="text-[#D4AF37]">HEBLI</span> <span className="hidden sm:inline">Barista</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-white/30 truncate">{user?.name}</p>
            </div>
          </div>

          <div className="flex-1" />

          <button
            onClick={() => setSoundOn((s) => !s)}
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
        <div className="mb-8 grid grid-cols-3 gap-4">
          <GlassCard hover={false} className="text-center">
            <div className="text-3xl font-bold text-amber-400">{pendingOrders.length}</div>
            <div className="mt-1 text-xs text-white/40 tracking-wider uppercase">En attente</div>
          </GlassCard>
          <GlassCard hover={false} className="text-center">
            <div className="text-3xl font-bold text-blue-400">{preparingOrders.length}</div>
            <div className="mt-1 text-xs text-white/40 tracking-wider uppercase">En préparation</div>
          </GlassCard>
          <GlassCard hover={false} className="text-center">
            <div className="text-3xl font-bold text-emerald-400">{readyOrders.length}</div>
            <div className="mt-1 text-xs text-white/40 tracking-wider uppercase">Prêtes</div>
          </GlassCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
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
                                  À payer en caisse
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
        </div>
      </main>
    </div>
  );
}
