// ============================================================
// HEBLI – Language Switcher (4 languages with flags)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { useT } from '@/i18n/I18nProvider';
import { LANG_LABELS, type Lang } from '@/i18n/translations';

interface Props {
  variant?: 'pill' | 'icon';
}

export default function LanguageSwitcher({ variant = 'pill' }: Props) {
  const { lang, setLang } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const current = LANG_LABELS[lang];
  const langs = Object.keys(LANG_LABELS) as Lang[];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          variant === 'pill'
            ? 'flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold text-white/70 hover:text-white hover:border-white/15 transition-colors'
            : 'rounded-xl border border-white/[0.08] bg-white/[0.02] p-2 text-white/60 hover:text-white hover:border-white/15 transition-colors'
        }
        title="Change language"
      >
        <span className="text-sm">{current.flag}</span>
        {variant === 'pill' && (
          <span className="hidden sm:inline uppercase tracking-wider">{lang}</span>
        )}
        {variant === 'icon' && <Globe className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute end-0 top-full mt-2 w-44 rounded-xl border border-white/[0.08] bg-[#0C0C0C] shadow-2xl shadow-black/50 overflow-hidden z-50"
          >
            {langs.map((l) => {
              const info = LANG_LABELS[l];
              const active = l === lang;
              return (
                <button
                  key={l}
                  onClick={() => { setLang(l); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                      : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span className="text-base">{info.flag}</span>
                  <span className="flex-1 text-start">{info.name}</span>
                  {active && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
