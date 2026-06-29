// ============================================================
// HEBLI – Client Landing Page (Luxury Experience)
// ============================================================

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Coffee, ShoppingBag, ChevronRight, Star, Sparkles, ArrowRight,
  Shield, Menu as MenuIcon, X, MessageCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getActiveProducts, getCategories } from '@/utils/store';
import CategoryIcon from '@/components/CategoryIcon';
import { useT } from '@/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import InstallAppButton from '@/components/InstallAppButton';
import type { Product, Category } from '@/types';

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useT();
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
          <div className="hidden sm:flex items-center gap-5">
            <button onClick={() => navigate('/client/menu')} className="text-sm text-white/50 hover:text-white transition-colors">
              {t('nav.menu')}
            </button>
            <button onClick={() => navigate('/client/track')} className="text-sm text-white/50 hover:text-white transition-colors">
              {t('nav.track')}
            </button>
            <button onClick={() => navigate('/client/support')} className="text-sm text-white/50 hover:text-white transition-colors">
              {t('nav.support')}
            </button>
            <InstallAppButton />
            <LanguageSwitcher />
            <button onClick={() => navigate('/staff')} className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-white/40 hover:text-white hover:border-white/20 transition-colors">
              <Shield className="h-3 w-3" />
              {t('nav.staff')}
            </button>
          </div>

          {/* Mobile right cluster */}
          <div className="sm:hidden flex items-center gap-2">
            <InstallAppButton />
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="sm:hidden border-t border-white/[0.06] bg-[#0A0A0A] px-4 py-4 space-y-3"
          >
            <button onClick={() => { navigate('/client/menu'); setMobileMenuOpen(false); }} className="block w-full text-start text-sm text-white/70 hover:text-white py-2">
              📋 {t('nav.menu')}
            </button>
            <button onClick={() => { navigate('/client/track'); setMobileMenuOpen(false); }} className="block w-full text-start text-sm text-white/70 hover:text-white py-2">
              🔍 {t('nav.track')}
            </button>
            <button onClick={() => { navigate('/client/support'); setMobileMenuOpen(false); }} className="block w-full text-start text-sm text-white/70 hover:text-white py-2">
              💬 {t('nav.support')}
            </button>
            <button onClick={() => { navigate('/staff'); setMobileMenuOpen(false); }} className="block w-full text-start text-sm text-[#D4AF37] hover:text-amber-300 py-2">
              🛡️ {t('nav.staff')}
            </button>
          </motion.div>
        )}
      </nav>

      {/* ========================================================
          HERO — Premium, minimal, attractive
          ======================================================== */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-16"
      >
        {/* Background — soft gold spotlight + subtle grain */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          {/* Top spotlight */}
          <div className="absolute inset-x-0 -top-32 mx-auto h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.10)_0%,_transparent_60%)]" />
          {/* Bottom warm gradient */}
          <div className="absolute -bottom-32 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.04] blur-3xl" />
          {/* Faint grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '72px 72px',
              maskImage: 'radial-gradient(ellipse 60% 60% at 50% 30%, #000 30%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 30%, #000 30%, transparent 80%)',
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center max-w-3xl mx-auto"
        >
          {/* Tagline pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] px-3.5 py-1.5"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-[#D4AF37] opacity-70 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
            </span>
            <span className="text-[10px] font-semibold tracking-[0.25em] text-[#D4AF37]/90 uppercase">
              {t('landing.tagline')}
            </span>
          </motion.div>

          {/* HEBLI wordmark — animated letter-by-letter reveal with shimmer */}
          <div className="relative">
            <h1 className="relative text-[18vw] sm:text-8xl md:text-9xl font-black tracking-[-0.05em] leading-none flex justify-center">
              {'HEBLI'.split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 80, rotate: -8 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="relative inline-block"
                >
                  <span className="bg-gradient-to-b from-[#FFE8A3] via-[#D4AF37] to-[#8C6F1F] bg-clip-text text-transparent">
                    {char}
                  </span>
                </motion.span>
              ))}
            </h1>
            {/* Animated gold shimmer overlay sweeping across */}
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
            >
              <div
                className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                style={{ transform: 'skewX(-20deg)' }}
              />
            </motion.div>
            {/* Underline */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 96, opacity: 1 }}
              transition={{ delay: 0.9, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 mx-auto h-px bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent"
            />
          </div>

          {/* Sub-tagline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8 }}
            className="mx-auto mt-8 max-w-md text-[15px] sm:text-base leading-relaxed text-white/45"
          >
            {t('landing.hero.subtitle')}
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <button
              onClick={() => navigate('/client/menu')}
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-500 px-7 py-3.5 text-sm font-bold text-black tracking-wider uppercase shadow-[0_10px_40px_-10px_rgba(212,175,55,0.55)] hover:shadow-[0_15px_45px_-10px_rgba(212,175,55,0.75)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t('landing.browse')}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => navigate('/client/track')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.02] px-7 py-3.5 text-sm font-semibold text-white/70 tracking-wider uppercase hover:bg-white/[0.05] hover:text-white transition-all"
            >
              {t('nav.track')}
            </button>
          </motion.div>

          {/* Stats — slimmer */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.8 }}
            className="mx-auto mt-16 grid max-w-md grid-cols-3 gap-6 border-t border-white/[0.06] pt-8"
          >
            {[
              { value: `${products.length}+`, label: t('landing.stats.drinks') },
              { value: '4.9', label: t('landing.stats.rating') },
              { value: '24/7', label: t('landing.stats.service') },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-[#D4AF37]">{stat.value}</div>
                <div className="mt-1 text-[10px] tracking-[0.15em] uppercase text-white/35">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator — subtle */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="flex flex-col items-center gap-1.5 text-white/30">
            <div className="text-[9px] tracking-[0.3em] uppercase">scroll</div>
            <div className="flex h-7 w-4 items-start justify-center rounded-full border border-white/15 pt-1.5">
              <div className="h-1 w-px rounded-full bg-[#D4AF37]" />
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ========================================================
          FEATURED PRODUCTS — Cleaner, premium grid
          ======================================================== */}
      <section className="relative px-4 py-28">
        {/* Faint gold band across the section */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />

        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-14 text-center"
          >
            <div className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.3em] text-[#D4AF37]/80 uppercase">
              <span className="h-px w-6 bg-[#D4AF37]/40" />
              <Coffee className="h-3 w-3" />
              {t('landing.collection')}
              <span className="h-px w-6 bg-[#D4AF37]/40" />
            </div>
            <h2 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05]">
              {t('landing.signature')} <span className="bg-gradient-to-r from-[#FFE8A3] to-[#D4AF37] bg-clip-text text-transparent">{t('landing.creations')}</span>
            </h2>
          </motion.div>

          {/* Category Filter — staggered entrance + tap microinteraction */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={{ visible: { transition: { staggerChildren: 0.05 } }, hidden: {} }}
            className="mb-12 flex flex-wrap justify-center gap-2"
          >
            <motion.button
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveCategory('All')}
              className={`rounded-full px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors ${
                activeCategory === 'All'
                  ? 'bg-[#D4AF37] text-black shadow-[0_8px_24px_-8px_rgba(212,175,55,0.6)]'
                  : 'border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20'
              }`}
            >
              ✦ {t('menu.all')}
            </motion.button>
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveCategory(cat.name)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors ${
                  activeCategory === cat.name
                    ? 'bg-[#D4AF37] text-black shadow-[0_8px_24px_-8px_rgba(212,175,55,0.6)]'
                    : 'border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20'
                }`}
              >
                <CategoryIcon category={cat.name} className="h-3.5 w-3.5" />
                {cat.name}
              </motion.button>
            ))}
          </motion.div>

          {/* Products Grid */}
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.04, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => navigate('/client/menu')}
                className="group cursor-pointer"
              >
                <div className="relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-5 transition-all duration-300 hover:border-[#D4AF37]/30 hover:from-[#D4AF37]/[0.04]">
                  {/* Subtle gold glow on hover */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#D4AF37]/0 to-[#D4AF37]/0 opacity-0 transition-opacity duration-500 group-hover:from-[#D4AF37]/10 group-hover:opacity-100" />

                  <div className="relative">
                    <div className="mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#D4AF37]/15 via-amber-600/[0.04] to-transparent relative">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-full w-full rounded-xl object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <CategoryIcon
                          category={product.category}
                          className="h-16 w-16 text-[#D4AF37]/40 transition-all duration-700 group-hover:text-[#D4AF37]/70 group-hover:scale-110 group-hover:rotate-3"
                          strokeWidth={1.2}
                        />
                      )}
                    </div>

                    <div className="text-[10px] font-semibold tracking-[0.18em] text-[#D4AF37]/80 uppercase mb-1.5">
                      {product.category}
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-xs text-white/40 line-clamp-2 leading-relaxed">{product.description}</p>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xl font-black text-[#D4AF37] tracking-tight">{product.price.toFixed(2)} <span className="text-xs font-bold text-[#D4AF37]/70">DT</span></span>
                      <div className="flex items-center gap-0.5 text-amber-400/90">
                        {[0, 1, 2, 3].map((i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                        <Star className="h-3 w-3 fill-current opacity-25" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-20 text-center text-white/30">
              <Coffee className="mx-auto h-12 w-12 opacity-30" />
              <p className="mt-4">No products in this category yet.</p>
            </div>
          )}

          <div className="mt-14 text-center">
            <button
              onClick={() => navigate('/client/menu')}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-500 px-8 py-4 text-sm font-bold uppercase tracking-[0.15em] text-black shadow-[0_15px_45px_-12px_rgba(212,175,55,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <ShoppingBag className="h-4 w-4" />
              {t('landing.start')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.06] px-4 py-12 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-[#D4AF37]/8 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl">
          {/* Brand + signature centered together */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <div>
              <h3 className="text-3xl font-bold tracking-tight text-[#D4AF37]">HEBLI</h3>
              <p className="mt-1 text-sm text-white/30">{t('landing.tagline')} &copy; 2026</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37] animate-pulse" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
            </div>

            <div className="flex flex-col items-center gap-2">
              <p className="text-[11px] tracking-[0.35em] text-white/30 uppercase">
                {t('landing.footer.createdWith')} <span className="text-[#D4AF37]">♥</span> {t('landing.footer.by')}
              </p>
              <motion.a
                href="https://www.instagram.com/ysn.bnt/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                className="group relative inline-flex items-center gap-2 text-lg sm:text-xl font-bold tracking-wide transition-all duration-500 cursor-pointer"
                title="Visit Yassine on Instagram @ysn.bnt"
              >
                <span
                  className="bg-gradient-to-r from-[#D4AF37] via-amber-200 to-[#D4AF37] bg-clip-text text-transparent bg-[length:200%_auto] transition-all duration-500"
                  style={{ backgroundPosition: '0% 50%' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundPosition = '100% 50%'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundPosition = '0% 50%'; }}
                >
                  Yassine Bentoumia
                </span>
                {/* Instagram glyph (inline SVG) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-[#D4AF37] opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                {/* Underline that grows on hover */}
                <span className="absolute -bottom-1 left-0 right-0 mx-auto h-px w-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent group-hover:w-full transition-all duration-500" />
              </motion.a>
              {/* Instagram handle below */}
              <span className="text-[10px] tracking-[0.25em] text-white/25 uppercase">
                @ysn.bnt
              </span>
            </div>
          </motion.div>
        </div>
      </footer>

      {/* Floating Support / Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/client/support')}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-4 text-black font-bold shadow-2xl shadow-[#D4AF37]/30 hover:bg-amber-400 transition-colors"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline text-sm">{t('landing.help')}</span>
      </motion.button>
    </div>
  );
}
