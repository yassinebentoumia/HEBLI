// ============================================================
// HEBLI – Barista Dashboard (Production Center)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee,
  Timer,
  CheckCircle2,
  Bell,
  LogOut,
  Clock,
  User,
  DollarSign,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GoldButton from '@/components/ui/GoldButton';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { useApp } from '@/contexts/AppContext';
import { getOrders, updateOrderStatus, addAuditLog, getPayments } from '@/utils/store';
import type { Order } from '@/types';

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
  const { user, logoutUser, refreshOrders } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [prevOrderCount, setPrevOrderCount] = useState(0);

  const loadOrders = useCallback(() => {
    const all = getOrders();
    // Barista sees Pending, In Preparation, AND Ready (unpaid)
    const relevant = all.filter(
      (o) => o.status === 'Pending' || o.status === 'In Preparation' || o.status === 'Ready'
    );
    setOrders(relevant.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    const pendingCount = relevant.filter((o) => o.status === 'Pending').length;
    if (pendingCount > prevOrderCount && prevOrderCount > 0) {
      setNotification(`🔔 Nouvelle commande! (${pendingCount} en attente)`);
      setTimeout(() => setNotification(null), 4000);
    }
    setPrevOrderCount(pendingCount);
  }, [prevOrderCount]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, [loadOrders]);

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
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
              <Coffee className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                <span className="text-[#D4AF37]">HEBLI</span> Barista
              </h1>
              <p className="text-xs text-white/30">{user?.name}</p>
            </div>
          </div>

          <div className="flex-1" />

          {pendingOrders.length > 0 && (
            <div className="relative">
              <Bell className="h-5 w-5 text-amber-400" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
                {pendingOrders.length}
              </span>
            </div>
          )}

          <button
            onClick={() => { logoutUser(); navigate('/staff'); }}
            className="rounded-xl p-2 text-white/30 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
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

      <main className="mx-auto max-w-7xl px-4 py-8">
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
