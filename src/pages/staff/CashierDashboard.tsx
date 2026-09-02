// ============================================================
// HEBLI – Waiter Dashboard  (internal role value stays "Cashier")
// ============================================================
//  • Waiter labels (Serveur), no "Aujourd'hui"/"Cette semaine" cards
//  • Nouvelles commandes list + LEFT-anchored new-order toast
//  • System Table floor map:
//      - tap a FREE table   → create a new order (product picker) for it
//      - tap an OCCUPIED one → order details + total + "Encaisser"
//  • Chat with barista (conversation id "waiter-barista")
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee, DollarSign, Check, Receipt, User, Clock, Timer, Search, FileText,
  Utensils, Bell, MessageCircle, X, Armchair, Sparkles, Plus, Minus, Trash2, ShoppingCart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GoldButton from '@/components/ui/GoldButton';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import StaffTopBar from '@/components/StaffTopBar';
import ChatPanel from '@/components/ChatPanel';
import CategoryIcon from '@/components/CategoryIcon';
import { useApp } from '@/contexts/AppContext';
import {
  getOrders, addOrder, updateOrderStatus, addPayment, addAuditLog, addNotification, getPayments,
  setOrderTable, TABLE_COUNT, getActiveProducts,
} from '@/utils/store';
import { getStaffTitle } from '@/utils/roles';
import type { Order, Payment, Product, CartItem } from '@/types';
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

  // Chat with barista drawer
  const [chatOpen, setChatOpen] = useState(false);

  // New-order toast (left anchored)
  const [toast, setToast] = useState<string | null>(null);
  const prevPendingRef = useRef(0);
  const initializedRef = useRef(false);

  // System Table dialogs
  const [newOrderTable, setNewOrderTable] = useState<number | null>(null); // creating order for a free table
  const [detailTable, setDetailTable] = useState<number | null>(null);     // viewing an occupied table

  // New-order builder state
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [builderNote, setBuilderNote] = useState('');

  const loadOrders = useCallback(() => {
    const all = getOrders();
    const relevant = all.filter((o) => o.status !== 'Paid');
    relevant.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    setOrders(relevant);

    // LEFT toast when a new pending order appears
    const pendingCount = relevant.filter((o) => o.status === 'Pending').length;
    if (initializedRef.current && pendingCount > prevPendingRef.current) {
      setToast(`Nouvelle commande ! (${pendingCount} en attente)`);
      setTimeout(() => setToast(null), 4500);
    }
    prevPendingRef.current = pendingCount;
    initializedRef.current = true;

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
    setProducts(getActiveProducts());
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  useEffect(() => { loadOrders(); }, [syncTick, loadOrders]);

  // ---- Derived lists -------------------------------------------------------
  const newOrders = orders.filter((o) => o.status === 'Pending');
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

  // Map of tableNumber -> order for the floor map
  const tableMap = new Map<number, Order>();
  orders.forEach((o) => { if (o.tableNumber) tableMap.set(o.tableNumber, o); });

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
      setDetailTable(null);
    }, 500);
  };

  const clearTable = (tableNumber: number) => {
    const occupant = orders.find((o) => o.tableNumber === tableNumber);
    if (occupant) { setOrderTable(occupant.id, undefined); loadOrders(); }
    setDetailTable(null);
  };

  // ---- New order builder ---------------------------------------------------
  const openNewOrder = (tableNumber: number) => {
    setCart([]); setBuilderNote(''); setNewOrderTable(tableNumber);
  };
  const addToCart = (p: Product) => setCart((prev) => {
    const ex = prev.find((i) => i.productId === p.id);
    if (ex) return prev.map((i) => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
    return [...prev, { productId: p.id, name: p.name, price: p.price, quantity: 1, image: p.image }];
  });
  const decFromCart = (id: string) => setCart((prev) => {
    const ex = prev.find((i) => i.productId === id);
    if (ex && ex.quantity > 1) return prev.map((i) => i.productId === id ? { ...i, quantity: i.quantity - 1 } : i);
    return prev.filter((i) => i.productId !== id);
  });
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const submitNewOrder = () => {
    if (newOrderTable === null || cart.length === 0) return;
    const id = 'ORD-' + String(Date.now()).slice(-6);
    const now = new Date().toISOString();
    const order: Order = {
      id,
      clientName: `Table ${newOrderTable}`,
      items: [...cart],
      total: cartTotal,
      status: 'Pending',
      note: builderNote.trim() || undefined,
      tableNumber: newOrderTable,
      createdAt: now,
      updatedAt: now,
    };
    // addOrder appends + syncs across devices
    addOrder(order);
    addAuditLog({
      id: 'log-' + Date.now(),
      action: 'Order Placed (Waiter)',
      details: `Commande ${id} créée par le serveur pour la table ${newOrderTable} • ${cartTotal.toFixed(2)} DT`,
      user: user?.name || 'Waiter',
      timestamp: now,
    });
    // Notify the barista so it hits the production board
    addNotification({
      id: 'ntf-' + Date.now() + '-b',
      target: 'Barista',
      title: 'New Order',
      body: `${id} • Table ${newOrderTable} • ${cartTotal.toFixed(2)} DT`,
      type: 'order',
      read: false,
      createdAt: now,
    });
    setNewOrderTable(null);
    setCart([]);
    setBuilderNote('');
    refreshOrders();
    loadOrders();
  };

  const waiterTitle = user ? getStaffTitle(user) : 'Serveur';
  const detailOrder = detailTable !== null ? tableMap.get(detailTable) : undefined;

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

      {/* LEFT-anchored new order toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -80, opacity: 0 }}
            className="fixed left-4 top-20 z-50"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-[#D4AF37]/30 bg-[#111] px-5 py-3 shadow-2xl shadow-[#D4AF37]/10">
              <Bell className="h-4 w-4 text-[#D4AF37]" />
              <span className="text-sm font-medium">🔔 {toast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-3xl px-3 sm:px-4 py-4 sm:py-8">
        {/* Quick actions: Facture + Chat with barista */}
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

        {/* NEW COMMANDS */}
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-white/40">
          <Sparkles className="h-4 w-4 text-[#D4AF37]" />
          Nouvelles commandes
          {newOrders.length > 0 && (
            <span className="ml-auto rounded-full bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] text-[#D4AF37]">{newOrders.length}</span>
          )}
        </h2>

        <div className="mb-10 space-y-3">
          <AnimatePresence>
            {newOrders.map((order) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} layout>
                <GlassCard>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-lg font-bold text-[#D4AF37]">{order.id}</span>
                        <StatusBadge status={order.status} />
                        {order.tableNumber && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                            <Armchair className="h-2.5 w-2.5" /> Table {order.tableNumber}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-white/50">
                        <User className="h-3.5 w-3.5" />{order.clientName}
                        <span className="text-white/15">•</span>
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {order.items.map((item, i) => (
                          <span key={i} className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-xs text-white/50">{item.quantity}x {item.name}</span>
                        ))}
                      </div>
                      {order.note && (
                        <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-1.5 text-xs text-amber-300 inline-block">📝 {order.note}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/25">Total</div>
                      <div className="text-xl font-bold text-[#D4AF37]">{order.total.toFixed(2)} DT</div>
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

        {/* SYSTEM TABLE */}
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-white/40">
          <Armchair className="h-4 w-4 text-[#D4AF37]" />
          System Table
          <span className="ml-auto text-[10px] text-white/25 normal-case tracking-normal">Libre → nouvelle commande · Occupée → encaisser</span>
        </h2>

        <div className="mb-10 grid grid-cols-3 sm:grid-cols-4 gap-3">
          {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((num) => {
            const occupant = tableMap.get(num);
            const occupied = !!occupant;
            return (
              <button
                key={num}
                onClick={() => (occupied ? setDetailTable(num) : openNewOrder(num))}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border p-2 text-center transition-all active:scale-[0.97] ${
                  occupied
                    ? 'border-emerald-500/30 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14]'
                    : 'border-white/[0.08] bg-white/[0.02] hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/[0.06]'
                }`}
                title={occupied ? `Table ${num} — ${occupant?.id}. Tap for details / pay.` : `Table ${num} — tap to create an order`}
              >
                <Armchair className={`h-6 w-6 ${occupied ? 'text-emerald-400' : 'text-white/30'}`} />
                <span className={`mt-1 text-sm font-bold ${occupied ? 'text-emerald-300' : 'text-white/70'}`}>{num}</span>
                {occupied ? (
                  <span className="mt-0.5 text-[9px] text-white/50">{occupant?.total.toFixed(2)} DT</span>
                ) : (
                  <span className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] text-[#D4AF37]/70"><Plus className="h-2.5 w-2.5" /> Commander</span>
                )}
                <span className={`mt-0.5 text-[8px] uppercase tracking-wider ${occupied ? 'text-emerald-400/70' : 'text-white/25'}`}>{occupied ? 'Occupée' : 'Libre'}</span>
              </button>
            );
          })}
        </div>

        {/* ORDERS TO CASH */}
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-white/40">
          <Receipt className="h-4 w-4" />
          Commandes à encaisser
          {toCash.length > 0 && (<span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">{toCash.length}</span>)}
        </h2>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
          <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Search ready orders by name, ID, or item..."
            className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D4AF37]/50 transition-colors" />
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {filteredToCash.map((order) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} layout>
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
                            <Timer className="h-2.5 w-2.5" />{Math.floor(order.prepTimeSeconds / 60)}m {order.prepTimeSeconds % 60}s
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-white/50">
                        <User className="h-3.5 w-3.5" />{order.clientName}
                        <span className="text-white/15">•</span>
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {order.items.map((item, i) => (
                          <span key={i} className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-xs text-white/50">{item.quantity}x {item.name}</span>
                        ))}
                      </div>
                      {order.note && (
                        <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-1.5 text-xs text-amber-300 inline-block">📝 {order.note}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-white/25">Total</div>
                        <div className="text-xl font-bold text-[#D4AF37]">{order.total.toFixed(2)} DT</div>
                      </div>
                      <GoldButton onClick={() => markAsPaid(order)} disabled={processingId === order.id || order.status !== 'Ready'}>
                        {processingId === order.id ? (<><Coffee className="h-4 w-4 animate-spin" />En cours</>)
                          : order.status !== 'Ready' ? (<><Clock className="h-4 w-4" />En préparation</>)
                          : (<><DollarSign className="h-4 w-4" />Encaisser</>)}
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
            <Check className="h-4 w-4" />Commandes encaissées aujourd'hui
          </h2>
          {todayPayments.length > 0 ? (
            <div className="space-y-2">
              {todayPayments.map((p) => {
                const order = getOrders().find((o) => o.id === p.orderId);
                const prepStr = order?.prepTimeSeconds ? `${Math.floor(order.prepTimeSeconds / 60)}m ${order.prepTimeSeconds % 60}s` : '--';
                return (
                  <GlassCard key={p.id} className="flex items-center justify-between p-4" hover={false}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#D4AF37]">{p.orderId}</span>
                        <span className="text-[10px] text-white/30 font-mono bg-white/[0.03] px-2 py-0.5 rounded-full flex items-center gap-1"><Timer className="h-2.5 w-2.5" /> {prepStr}</span>
                      </div>
                      <div className="text-xs text-white/30 mt-1">{p.time}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{p.amount.toFixed(2)} DT</span>
                      <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-green-400">✓ Payé</span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          ) : (<div className="py-8 text-center text-white/20 text-sm">Aucun paiement enregistré aujourd'hui.</div>)}
        </div>

        {/* Payment History */}
        <div className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-white/40">
            <Receipt className="h-4 w-4" />Historique des paiements
            <span className="ml-auto rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/35">{filteredHistory.length}</span>
          </h2>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
            <input value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} placeholder="Search history by order ID, customer name, date, or item..."
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D4AF37]/50 transition-colors" />
          </div>
          {filteredHistory.length > 0 ? (
            <div className="space-y-2">
              {filteredHistory.slice(0, 20).map((p) => {
                const order = getOrders().find((o) => o.id === p.orderId);
                const prepStr = order?.prepTimeSeconds ? `${Math.floor(order.prepTimeSeconds / 60)}m ${order.prepTimeSeconds % 60}s` : '--';
                return (
                  <GlassCard key={p.id} className="p-4" hover={false}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-[#D4AF37]">{p.orderId}</span>
                          <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-green-400">Paid</span>
                          <span className="text-[10px] text-white/30 font-mono bg-white/[0.03] px-2 py-0.5 rounded-full flex items-center gap-1"><Timer className="h-2.5 w-2.5" /> {prepStr}</span>
                        </div>
                        <div className="mt-1 text-xs text-white/35 truncate">{order?.clientName || 'Unknown client'} • {p.date} • {p.time}</div>
                        {order && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {order.items.map((item, i) => (<span key={i} className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/45">{item.quantity}x {item.name}</span>))}
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
          ) : (<div className="py-8 text-center text-white/20 text-sm">No payment history matches this search.</div>)}
        </div>
      </main>

      {/* ============================================================
          CREATE ORDER FOR A FREE TABLE
         ============================================================ */}
      <AnimatePresence>
        {newOrderTable !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm" onClick={() => setNewOrderTable(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed inset-x-0 bottom-0 z-[9999] max-h-[92vh] rounded-t-3xl bg-[#0C0C0C] border-t border-white/[0.08] shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/15"><Armchair className="h-5 w-5 text-[#D4AF37]" /></div>
                  <div>
                    <h2 className="text-lg font-bold">Nouvelle commande · Table {newOrderTable}</h2>
                    <p className="text-xs text-white/40">Choisir les articles</p>
                  </div>
                </div>
                <button onClick={() => setNewOrderTable(null)} className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/[0.05]"><X className="h-5 w-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products.map((p) => {
                  const inCart = cart.find((i) => i.productId === p.id);
                  return (
                    <button key={p.id} onClick={() => addToCart(p)}
                      className="relative flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 text-left transition-all hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/[0.05] active:scale-[0.98]">
                      <div className="mb-2 flex h-16 items-center justify-center rounded-xl bg-white/[0.03] text-3xl">
                        <CategoryIcon category={p.category} className="h-8 w-8 text-[#D4AF37]" />
                      </div>
                      <span className="text-sm font-semibold leading-tight line-clamp-2">{p.name}</span>
                      <span className="mt-1 text-xs text-[#D4AF37] font-bold">{p.price.toFixed(2)} DT</span>
                      {inCart && (
                        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-black">{inCart.quantity}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Cart footer */}
              <div className="flex-shrink-0 border-t border-white/[0.06] p-4 space-y-3">
                {cart.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1.5">
                    {cart.map((i) => (
                      <div key={i.productId} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex-1 truncate text-white/70">{i.name}</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => decFromCart(i.productId)} className="rounded-lg bg-white/[0.05] p-1 hover:bg-white/[0.1]"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-5 text-center font-semibold">{i.quantity}</span>
                          <button onClick={() => addToCart(products.find((p) => p.id === i.productId)!)} className="rounded-lg bg-white/[0.05] p-1 hover:bg-white/[0.1]"><Plus className="h-3.5 w-3.5" /></button>
                          <span className="w-16 text-right text-[#D4AF37] font-semibold">{(i.price * i.quantity).toFixed(2)}</span>
                          <button onClick={() => setCart((prev) => prev.filter((c) => c.productId !== i.productId))} className="rounded-lg p-1 text-red-400/70 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <input value={builderNote} onChange={(e) => setBuilderNote(e.target.value)} placeholder="Note (ex: sans sucre, extra chaud...)"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D4AF37]/50" />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/50">{cartCount} article{cartCount !== 1 ? 's' : ''}</div>
                  <div className="text-lg font-bold text-[#D4AF37]">{cartTotal.toFixed(2)} DT</div>
                </div>
                <GoldButton onClick={submitNewOrder} disabled={cart.length === 0} className="w-full justify-center">
                  <ShoppingCart className="h-4 w-4" /> Envoyer la commande
                </GoldButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============================================================
          OCCUPIED TABLE — DETAILS + ENCAISSER
         ============================================================ */}
      <AnimatePresence>
        {detailTable !== null && detailOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm" onClick={() => setDetailTable(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed left-1/2 top-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-[#0C0C0C] border border-white/[0.08] shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15"><Armchair className="h-5 w-5 text-emerald-400" /></div>
                  <div>
                    <h2 className="text-lg font-bold">Table {detailTable}</h2>
                    <p className="text-xs text-white/40">{detailOrder.id} · {detailOrder.clientName}</p>
                  </div>
                </div>
                <button onClick={() => setDetailTable(null)} className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/[0.05]"><X className="h-5 w-5" /></button>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2"><StatusBadge status={detailOrder.status} /></div>
                <div className="space-y-1.5">
                  {detailOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-white/70">{item.quantity}x {item.name}</span>
                      <span className="text-white/50">{(item.price * item.quantity).toFixed(2)} DT</span>
                    </div>
                  ))}
                </div>
                {detailOrder.note && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-300">📝 {detailOrder.note}</div>
                )}
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <span className="text-sm font-semibold text-white/60">Total</span>
                  <span className="text-2xl font-bold text-[#D4AF37]">{detailOrder.total.toFixed(2)} DT</span>
                </div>
              </div>

              <div className="flex gap-2 p-5 pt-0">
                <button onClick={() => clearTable(detailTable!)} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/60 hover:bg-white/[0.05]">
                  Libérer la table
                </button>
                <GoldButton onClick={() => markAsPaid(detailOrder)} disabled={processingId === detailOrder.id || detailOrder.status !== 'Ready'} className="flex-1 justify-center">
                  {processingId === detailOrder.id ? (<><Coffee className="h-4 w-4 animate-spin" />En cours</>)
                    : detailOrder.status !== 'Ready' ? (<><Clock className="h-4 w-4" />En préparation</>)
                    : (<><DollarSign className="h-4 w-4" />Encaisser</>)}
                </GoldButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============================================================
          CHAT WITH BARISTA
         ============================================================ */}
      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[9999] w-full sm:w-[460px] bg-[#0C0C0C] border-l border-white/[0.06] shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06] bg-[#0A0A0A] flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/15 flex-shrink-0"><Coffee className="h-5 w-5 text-[#D4AF37]" /></div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold">Chat avec le barista</h2>
                    <p className="text-xs text-white/40">Communication directe cuisine ↔ service</p>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/[0.05] flex-shrink-0"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 min-h-0 p-4">
                <ChatPanel conversationId="waiter-barista" senderName={user?.name || 'Waiter'} senderRole={waiterTitle}
                  placeholder="Écrire au barista..." emptyText="Aucun message. Dites bonjour au barista !" heightClass="h-full" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
