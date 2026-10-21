// ============================================================
// HEBLI – Client Menu Ordering Page (Redesigned)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ShoppingCart, Plus, Minus, Trash2, ArrowLeft, Search, Check, Coffee, X, Sparkles, ChevronRight, Armchair,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useT } from '@/i18n/I18nProvider';
import { useApp } from '@/contexts/AppContext';
import { getActiveProducts, getCategories, getOrders, addOrder, addAuditLog, addNotification, TABLE_COUNT, upsertLoyaltyMember, formatMoney } from '@/utils/store';
import { subscribePhase2Events } from '@/utils/api';
import CategoryIcon from '@/components/CategoryIcon';
import type { Product, CartItem, Category, Supplement, Order } from '@/types';

export default function Menu() {
  const navigate = useNavigate();
  const { t } = useT();
  const { syncTick } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [occupiedTables, setOccupiedTables] = useState<number[]>([]);
  const [orderError, setOrderError] = useState('');
  // Keep the checkout compact on desktop/tablets: optional note/VIP fields are
  // expandable, while the Confirm button stays visible at all times.
  const [checkoutOptionsOpen, setCheckoutOptionsOpen] = useState(false);
  // The table this device is "using" (chosen earlier) — this client may keep
  // ordering for it even though it shows as occupied to everyone else.
  const [myTable, setMyTable] = useState<number | null>(() => {
    const v = parseInt(localStorage.getItem('hebli_client_table') || '', 10);
    return v >= 1 ? v : null;
  });
  const [orderNote, setOrderNote] = useState('');
  const [loyaltyName, setLoyaltyName] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [finalTotal, setFinalTotal] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);
  // Supplement chooser
  const [suppProduct, setSuppProduct] = useState<Product | null>(null);
  const [chosenSupps, setChosenSupps] = useState<Supplement[]>([]);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  // Stability mode: menu/order UX is local-first and confirms instantly.
  // PostgreSQL sync happens in the background through the optimized state sync.
  useEffect(() => {
    setProducts(getActiveProducts());
    setCategories(getCategories());
  }, [syncTick]);

  const refreshTables = useCallback(() => {
    const taken = new Set<number>();
    getOrders().forEach((order) => {
      if (order.tableNumber && order.status !== 'Cancelled' && order.status !== 'Paid') taken.add(order.tableNumber);
    });
    setOccupiedTables(Array.from(taken));
  }, []);

  useEffect(() => {
    if (!cartOpen) return;
    refreshTables();
    // SSE gives instant table refresh. syncTick is the cross-device safety net.
    const unsubscribe = subscribePhase2Events('client', refreshTables, refreshTables);
    return unsubscribe;
  }, [cartOpen, syncTick, refreshTables]);

  const filtered = products.filter((p) => {
    const catMatch = activeCategory === 'All' || p.category === activeCategory;
    const searchMatch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  // A stable signature so identical product + supplement combos stack together.
  const lineKey = (i: { productId: string; supplements?: { id: string }[] }) =>
    i.productId + '|' + (i.supplements || []).map((s) => s.id).sort().join(',');

  // Click a product: if it has supplements, open the chooser; else add directly.
  const onProductClick = (product: Product) => {
    if (product.supplements && product.supplements.length > 0) {
      setSuppProduct(product);
      setChosenSupps([]);
    } else {
      addToCart(product);
    }
  };

  const addToCart = (product: Product, supplements: { id: string; name: string; price: number }[] = []) => {
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 600);
    const unitPrice = product.price + supplements.reduce((s, x) => s + x.price, 0);
    const newLine: CartItem = {
      productId: product.id, name: product.name, price: unitPrice, quantity: 1,
      image: product.image, supplements: supplements.length ? supplements : undefined,
    };
    const key = lineKey(newLine);
    setCart((prev) => {
      const existing = prev.find((i) => lineKey(i) === key);
      if (existing) return prev.map((i) => (lineKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, newLine];
    });
  };

  const removeFromCart = (key: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => lineKey(i) === key);
      if (existing && existing.quantity > 1) {
        return prev.map((i) => (lineKey(i) === key ? { ...i, quantity: i.quantity - 1 } : i));
      }
      return prev.filter((i) => lineKey(i) !== key);
    });
  };

  const deleteFromCart = (key: string) => {
    setCart((prev) => prev.filter((i) => lineKey(i) !== key));
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const placeOrder = () => {
    const tableNumber = selectedTable;
    if (!tableNumber || tableNumber < 1 || tableNumber > TABLE_COUNT || !cart.length) return;
    setOrderError('');

    // Stable local-first order: confirmation is immediate. atomicWrite schedules
    // PostgreSQL sync in the background; it never blocks the customer checkout.
    const id = 'ORD-' + String(Date.now()).slice(-8);
    const loyaltyId = loyaltyName.trim() ? upsertLoyaltyMember(loyaltyName.trim()) : undefined;
    const now = new Date().toISOString();
    const order: Order = {
      id,
      clientName: `Table ${tableNumber}`,
      items: [...cart],
      total,
      status: 'Pending',
      note: orderNote.trim() || undefined,
      tableNumber,
      loyaltyId,
      createdAt: now,
      updatedAt: now,
    };
    addOrder(order);
    addAuditLog({ id: 'log-' + Date.now(), action: 'Order Placed', details: `Order ${id} for Table ${tableNumber} • ${formatMoney(total)}`, user: order.clientName, timestamp: now });
    addNotification({ id: 'ntf-' + Date.now() + '-b', target: 'Barista', title: 'New Order', body: `${id} • Table ${tableNumber} • ${formatMoney(total)}`, type: 'order', read: false, createdAt: now });
    addNotification({ id: 'ntf-' + Date.now() + '-w', target: 'Cashier', title: 'New Order', body: `${id} • Table ${tableNumber} • ${formatMoney(total)}`, type: 'order', read: false, createdAt: now });

    localStorage.setItem('hebli_client_name', order.clientName);
    localStorage.setItem('hebli_client_table', String(tableNumber));
    localStorage.setItem('hebli_last_order_id', order.id);
    setMyTable(tableNumber);
    setOrderId(order.id);
    setFinalTotal(order.total);
    setOrderNote('');
    setLoyaltyName('');
    setOrderPlaced(true); // confirmation modal shows immediately
    setCart([]);
    setSelectedTable(null);
    refreshTables();
  };

  return (
    <div className="min-h-screen bg-[#0B1512] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#D4AF37]/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0B1512]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-[#D4AF37]">HEBLI</span> <span className="hidden sm:inline">{t('menu.title')}</span>
          </h1>
          <div className="flex-1" />
          <LanguageSwitcher />
          <button
            onClick={() => setCartOpen(true)}
            className="relative rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-white/70 hover:text-white hover:border-white/20 transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-black"
              >
                {totalItems}
              </motion.span>
            )}
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 pb-32">
        {/* Hero Section */}
        <motion.div
          ref={heroRef}
          style={{ y: heroY, opacity: heroOpacity }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-1.5 mb-4"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-xs font-semibold tracking-[0.15em] text-[#D4AF37] uppercase">{t('menu.premiumSelection')}</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            {t('menu.crafted')} <span className="text-[#D4AF37]">{t('menu.perfection')}</span>
          </h2>
          <p className="text-white/40 max-w-md mx-auto">
            {t('menu.tagline')}
          </p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-8 max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            placeholder={t('menu.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D4AF37]/50 transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide justify-center flex-wrap">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveCategory('All')}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium tracking-wider uppercase transition-all ${
              activeCategory === 'All'
                ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20'
                : 'border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t('menu.all')}
          </motion.button>
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.name)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium tracking-wider uppercase transition-all ${
                activeCategory === cat.name
                  ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20'
                  : 'border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20'
              }`}
            >
              <CategoryIcon category={cat.name} className="h-3.5 w-3.5" />
              {cat.name}
            </motion.button>
          ))}
        </div>

        {/* Products Grid */}
        <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <GlassCard
                  className="h-full flex flex-col group cursor-pointer relative overflow-hidden"
                  onClick={() => onProductClick(product)}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/0 to-[#D4AF37]/0 group-hover:from-[#D4AF37]/5 group-hover:to-amber-600/5 transition-all duration-500" />

                  <div className="mb-4 flex h-40 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/10 to-amber-600/5 overflow-hidden relative z-10">
                    {/* Luxury ornaments when no image */}
                    {!product.image && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-[80%] w-[80%] rounded-full border border-[#D4AF37]/10" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-[55%] w-[55%] rounded-full border border-[#D4AF37]/15" />
                        </div>
                        <div className="absolute top-2.5 left-2.5 h-2 w-2 border-t border-l border-[#D4AF37]/25" />
                        <div className="absolute top-2.5 right-2.5 h-2 w-2 border-t border-r border-[#D4AF37]/25" />
                        <div className="absolute bottom-2.5 left-2.5 h-2 w-2 border-b border-l border-[#D4AF37]/25" />
                        <div className="absolute bottom-2.5 right-2.5 h-2 w-2 border-b border-r border-[#D4AF37]/25" />
                      </>
                    )}
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <motion.div
                        animate={addedId === product.id ? { scale: [1, 1.2, 1] } : {}}
                        className="relative transition-transform duration-500 group-hover:scale-110"
                      >
                        <CategoryIcon
                          category={product.category}
                          className="h-12 w-12 text-[#D4AF37]/60 group-hover:text-[#D4AF37]/90 transition-colors"
                          strokeWidth={1.1}
                        />
                      </motion.div>
                    )}
                  </div>

                  <div className="relative z-10 flex-1 flex flex-col">
                    <div className="mb-1 text-[10px] font-medium tracking-wider text-[#D4AF37] uppercase">
                      {product.category}
                    </div>
                    <h3 className="font-semibold text-white group-hover:text-[#D4AF37] transition-colors text-lg">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-xs text-white/40 line-clamp-2 flex-1 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xl font-bold text-white">{formatMoney(product.price)}</span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        className={`rounded-full p-2 transition-colors ${
                          addedId === product.id
                            ? 'bg-green-500 text-white'
                            : 'bg-[#D4AF37] text-black hover:bg-amber-400'
                        }`}
                      >
                        {addedId === product.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-white/30">
            <Coffee className="mx-auto h-12 w-12 opacity-30" />
            <p className="mt-4">{t('menu.noResults')}</p>
          </div>
        )}
      </main>

      {/* ========================================================
          STICKY CHECKOUT BAR — appears when cart has items
          ======================================================== */}
      <AnimatePresence>
        {totalItems > 0 && !cartOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4 sm:pb-4 pointer-events-none"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
          >
            <div className="mx-auto max-w-md pointer-events-auto">
              <motion.button
                onClick={() => setCartOpen(true)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 px-5 py-4 text-black shadow-[0_20px_60px_-15px_rgba(212,175,55,0.7)] backdrop-blur"
              >
                {/* Shimmer */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full transition-transform duration-1000" />

                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-black/15">
                      <ShoppingCart className="h-5 w-5" />
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-black text-[#D4AF37]">
                        {totalItems}
                      </span>
                    </div>
                    <div className="text-left leading-tight">
                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-70">{t('cart.review')}</div>
                      <div className="text-base font-black">{t('cart.goCheckout')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right leading-tight">
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{t('common.total')}</div>
                      <div className="text-base font-black tracking-tight">{formatMoney(total)}</div>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/15 group-hover:translate-x-0.5 transition-transform">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#0E1A16] border-l border-white/[0.06] shadow-2xl"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b border-white/[0.04]">
                  <div>
                    <h2 className="text-lg font-bold">{t('cart.title')}</h2>
                    <p className="text-sm text-white/30">{totalItems} {totalItems === 1 ? t('cart.itemCount') : t('cart.itemsCount')}</p>
                  </div>
                  <button onClick={() => setCartOpen(false)} className="rounded-xl p-2 text-white/40 hover:text-white hover:bg-white/[0.04]">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {cart.length === 0 ? (
                    <div className="py-20 text-center">
                      <ShoppingCart className="mx-auto h-12 w-12 text-white/10" />
                      <p className="mt-4 text-white/30">{t('cart.empty')}</p>
                      <p className="text-sm text-white/15">{t('cart.emptyHint')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map(item => {
                        const key = lineKey(item);
                        return (
                        <motion.div
                          key={key}
                          layout
                          className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-[#12211C] p-3"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                            <Coffee className="h-5 w-5 text-[#D4AF37]/70" strokeWidth={1.4} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.name}</div>
                            {item.supplements && item.supplements.length > 0 && (
                              <div className="text-[11px] text-[#D4AF37]/80 truncate">
                                + {item.supplements.map((s) => s.name).join(', ')}
                              </div>
                            )}
                            <div className="text-xs text-white/30">{formatMoney(item.price)} {t('cart.eachPrice')}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeFromCart(key)} className="rounded-lg p-1 text-white/30 hover:text-white hover:bg-white/[0.04]">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                            <button
                              onClick={() => setCart((prev) => prev.map((i) => (lineKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i)))}
                              className="rounded-lg p-1 text-white/30 hover:text-white hover:bg-white/[0.04]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => deleteFromCart(key)} className="ml-1 rounded-lg p-1 text-white/20 hover:text-red-400">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );})}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  /* Sticky checkout: Confirm always stays above the viewport/taskbar. */
                  <div className="shrink-0 border-t border-white/[0.06] bg-[#0E1A16]/95 p-4 sm:p-5 backdrop-blur-xl space-y-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40">{t('common.total')}</span>
                      <span className="text-2xl font-bold text-[#D4AF37]">{formatMoney(total)}</span>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold tracking-wider uppercase text-white/40">
                        <span className="flex items-center gap-2">
                          <Armchair className="h-3.5 w-3.5 text-[#D4AF37]" />
                          {t('cart.chooseTable')}
                        </span>
                        {selectedTable && (
                          <span className="rounded-full bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] text-[#D4AF37]">
                            Table {selectedTable}
                          </span>
                        )}
                      </div>

                      {/* 27 tables scroll inside this compact area — it cannot push
                          the confirmation action outside the screen. */}
                      <div className="max-h-[25vh] overflow-y-auto rounded-2xl border border-white/[0.06] bg-black/10 p-2 pr-1 scrollbar-hide">
                        <div className="grid grid-cols-5 gap-2 pr-1">
                          {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((num) => {
                            const active = selectedTable === num;
                            const isMine = myTable === num;
                            const locked = occupiedTables.includes(num) && !isMine;
                            return (
                              <button
                                key={num}
                                type="button"
                                disabled={locked}
                                onClick={() => { setSelectedTable(num); setOrderError(''); }}
                                className={`relative flex aspect-[1.15] flex-col items-center justify-center rounded-xl border text-center transition-all active:scale-[0.95] ${
                                  locked
                                    ? 'border-white/[0.04] bg-white/[0.01] text-white/15 cursor-not-allowed'
                                    : active
                                    ? 'border-[#D4AF37] bg-[#D4AF37]/[0.15] text-[#D4AF37] ring-2 ring-[#D4AF37]/40'
                                    : 'border-white/[0.06] bg-white/[0.02] text-white/60 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/[0.06]'
                                }`}
                                title={locked ? `Table ${num} occupée` : isMine ? `Votre table ${num}` : `Table ${num}`}
                              >
                                <Armchair className={`h-3.5 w-3.5 ${locked ? 'text-white/15' : active ? 'text-[#D4AF37]' : 'text-white/40'}`} />
                                <span className="mt-0.5 text-sm font-bold">{num}</span>
                                {isMine && !locked && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Optional fields are collapsed by default to protect space. */}
                    <button
                      type="button"
                      onClick={() => setCheckoutOptionsOpen((v) => !v)}
                      className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white/45 hover:text-white/70"
                    >
                      <span>Note & VIP (optionnel)</span>
                      <span className="text-[#D4AF37]">{checkoutOptionsOpen ? '−' : '+'}</span>
                    </button>
                    {checkoutOptionsOpen && (
                      <div className="space-y-2">
                        <textarea
                          placeholder={t('cart.notePlaceholder')}
                          value={orderNote}
                          onChange={e => setOrderNote(e.target.value)}
                          rows={2}
                          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 px-3 text-sm text-white placeholder:text-white/15 outline-none focus:border-white/20 resize-none"
                        />
                        <input
                          type="text"
                          placeholder={t('cart.loyaltyOptional')}
                          value={loyaltyName}
                          onChange={e => setLoyaltyName(e.target.value)}
                          className="w-full rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] py-2.5 px-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/50"
                        />
                      </div>
                    )}

                    {orderError && <p className="text-center text-xs text-red-400">{orderError}</p>}
                    <button
                      onClick={placeOrder}
                      disabled={!selectedTable}
                      className="w-full rounded-2xl bg-[#D4AF37] py-3.5 text-base font-bold text-black hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-[0_10px_30px_-10px_rgba(212,175,55,0.6)]"
                    >
                      {selectedTable
                        ? `${t('cart.placeOrder')} · Table ${selectedTable} · ${formatMoney(total)}`
                        : `${t('cart.chooseTable')} · ${formatMoney(total)}`}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============================================================
          SUPPLEMENT CHOOSER (guest add-ons)
         ============================================================ */}
      <AnimatePresence>
        {suppProduct && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm" onClick={() => setSuppProduct(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed inset-x-0 bottom-0 z-[9999] max-h-[85vh] rounded-t-3xl bg-[#0E1A16] border-t border-white/[0.08] shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold truncate">{suppProduct.name}</h2>
                  <p className="text-xs text-white/40">Ajouter des suppléments (optionnel)</p>
                </div>
                <button onClick={() => setSuppProduct(null)} className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/[0.05]"><X className="h-5 w-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {(suppProduct.supplements || []).map((s) => {
                  const active = chosenSupps.some((c) => c.id === s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setChosenSupps((prev) => active ? prev.filter((c) => c.id !== s.id) : [...prev, s])}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all active:scale-[0.99] ${
                        active ? 'border-[#D4AF37] bg-[#D4AF37]/[0.12]' : 'border-white/[0.08] bg-white/[0.02] hover:border-[#D4AF37]/40'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${active ? 'border-[#D4AF37] bg-[#D4AF37] text-black' : 'border-white/20'}`}>
                          {active && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <span className="text-sm font-medium text-white/85">{s.name}</span>
                      </span>
                      <span className="text-sm font-semibold text-[#D4AF37]">+ {formatMoney(s.price)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-white/[0.06] p-4">
                <button
                  onClick={() => { addToCart(suppProduct, chosenSupps); setSuppProduct(null); }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] py-3.5 text-sm font-bold text-black hover:bg-amber-400 active:scale-[0.98] transition-all"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Ajouter · {formatMoney(suppProduct.price + chosenSupps.reduce((a, s) => a + s.price, 0))}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============================================================
          ORDER CONFIRMATION — always shown immediately after server success
         ============================================================ */}
      <AnimatePresence>
        {orderPlaced && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10020] bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="fixed left-1/2 top-1/2 z-[10021] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-[#0E1A16] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.9)]"
            >
              <div className="relative px-6 pt-8 pb-6 text-center">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#D4AF37]/12 to-transparent" />
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.12, type: 'spring', stiffness: 240 }}
                  className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-green-400/30 bg-green-500/10 shadow-[0_0_35px_rgba(74,222,128,0.15)]"
                >
                  <Check className="h-10 w-10 text-green-400" />
                </motion.div>
                <h2 className="relative text-2xl font-bold text-white">{t('order.confirmed')}</h2>
                <p className="relative mt-2 text-sm text-white/50">{t('order.confirmedHint')}</p>

                <div className="relative mt-6 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">{t('order.orderId')}</div>
                  <div className="mt-1 text-2xl font-bold tracking-wider text-[#D4AF37]">{orderId}</div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-sm">
                    <span className="text-white/40">{t('common.total')}</span>
                    <span className="font-bold text-white">{formatMoney(finalTotal)}</span>
                  </div>
                </div>

                <p className="relative mt-4 text-xs text-white/35">Suivez votre commande en temps réel, sans actualiser la page.</p>
                <div className="relative mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOrderPlaced(false)}
                    className="rounded-xl border border-white/10 py-3 text-sm font-semibold text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors"
                  >
                    {t('order.orderMore')}
                  </button>
                  <button
                    onClick={() => navigate(`/client/track?order=${encodeURIComponent(orderId)}`)}
                    className="rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-black hover:bg-amber-400 transition-colors active:scale-[0.98]"
                  >
                    {t('order.trackOrder')}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
