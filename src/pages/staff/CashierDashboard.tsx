// ============================================================
// HEBLI – Cashier Dashboard
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Coffee, DollarSign, Check, Receipt, User, Clock, TrendingUp, Timer, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GoldButton from '@/components/ui/GoldButton';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import StaffTopBar from '@/components/StaffTopBar';
import { useApp } from '@/contexts/AppContext';
import { getOrders, updateOrderStatus, addPayment, addAuditLog, getCashierStats, getPayments } from '@/utils/store';
import type { Order, Payment } from '@/types';
import { format } from 'date-fns';

export default function CashierDashboard() {
  const navigate = useNavigate();
  const { user, logoutUser, refreshOrders, syncTick } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [todayPayments, setTodayPayments] = useState<Payment[]>([]);
  const [historyPayments, setHistoryPayments] = useState<Payment[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ todayRevenue: 0, todayCount: 0, weeklyRevenue: 0, weeklyCount: 0 });

  const loadOrders = useCallback(() => {
    const all = getOrders();
    // Cashier sees ALL active (unpaid) orders in real time — Pending, In Preparation, Ready
    const relevant = all.filter((o) => o.status !== 'Paid');
    setOrders(relevant.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    // Load cashier stats
    if (user) {
      setStats(getCashierStats(user.name));
      const today = new Date().toISOString().split('T')[0];
      const cashierPayments = getPayments()
        .filter(p => p.cashierName === user.name)
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTodayPayments(cashierPayments.filter(p => p.date === today));
      setHistoryPayments(cashierPayments);
    }
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    const q = orderSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      order.id.toLowerCase().includes(q) ||
      order.clientName.toLowerCase().includes(q) ||
      order.items.some((item) => item.name.toLowerCase().includes(q))
    );
  });

  const filteredHistory = historyPayments.filter((payment) => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return true;
    const order = getOrders().find(o => o.id === payment.orderId);
    return (
      payment.id.toLowerCase().includes(q) ||
      payment.orderId.toLowerCase().includes(q) ||
      payment.date.toLowerCase().includes(q) ||
      payment.time.toLowerCase().includes(q) ||
      payment.amount.toFixed(2).includes(q) ||
      (order?.clientName.toLowerCase().includes(q) ?? false) ||
      (order?.items.some((item) => item.name.toLowerCase().includes(q)) ?? false)
    );
  });

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    const refresh = setInterval(() => window.location.reload(), 2 * 60 * 1000);
    return () => { clearInterval(interval); clearInterval(refresh); };
  }, [loadOrders]);

  // React to cross-device sync updates
  useEffect(() => {
    loadOrders();
  }, [syncTick, loadOrders]);

  const markAsPaid = (order: Order) => {
    setProcessingId(order.id);
    setTimeout(() => {
      updateOrderStatus(order.id, 'Paid');

      const now = new Date();
      addPayment({
        id: 'PAY-' + String(Date.now()).slice(-8),
        orderId: order.id,
        amount: order.total,
        cashierName: user?.name || 'Unknown',
        date: format(now, 'yyyy-MM-dd'),
        time: format(now, 'HH:mm:ss'),
        createdAt: now.toISOString(),
      });

      addAuditLog({
        id: 'log-' + Date.now(),
        action: 'Payment Received',
        details: `${order.total.toFixed(2)} DT payé pour la commande ${order.id}`,
        user: user?.name || 'Unknown',
        timestamp: now.toISOString(),
      });

      refreshOrders();
      loadOrders();
      setProcessingId(null);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 flex-shrink-0">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">
                <span className="text-[#D4AF37]">HEBLI</span> <span className="hidden sm:inline">Caisse</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-white/30 truncate">{user?.name}</p>
            </div>
          </div>

          <div className="flex-1" />

          <StaffTopBar onLogout={() => { logoutUser(); navigate('/staff'); }} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 sm:px-4 py-4 sm:py-8">
        {/* Stats - Daily & Weekly */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <GlassCard hover={false} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-3.5 w-3.5 text-white/30" />
              <div className="text-[10px] font-semibold tracking-[0.1em] text-white/30 uppercase">Aujourd'hui</div>
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.todayRevenue.toFixed(2)} DT</div>
            <div className="mt-1 text-xs text-white/30">{stats.todayCount} paiements</div>
          </GlassCard>

          <GlassCard hover={false} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-white/30" />
              <div className="text-[10px] font-semibold tracking-[0.1em] text-white/30 uppercase">Cette semaine</div>
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.weeklyRevenue.toFixed(2)} DT</div>
            <div className="mt-1 text-xs text-white/30">{stats.weeklyCount} paiements</div>
          </GlassCard>
        </div>

        {/* Ready Orders Awaiting Payment */}
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-white/40">
          <Receipt className="h-4 w-4" />
          Commandes à encaisser
          {orders.length > 0 && (
            <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">{orders.length}</span>
          )}
        </h2>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
          <input
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            placeholder="Search ready orders by name, ID, or item..."
            className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D4AF37]/50 transition-colors"
          />
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                layout
              >
                <GlassCard>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-[#D4AF37]">{order.id}</span>
                        <StatusBadge status={order.status} />
                        {order.prepTimeSeconds && (
                          <span className="ml-2 text-[10px] text-white/30 font-mono bg-white/[0.03] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Timer className="h-2.5 w-2.5" /> 
                            {Math.floor(order.prepTimeSeconds / 60)}m {order.prepTimeSeconds % 60}s
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-white/50">
                        <User className="h-3.5 w-3.5" />
                        {order.clientName}
                        <span className="text-white/15">•</span>
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {order.items.map((item, i) => (
                          <span key={i} className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-xs text-white/50">
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                      {order.note && (
                        <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-1.5 text-xs text-amber-300 inline-block">
                          📝 {order.note}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-white/25">Total</div>
                        <div className="text-xl font-bold text-[#D4AF37]">{order.total.toFixed(2)} DT</div>
                      </div>
                      <GoldButton
                        onClick={() => markAsPaid(order)}
                        disabled={processingId === order.id || order.status !== 'Ready'}
                      >
                        {processingId === order.id ? (
                          <>
                            <Coffee className="h-4 w-4 animate-spin" />
                            En cours
                          </>
                        ) : order.status !== 'Ready' ? (
                          <>
                            <Clock className="h-4 w-4" />
                            En préparation
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4" />
                            Encaisser
                          </>
                        )}
                      </GoldButton>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>

          {orders.length === 0 && (
            <div className="py-20 text-center text-white/20">
              <Check className="mx-auto h-10 w-10 opacity-30" />
              <p className="mt-3 text-sm">Toutes les commandes sont payées ✓</p>
            </div>
          )}
          {orders.length > 0 && filteredOrders.length === 0 && (
            <div className="py-12 text-center text-white/20">
              <Search className="mx-auto h-8 w-8 opacity-30" />
              <p className="mt-3 text-sm">No ready order matches this search.</p>
            </div>
          )}
        </div>

        {/* Today's Payments */}
        <div className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-white/40">
            <Check className="h-4 w-4" />
            Commandes encaissées aujourd'hui
          </h2>
          {todayPayments.length > 0 ? (
            <div className="space-y-2">
              {todayPayments.map((p) => {
                const order = getOrders().find(o => o.id === p.orderId);
                const prepStr = order?.prepTimeSeconds 
                  ? `${Math.floor(order.prepTimeSeconds / 60)}m ${order.prepTimeSeconds % 60}s` 
                  : '--';
                
                return (
                  <GlassCard key={p.id} className="flex items-center justify-between p-4" hover={false}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#D4AF37]">{p.orderId}</span>
                        <span className="text-[10px] text-white/30 font-mono bg-white/[0.03] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Timer className="h-2.5 w-2.5" /> {prepStr}
                        </span>
                      </div>
                      <div className="text-xs text-white/30 mt-1">{p.time}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{p.amount.toFixed(2)} DT</span>
                      <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-green-400">
                        ✓ Payé
                      </span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-white/20 text-sm">
              Aucun paiement enregistré aujourd'hui.
            </div>
          )}
        </div>

        {/* Searchable Payment History */}
        <div className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-white/40">
            <Receipt className="h-4 w-4" />
            Historique des paiements
            <span className="ml-auto rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/35">
              {filteredHistory.length}
            </span>
          </h2>

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
            <input
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search history by order ID, customer name, date, or item..."
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D4AF37]/50 transition-colors"
            />
          </div>

          {filteredHistory.length > 0 ? (
            <div className="space-y-2">
              {filteredHistory.slice(0, 20).map((p) => {
                const order = getOrders().find(o => o.id === p.orderId);
                const prepStr = order?.prepTimeSeconds
                  ? `${Math.floor(order.prepTimeSeconds / 60)}m ${order.prepTimeSeconds % 60}s`
                  : '--';

                return (
                  <GlassCard key={p.id} className="p-4" hover={false}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-[#D4AF37]">{p.orderId}</span>
                          <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-green-400">
                            Paid
                          </span>
                          <span className="text-[10px] text-white/30 font-mono bg-white/[0.03] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Timer className="h-2.5 w-2.5" /> {prepStr}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-white/35 truncate">
                          {order?.clientName || 'Unknown client'} • {p.date} • {p.time}
                        </div>
                        {order && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {order.items.map((item, i) => (
                              <span key={i} className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/45">
                                {item.quantity}x {item.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold text-white">{p.amount.toFixed(2)} DT</div>
                        <div className="text-[10px] text-white/25">{p.id}</div>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-white/20 text-sm">
              No payment history matches this search.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
