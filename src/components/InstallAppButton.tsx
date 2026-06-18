// ============================================================
// HEBLI – Install as App (PWA install prompt)
// Shows a button when the browser allows install.
// ============================================================

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstallAppButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore – iOS Safari
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt as any);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt as any);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (isStandalone || installed) return null; // already installed

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    // @ts-ignore – iOS Safari
    !(window as any).MSStream;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      setDeferred(null);
    } else if (isIOS) {
      setShowIOSHelp(true);
    }
  };

  // Only show if either we have a deferred prompt OR we're on iOS Safari
  if (!deferred && !isIOS) return null;

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors"
        title="Install HEBLI as an app"
      >
        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline uppercase tracking-wider">Install App</span>
      </button>

      <AnimatePresence>
        {showIOSHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowIOSHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0C0C0C] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/15 flex-shrink-0">
                  <Smartphone className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold">Install on iPhone</h3>
                  <p className="text-xs text-white/40">Add HEBLI to your home screen — no app store needed.</p>
                </div>
                <button onClick={() => setShowIOSHelp(false)} className="text-white/40 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="space-y-3 text-sm text-white/70">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37] text-black text-xs font-bold flex-shrink-0">1</span>
                  <span>
                    Tap the <strong className="text-white">Share</strong> button in Safari
                    <span className="ml-1 inline-block">⬆️</span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37] text-black text-xs font-bold flex-shrink-0">2</span>
                  <span>
                    Scroll and tap <strong className="text-white">"Add to Home Screen"</strong>
                    <span className="ml-1 inline-block">➕</span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37] text-black text-xs font-bold flex-shrink-0">3</span>
                  <span>Tap <strong className="text-white">"Add"</strong> — done! HEBLI is now an app on your phone.</span>
                </li>
              </ol>
              <button
                onClick={() => setShowIOSHelp(false)}
                className="mt-6 w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-black hover:bg-amber-400"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
