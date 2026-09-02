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
  Coffee, DollarSign, Check, User, Clock, FileText,
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
  getOrders, addOrder, updateOrderStatus, addPayment, addAuditLog, addNotification,
  setOrderTable, TABLE_COUNT, getActiveProducts,
} from '@/utils/store';
import { getStaffTitle } from '@/utils/roles';
import type { Order, Product, CartItem } from '@/types';
import { format } from 'date-fns';

export default function CashierDashboard() {
  const navigate = useNavigate();
  const { user, logoutUser, refreshOrders, syncTick } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Chat with barista drawer
  const [chatOpen, setChatOpen] = useState(false);

  // New-order toast (left anchored)
  const [toast, setToast] = useState<string | null>(null);
  const prevPendingRef = useRef(0);
  const initializedRef = useRef(false);

  // System Table dialogs
  const [pickTableOpen, setPickTableOpen] = useState(false);               // choose a free table for a new order
  const [newOrderTable, setNewOrderTable] = useState<number | null>(null); // creating order for a free table
  const [detailTable, setDetailTable] = useState<number | null>(null);     // viewing an occupied table

  // New-order builder state
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [builderNote, setBuilderNote] = useState('');

  const loadOrders = useCallback(() => {
    const all = getOrders();
    // Keep unpaid orders + PAID orders that still hold a table (not freed yet),
    // so a paid table stays visible with a "Payée" badge until "Libérer".
    const relevant = all.filter((o) => o.status !== 'Paid' || o.tableNumber);
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
  }, []);

  useEffect(() => {
    setProducts(getActiveProducts());
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  useEffect(() => { loadOrders(); }, [syncTick, loadOrders]);

  // ---- Derived lists -------------------------------------------------------
  const newOrders = orders.filter((o) => o.status === 'Pending');

  // Map of tableNumber -> order for the floor map.
  // If a table has several orders, prefer the UNPAID one (still to collect);
  // otherwise the paid order stays so we can show the "Payée" badge.
  const tableMap = new Map<number, Order>();
  orders.forEach((o) => {
    if (!o.tableNumber) return;
    const existing = tableMap.get(o.tableNumber);
    if (!existing) { tableMap.set(o.tableNumber, o); return; }
    const existingUnpaid = existing.status !== 'Paid';
    const thisUnpaid = o.status !== 'Paid';
    if (thisUnpaid && !existingUnpaid) tableMap.set(o.tableNumber, o);
  });
  // Only occupied tables, sorted by table number.
  const occupiedTables = Array.from(tableMap.keys()).sort((a, b) => a - b);

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
      // Keep the dialog OPEN so the waiter sees "Payée" + the "Libérer" action.
    }, 500);
  };

  // "Libérer" — free the table (removes tableNumber from every order at it).
  const clearTable = (tableNumber: number) => {
    orders.filter((o) => o.tableNumber === tableNumber)
      .forEach((o) => setOrderTable(o.id, undefined));
    loadOrders();
    setDetailTable(null);
  };

  // ---- New order builder ---------------------------------------------------
  const openNewOrder = (tableNumber: number) => {
    setCart([]); setBuilderNote(''); setPickTableOpen(false); setNewOrderTable(tableNumber);
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

        {/* SYSTEM TABLE — occupied tables only */}
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-white/40">
          <Armchair className="h-4 w-4 text-[#D4AF37]" />
          System Table
          {occupiedTables.length > 0 && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">{occupiedTables.length}</span>
          )}
          <button
            onClick={() => setPickTableOpen(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] px-3 py-1.5 text-[11px] font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/[0.16] transition-colors normal-case tracking-normal"
            title="Créer une commande pour une nouvelle table"
          >
            <Plus className="h-3.5 w-3.5" /> Nouvelle table
          </button>
        </h2>

        <div className="mb-10 grid grid-cols-3 sm:grid-cols-4 gap-3">
          {occupiedTables.map((num) => {
            const occupant = tableMap.get(num)!;
            const paid = occupant.status === 'Paid';
            return (
              <button
                key={num}
                onClick={() => setDetailTable(num)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border p-2 text-center transition-all active:scale-[0.97] ${
                  paid
                    ? 'border-[#D4AF37]/40 bg-[#D4AF37]/[0.08] hover:bg-[#D4AF37]/[0.14]'
                    : 'border-emerald-500/30 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14]'
                }`}
                title={`Table ${num} — ${occupant.id}. Tap for details.`}
              >
                <Armchair className={`h-6 w-6 ${paid ? 'text-[#D4AF37]' : 'text-emerald-400'}`} />
                <span className={`mt-1 text-sm font-bold ${paid ? 'text-[#D4AF37]' : 'text-emerald-300'}`}>{num}</span>
                <span className="mt-0.5 text-[9px] text-white/50">{occupant.total.toFixed(2)} DT</span>
                <span className={`mt-0.5 rounded-full px-1.5 text-[8px] font-bold uppercase tracking-wider ${
                  paid ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-emerald-400/70'
                }`}>
                  {paid ? '✓ Payée' : 'Occupée'}
                </span>
              </button>
            );
          })}

          {occupiedTables.length === 0 && (
            <div className="col-span-3 sm:col-span-4 py-14 text-center text-white/20">
              <Armchair className="mx-auto h-10 w-10 opacity-30" />
              <p className="mt-3 text-sm">Aucune table occupée.</p>
              <button
                onClick={() => setPickTableOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] px-4 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/[0.16]"
              >
                <Plus className="h-3.5 w-3.5" /> Nouvelle table
              </button>
            </div>
          )}
        </div>

      </main>

      {/* ============================================================
          PICK A FREE TABLE (for a brand-new waiter order)
         ============================================================ */}
      <AnimatePresence>
        {pickTableOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm" onClick={() => setPickTableOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed left-1/2 top-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-[#0C0C0C] border border-white/[0.08] shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/15"><Plus className="h-5 w-5 text-[#D4AF37]" /></div>
                  <div>
                    <h2 className="text-lg font-bold">Choisir une table libre</h2>
                    <p className="text-xs text-white/40">Pour une nouvelle commande</p>
                  </div>
                </div>
                <button onClick={() => setPickTableOpen(false)} className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/[0.05]"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5 grid grid-cols-4 gap-3">
                {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((num) => {
                  const busy = tableMap.has(num);
                  return (
                    <button
                      key={num}
                      disabled={busy}
                      onClick={() => openNewOrder(num)}
                      className={`flex aspect-square flex-col items-center justify-center rounded-2xl border p-2 text-center transition-all active:scale-[0.97] ${
                        busy
                          ? 'border-white/[0.05] bg-white/[0.01] text-white/15 cursor-not-allowed'
                          : 'border-[#D4AF37]/30 bg-[#D4AF37]/[0.06] text-[#D4AF37] hover:bg-[#D4AF37]/[0.16]'
                      }`}
                      title={busy ? `Table ${num} occupée` : `Table ${num} libre`}
                    >
                      <Armchair className="h-5 w-5" />
                      <span className="mt-1 text-sm font-bold">{num}</span>
                      <span className="mt-0.5 text-[8px] uppercase tracking-wider">{busy ? 'Occupée' : 'Libre'}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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

              <div className="p-5 pt-0">
                {detailOrder.status === 'Paid' ? (
                  <>
                    <div className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] py-2.5 text-sm font-bold text-[#D4AF37]">
                      <Check className="h-4 w-4" /> Payée
                    </div>
                    <button
                      onClick={() => clearTable(detailTable!)}
                      className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-black hover:bg-amber-400 transition-colors active:scale-[0.98]"
                    >
                      Libérer la table
                    </button>
                  </>
                ) : (
                  <GoldButton
                    onClick={() => markAsPaid(detailOrder)}
                    disabled={processingId === detailOrder.id || detailOrder.status !== 'Ready'}
                    className="w-full justify-center"
                  >
                    {processingId === detailOrder.id ? (<><Coffee className="h-4 w-4 animate-spin" />En cours</>)
                      : detailOrder.status !== 'Ready' ? (<><Clock className="h-4 w-4" />En préparation</>)
                      : (<><DollarSign className="h-4 w-4" />Encaisser</>)}
                  </GoldButton>
                )}
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
