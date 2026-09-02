// ============================================================
// HEBLI – Waiter Dashboard  (internal role value stays "Cashier")
// ============================================================
// Changes vs. the old Cashier dashboard:
//  • Removed the "Aujourd'hui" / "Cette semaine" stat cards
//  • Added "Nouvelles commandes" (New Commands) section
//  • Added "System Table" — a floor map to seat orders at tables
//  • Added "Chat avec le barista" (chat with barista)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee, DollarSign, Check, Receipt, User, Clock, Timer, Search, FileText,
  Utensils, Bell, MessageCircle, X, Armchair, Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GoldButton from '@/components/ui/GoldButton';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import StaffTopBar from '@/components/StaffTopBar';
import ChatPanel from '@/components/ChatPanel';
import { useApp } from '@/contexts/AppContext';
import {
  getOrders, updateOrderStatus, addPayment, addAuditLog, getPayments, setOrderTable, TABLE_COUNT,
} from '@/utils/store';
import { getStaffTitle } from '@/utils/roles';
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

  // System Table: which order the waiter is about to seat at a table
  const [seatingOrderId, setSeatingOrderId] = useState<string | null>(null);
  // Chat with barista drawer
  const [chatOpen, setChatOpen] = useState(false);

  const loadOrders = useCallback(() => {
    const all = getOrders();
    // Waiter sees ALL active (unpaid) orders in real time — Pending, In Preparation, Ready
    const relevant = all.filter((o) => o.status !== 'Paid');
    // Sort: oldest order first (longest waiting time at the top — most urgent)
    setOrders(relevant.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));

    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const myPayments = getPayments()
        .filter((p) => p.cashierName === user.name)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTodayPayments(myPayments.filter((p) => p.date === today));
      setHistoryPayments(myPayments);
    }
  }, [user]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  useEffect(() => { loadOrders(); }, [syncTick, loadOrders]);

  // ---- Derived lists -------------------------------------------------------
  // New commands = freshly placed, not yet started by the barista.
  const newOrders = orders.filter((o) => o.status === 'Pending');
  // Ready to be cashed.
  const toCash = orders.filter((o) => o.status !== 'Pending');

  const filteredToCash = toCash.filter((order) => {
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
    const order = getOrders().find((o) => o.id === payment.orderId);
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

  // ---- Actions -------------------------------------------------------------
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

  const seatAtTable = (tableNumber: number) => {
    if (!seatingOrderId) return;
    setOrderTable(seatingOrderId, tableNumber);
    addAuditLog({
      id: 'log-' + Date.now(),
      action: 'Table Assigned',
      details: `Commande ${seatingOrderId} placée à la table ${tableNumber}`,
      user: user?.name || 'Waiter',
      timestamp: new Date().toISOString(),
    });
    setSeatingOrderId(null);
    refreshOrders();
    loadOrders();
  };

  const clearTable = (tableNumber: number) => {
    const occupant = orders.find((o) => o.tableNumber === tableNumber);
    if (occupant) {
      setOrderTable(occupant.id, undefined);
      loadOrders();
    }
  };

  // Map of tableNumber -> order for the floor map
  const tableMap = new Map<number, Order>();
  orders.forEach((o) => { if (o.tableNumber) tableMap.set(o.tableNumber, o); });

  const waiterTitle = user ? getStaffTitle(user) : 'Serveur';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 flex-shrink-0">
              <Utensils className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">
                <span className="text-[#D4AF37]">HEBLI</span>{' '}
                <span className="hidden sm:inline">{waiterTitle}</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-white/30 truncate">{user?.name}</p>
            </div>
          </div>

          <div className="flex-1" />

          <StaffTopBar onLogout={() => { logoutUser(); navigate('/staff'); }} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 sm:px-4 py-4 sm:py-8">
        {/* Quick actions: Facture + Chat with barista (replaces the removed stat cards) */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/cashier/invoice')}
            className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 to-amber-600/5 p-6 text-center transition-all hover:border-[#D4AF37]/60 hover:from-[#D4AF37]/20 active:scale-[0.98]"
          >
            <div className="relative flex items-center justify-center gap-2 mb-2">
              <FileText className="h-3.5 w-3.5 text-[#D4AF37]" />
              <div className="text-[10px] font-semibold tracking-[0.1em] text-[#D4AF37] uppercase">Facture</div>
            </div>
            <div className="relative text-xl sm:text-2xl font-bold text-[#D4AF37]">+ Nouvelle</div>
            <div className="relative mt-1 text-[10px] sm:text-xs text-white/40">Créer une facture fournisseur</div>
          </button>

          <button
            onClick={() => setChatOpen(true)}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-center transition-all hover:border-white/20 hover:bg-white/[0.05] active:scale-[0.98]"
          >
            <div className="relative flex items-center justify-center gap-2 mb-2">
              <MessageCircle className="h-3.5 w-3.5 text-white/50" />
              <div className="text-[10px] font-semibold tracking-[0.1em] text-white/50 uppercase">Barista</div>
            </div>
            <div className="relative text-xl sm:text-2xl font-bold text-white">Chat</div>
            <div className="relative mt-1 text-[10px] sm:text-xs text-white/40">Discuter avec le barista</div>
          </button>
        </div>

        {/* ============================================================
            NEW COMMANDS
           ============================================================ */}
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-white/40">
          <Sparkles className="h-4 w-4 text-[#D4AF37]" />
          Nouvelles commandes
          {newOrders.length > 0 && (
            <span className="ml-auto rounded-full bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] text-[#D4AF37]">
              {newOrders.length}
            </span>
          )}
        </h2>

        <div className="mb-10 space-y-3">
          <AnimatePresence>
            {newOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                layout
              >
                <GlassCard>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-[#D4AF37]">{order.id}</span>
                        <StatusBadge status={order.status} />
                        {order.tableNumber && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                            <Armchair className="h-2.5 w-2.5" /> Table {order.tableNumber}
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
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-white/25">Total</div>
                        <div className="text-xl font-bold text-[#D4AF37]">{order.total.toFixed(2)} DT</div>
                      </div>
                      <button
                        onClick={() => setSeatingOrderId(order.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.06] transition-colors"
                        title="Placer à une table"
                      >
                        <Armchair className="h-4 w-4" />
                        Table
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>

          {newOrders.length === 0 && (
            <div className="py-10 text-center text-white/20">
              <Bell className="mx-auto h-9 w-9 opacity-30" />
              <p className="mt-3 text-sm">Aucune nouvelle commande pour l'instant.</p>
            </div>
          )}
        </div>

        {/* ============================================================
            SYSTEM TABLE (floor map)
           ============================================================ */}
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-white/40">
          <Armchair className="h-4 w-4 text-[#D4AF37]" />
          System Table
          {seatingOrderId && (
            <span className="ml-auto rounded-full bg-[#D4AF37]/15 px-2.5 py-0.5 text-[10px] text-[#D4AF37]">
              Choisir une table pour {seatingOrderId}
            </span>
          )}
        </h2>

        {seatingOrderId && (
          <div className="mb-3 flex items-center justify-between rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] px-3 py-2 text-xs text-[#D4AF37]">
            <span>Touchez une table libre pour y placer la commande {seatingOrderId}.</span>
            <button onClick={() => setSeatingOrderId(null)} className="rounded-lg p-1 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mb-10 grid grid-cols-3 sm:grid-cols-4 gap-3">
          {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((num) => {
            const occupant = tableMap.get(num);
            const occupied = !!occupant;
            const selectable = !!seatingOrderId && !occupied;
            return (
              <button
                key={num}
                onClick={() => {
                  if (selectable) seatAtTable(num);
                  else if (occupied) clearTable(num);
                }}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border p-2 text-center transition-all active:scale-[0.97] ${
                  occupied
                    ? 'border-emerald-500/30 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14]'
                    : selectable
                    ? 'border-[#D4AF37]/50 bg-[#D4AF37]/[0.08] hover:bg-[#D4AF37]/[0.16] ring-2 ring-[#D4AF37]/30'
                    : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
                title={occupied ? `Table ${num} — ${occupant?.id} (${occupant?.clientName}). Tap to free.` : `Table ${num}`}
              >
                <Armchair className={`h-6 w-6 ${occupied ? 'text-emerald-400' : selectable ? 'text-[#D4AF37]' : 'text-white/30'}`} />
                <span className={`mt-1 text-sm font-bold ${occupied ? 'text-emerald-300' : 'text-white/70'}`}>
                  {num}
                </span>
                {occupied && (
                  <span className="mt-0.5 max-w-full truncate text-[9px] text-white/50">
                    {occupant?.clientName}
                  </span>
                )}
                <span className={`mt-0.5 text-[8px] uppercase tracking-wider ${occupied ? 'text-emerald-400/70' : 'text-white/25'}`}>
                  {occupied ? 'Occupée' : 'Libre'}
                </span>
              </button>
            );
          })}
        </div>

        {/* ============================================================
            ORDERS TO CASH
           ============================================================ */}
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-white/40">
          <Receipt className="h-4 w-4" />
          Commandes à encaisser
          {toCash.length > 0 && (
            <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">{toCash.length}</span>
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
            {filteredToCash.map((order) => (
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
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-lg font-bold text-[#D4AF37]">{order.id}</span>
                        <StatusBadge status={order.status} />
                        {order.tableNumber && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                            <Armchair className="h-2.5 w-2.5" /> Table {order.tableNumber}
                          </span>
                        )}
                        {order.prepTimeSeconds && (
                          <span className="text-[10px] text-white/30 font-mono bg-white/[0.03] px-2 py-0.5 rounded-full flex items-center gap-1">
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

          {toCash.length === 0 && (
            <div className="py-20 text-center text-white/20">
              <Check className="mx-auto h-10 w-10 opacity-30" />
              <p className="mt-3 text-sm">Toutes les commandes sont payées ✓</p>
            </div>
          )}
          {toCash.length > 0 && filteredToCash.length === 0 && (
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
                const order = getOrders().find((o) => o.id === p.orderId);
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
                const order = getOrders().find((o) => o.id === p.orderId);
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

      {/* ============================================================
          CHAT WITH BARISTA — slide-over drawer
         ============================================================ */}
      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
              onClick={() => setChatOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[9999] w-full sm:w-[460px] bg-[#0C0C0C] border-l border-white/[0.06] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06] bg-[#0A0A0A] flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/15 flex-shrink-0">
                    <Coffee className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold">Chat avec le barista</h2>
                    <p className="text-xs text-white/40">Communication directe cuisine ↔ service</p>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/[0.05] flex-shrink-0">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 min-h-0 p-4">
                <ChatPanel
                  conversationId="waiter-barista"
                  senderName={user?.name || 'Waiter'}
                  senderRole={waiterTitle}
                  placeholder="Écrire au barista..."
                  emptyText="Aucun message. Dites bonjour au barista !"
                  heightClass="h-full"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
