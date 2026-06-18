// ============================================================
// HEBLI – Client Menu Ordering Page (Redesigned)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ShoppingCart, Plus, Minus, Trash2, ArrowLeft, Search, Check, Coffee, X, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useT } from '@/i18n/I18nProvider';
import { getActiveProducts, getCategories, getCategoryIcon, addOrder, addAuditLog, addNotification } from '@/utils/store';
import type { Product, CartItem, Category } from '@/types';

export default function Menu() {
  const navigate = useNavigate();
  const { t } = useT();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [finalTotal, setFinalTotal] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  useEffect(() => {
    setProducts(getActiveProducts());
    setCategories(getCategories());
  }, []);

  const filtered = products.filter((p) => {
    const catMatch = activeCategory === 'All' || p.category === activeCategory;
    const searchMatch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  const addToCart = (product: Product) => {
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 600);
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, image: product.image }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.productId !== productId);
    });
  };

  const deleteFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const placeOrder = () => {
    if (!clientName.trim()) return;
    const id = 'ORD-' + String(Date.now()).slice(-6);
    const order = {
      id,
      clientName: clientName.trim(),
      items: [...cart],
      total,
      status: 'Pending' as const,
      note: orderNote.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addOrder(order);
    addAuditLog({
      id: 'log-' + Date.now(),
      action: 'Order Placed',
      details: `Order ${id} by ${clientName} for ${total.toFixed(2)} DT`,
      user: clientName.trim(),
      timestamp: new Date().toISOString(),
    });
    // Notify barista AND cashier of the new order
    addNotification({
      id: 'ntf-' + Date.now() + '-b',
      target: 'Barista',
      title: 'New Order',
      body: `${id} from ${clientName.trim()} • ${total.toFixed(2)} DT`,
      type: 'order',
      read: false,
      createdAt: new Date().toISOString(),
    });
    addNotification({
      id: 'ntf-' + Date.now() + '-c',
      target: 'Cashier',
      title: 'New Order',
      body: `${id} from ${clientName.trim()} • ${total.toFixed(2)} DT`,
      type: 'order',
      read: false,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('hebli_client_name', clientName.trim());
    setOrderId(id);
    setFinalTotal(total);
    setOrderNote('');
    setOrderPlaced(true);
    setCart([]);
    setClientName('');
  };

  if (orderPlaced) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10"
          >
            <Check className="h-10 w-10 text-green-400" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white">{t('order.confirmed')}</h2>
          <p className="mt-2 text-white/50">{t('order.confirmedHint')}</p>
          <GlassCard className="mt-6 mx-auto max-w-sm">
            <div className="text-sm text-white/40">{t('order.orderId')}</div>
            <div className="mt-1 text-2xl font-bold text-[#D4AF37] tracking-wider">{orderId}</div>
            <div className="mt-4 text-sm text-white/40">{t('common.total')}</div>
            <div className="text-xl font-bold text-white">{finalTotal.toFixed(2)} DT</div>
          </GlassCard>
          <div className="mt-8 flex gap-4 justify-center">
            <button
              onClick={() => setOrderPlaced(false)}
              className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-white/70 hover:text-white hover:border-white/20 transition-all"
            >
              {t('order.orderMore')}
            </button>
            <button
              onClick={() => navigate(`/client/track?order=${orderId}`)}
              className="rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-black hover:bg-amber-400 transition-all"
            >
              {t('order.trackOrder')}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#D4AF37]/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
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

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8">
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
            className={`rounded-full px-4 py-2 text-xs font-medium tracking-wider uppercase transition-all ${
              activeCategory === 'All'
                ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20'
                : 'border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20'
            }`}
          >
            ✦ {t('menu.all')}
          </motion.button>
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.name)}
              className={`rounded-full px-4 py-2 text-xs font-medium tracking-wider uppercase transition-all ${
                activeCategory === cat.name
                  ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20'
                  : 'border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20'
              }`}
            >
              {cat.icon} {cat.name}
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
                  onClick={() => addToCart(product)}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/0 to-[#D4AF37]/0 group-hover:from-[#D4AF37]/5 group-hover:to-amber-600/5 transition-all duration-500" />

                  <div className="mb-4 flex h-40 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/10 to-amber-600/5 text-6xl overflow-hidden relative z-10">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <motion.span
                        animate={addedId === product.id ? { scale: [1, 1.2, 1] } : {}}
                        className="opacity-40 transition-transform duration-500 group-hover:scale-110"
                      >
                        {getCategoryIcon(product.category)}
                      </motion.span>
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
                      <span className="text-xl font-bold text-white">{product.price.toFixed(2)} DT</span>
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
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#0C0C0C] border-l border-white/[0.06] shadow-2xl"
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
                      {cart.map(item => (
                        <motion.div
                          key={item.productId}
                          layout
                          className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-[#111] p-3"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] text-xl">
                            ☕
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.name}</div>
                            <div className="text-xs text-white/30">{item.price.toFixed(2)} DT {t('cart.eachPrice')}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeFromCart(item.productId)} className="rounded-lg p-1 text-white/30 hover:text-white hover:bg-white/[0.04]">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                            <button onClick={() => addToCart({ id: item.productId, name: item.name, price: item.price } as Product)} className="rounded-lg p-1 text-white/30 hover:text-white hover:bg-white/[0.04]">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => deleteFromCart(item.productId)} className="ml-1 rounded-lg p-1 text-white/20 hover:text-red-400">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-6 border-t border-white/[0.04] space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">{t('common.total')}</span>
                      <span className="text-2xl font-bold">{total.toFixed(2)} DT</span>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder={t('cart.yourName')}
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 px-4 text-sm text-white placeholder:text-white/15 outline-none focus:border-white/20"
                      />
                      <textarea
                        placeholder={t('cart.notePlaceholder')}
                        value={orderNote}
                        onChange={e => setOrderNote(e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 px-4 text-sm text-white placeholder:text-white/15 outline-none focus:border-white/20 resize-none"
                      />
                    </div>
                    <button
                      onClick={placeOrder}
                      disabled={!clientName.trim()}
                      className="w-full rounded-2xl bg-[#D4AF37] py-4 text-base font-bold text-black hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                    >
                      {t('cart.placeOrder')} • {total.toFixed(2)} DT
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
