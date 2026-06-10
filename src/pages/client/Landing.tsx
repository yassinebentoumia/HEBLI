// ============================================================
// HEBLI – Client Landing Page (Luxury Experience)
// ============================================================

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Coffee, ShoppingBag, ChevronRight, Star, Sparkles, ArrowRight,
  Shield, Menu as MenuIcon, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GoldButton from '@/components/ui/GoldButton';
import GlassCard from '@/components/ui/GlassCard';
import { getActiveProducts, getCategories, getCategoryIcon } from '@/utils/store';
import type { Product, Category } from '@/types';

export default function Landing() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);

  useEffect(() => {
    setProducts(getActiveProducts());
    setCategories(getCategories());
  }, []);

  const filtered =
    activeCategory === 'All' ? products : products.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-[#D4AF37]">HEBLI</span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-6">
            <button onClick={() => navigate('/client/menu')} className="text-sm text-white/50 hover:text-white transition-colors">
              Menu
            </button>
            <button onClick={() => navigate('/client/track')} className="text-sm text-white/50 hover:text-white transition-colors">
              Track Order
            </button>
            <button onClick={() => navigate('/staff')} className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-white/40 hover:text-white hover:border-white/20 transition-colors">
              <Shield className="h-3 w-3" />
              Staff Portal
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/5"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="sm:hidden border-t border-white/[0.06] bg-[#0A0A0A] px-4 py-4 space-y-3"
          >
            <button onClick={() => { navigate('/client/menu'); setMobileMenuOpen(false); }} className="block w-full text-left text-sm text-white/70 hover:text-white py-2">
              📋 Browse Menu
            </button>
            <button onClick={() => { navigate('/client/track'); setMobileMenuOpen(false); }} className="block w-full text-left text-sm text-white/70 hover:text-white py-2">
              🔍 Track Order
            </button>
            <button onClick={() => { navigate('/staff'); setMobileMenuOpen(false); }} className="block w-full text-left text-sm text-[#D4AF37] hover:text-amber-300 py-2">
              🛡️ Staff Portal
            </button>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-16"
      >
        {/* Animated background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.08)_0%,_transparent_70%)]" />
          <motion.div
            className="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#D4AF37]/5 blur-3xl"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Floating icons */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute text-2xl opacity-10"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
            }}
            animate={{ y: [0, -30, 0], rotate: [0, 15, 0] }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: 'easeInOut',
            }}
          >
            {categories[i % categories.length]?.icon || '☕'}
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-2"
          >
            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
            <span className="text-xs font-medium tracking-[0.2em] text-[#D4AF37] uppercase">
              Premium Coffee Experience
            </span>
          </motion.div>

          <h1 className="text-6xl font-bold tracking-tighter sm:text-7xl md:text-8xl lg:text-9xl">
            <span className="bg-gradient-to-b from-[#D4AF37] via-amber-300 to-amber-600 bg-clip-text text-transparent">
              HEBLI
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mx-auto mt-6 max-w-lg text-base text-white/50 sm:text-lg"
          >
            Where every cup tells a story. Experience the art of premium coffee, crafted with passion and precision.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <GoldButton size="lg" onClick={() => navigate('/client/menu')}>
              Browse Menu
              <ChevronRight className="h-4 w-4" />
            </GoldButton>
            <GoldButton variant="outline" size="lg" onClick={() => navigate('/client/track')}>
              Track Order
            </GoldButton>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-16 grid grid-cols-3 gap-8 border-t border-white/[0.06] pt-8"
          >
            {[
              { value: `${products.length}+`, label: 'Premium Drinks' },
              { value: '4.9', label: 'Rating' },
              { value: '24/7', label: 'Service' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-[#D4AF37]">{stat.value}</div>
                <div className="mt-1 text-xs text-white/40">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex h-10 w-5 items-start justify-center rounded-full border border-white/10 pt-2">
            <div className="h-1.5 w-0.5 rounded-full bg-[#D4AF37]" />
          </div>
        </motion.div>
      </motion.section>

      {/* Featured Products */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12 text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-1.5 text-xs tracking-[0.2em] text-white/40 uppercase">
              <Coffee className="h-3 w-3" />
              Our Collection
            </div>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Signature <span className="text-[#D4AF37]">Creations</span>
            </h2>
          </motion.div>

          {/* Category Filter */}
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveCategory('All')}
              className={`rounded-full px-4 py-2 text-xs font-medium tracking-wider uppercase transition-all ${
                activeCategory === 'All'
                  ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20'
                  : 'border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20'
              }`}
            >
              ✦ All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`rounded-full px-4 py-2 text-xs font-medium tracking-wider uppercase transition-all ${
                  activeCategory === cat.name
                    ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20'
                    : 'border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
              >
                <GlassCard className="group h-full">
                  <div className="mb-4 flex h-40 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/10 to-amber-600/5 text-6xl overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <span className="opacity-40 transition-transform duration-500 group-hover:scale-110">
                        {getCategoryIcon(product.category)}
                      </span>
                    )}
                  </div>
                  <div className="mb-1 text-xs font-medium tracking-wider text-[#D4AF37] uppercase">
                    {product.category}
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-[#D4AF37] transition-colors">{product.name}</h3>
                  <p className="mt-1 text-sm text-white/40 line-clamp-2">{product.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-[#D4AF37]">{product.price.toFixed(2)} DT</span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      <Star className="h-3 w-3 fill-current" />
                      <Star className="h-3 w-3 fill-current" />
                      <Star className="h-3 w-3 fill-current" />
                      <Star className="h-3 w-3 fill-current" />
                      <Star className="h-3 w-3 fill-current opacity-30" />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-20 text-center text-white/30">
              <Coffee className="mx-auto h-12 w-12 opacity-30" />
              <p className="mt-4">No products in this category yet.</p>
            </div>
          )}

          <div className="mt-12 text-center">
            <GoldButton size="lg" onClick={() => navigate('/client/menu')}>
              <ShoppingBag className="h-4 w-4" />
              Start Your Order
              <ArrowRight className="h-4 w-4" />
            </GoldButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-[#D4AF37]">HEBLI</h3>
              <p className="mt-1 text-sm text-white/30">Premium Coffee Experience &copy; 2026</p>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => navigate('/client/menu')} className="text-sm text-white/30 hover:text-white/60 transition-colors">Menu</button>
              <button onClick={() => navigate('/client/track')} className="text-sm text-white/30 hover:text-white/60 transition-colors">Track Order</button>
              <button onClick={() => navigate('/staff')} className="text-sm text-white/30 hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                <Shield className="h-3 w-3" /> Staff
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
