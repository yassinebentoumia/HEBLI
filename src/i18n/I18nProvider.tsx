// ============================================================
// HEBLI – Language Context (with RTL support for Arabic)
// ============================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { T, LANG_LABELS, type Lang, type TranslationKey } from './translations';

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
  dir: 'ltr',
});

const STORAGE_KEY = 'hebli_lang';

function detectInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && saved in LANG_LABELS) return saved;
    const browser = (navigator.language || 'en').toLowerCase();
    if (browser.startsWith('it')) return 'it';
    if (browser.startsWith('es')) return 'es';
    if (browser.startsWith('ar')) return 'ar';
  } catch { /* ignore */ }
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  // Apply lang & direction to <html> for proper RTL behavior
  useEffect(() => {
    const dir = LANG_LABELS[lang].dir;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
    setLangState(l);
  }, []);

  const t = useCallback((key: TranslationKey) => {
    const entry = T[key];
    if (!entry) return String(key);
    return (entry as any)[lang] || (entry as any).en || String(key);
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir: LANG_LABELS[lang].dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useT = () => useContext(I18nContext);
