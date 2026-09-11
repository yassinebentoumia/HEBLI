// ============================================================
// HEBLI – Café Wi-Fi Access Gate (client-only)
// Blocks the client experience when the owner has enabled the
// "café Wi-Fi only" lock and the device is not on the café network.
// Staff routes are NOT wrapped with this, so the owner can always log
// in and disable the lock.
// ============================================================

import { useEffect, useState } from 'react';
import { WifiOff, Loader2, RefreshCw } from 'lucide-react';

interface AccessInfo {
  enabled: boolean;
  allowed: boolean;
  yourIp: string;
  cafeIp: string;
}

export default function AccessGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'checking' | 'allowed' | 'blocked'>('checking');
  const [info, setInfo] = useState<AccessInfo | null>(null);

  const check = async () => {
    setState('checking');
    try {
      const res = await fetch('/api/access', { cache: 'no-store' });
      if (!res.ok) { setState('allowed'); return; } // fail-open if endpoint missing
      const data: AccessInfo = await res.json();
      setInfo(data);
      setState(data.allowed ? 'allowed' : 'blocked');
    } catch {
      setState('allowed'); // offline / no server → don't lock the user out
    }
  };

  // Check once on mount.
  useEffect(() => { check(); }, []);

  // Only keep re-checking WHILE blocked (so it unlocks once they join the café
  // Wi-Fi). Once allowed, we stop polling entirely — no background auto-refresh.
  useEffect(() => {
    if (state !== 'blocked') return;
    const int = setInterval(check, 10000);
    return () => clearInterval(int);
  }, [state]);

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1512]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (state === 'blocked') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B1512] px-6 text-center text-white">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 border border-red-500/20">
          <WifiOff className="h-10 w-10 text-red-400" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">
          <span className="text-[#D4AF37]">HEBLI</span> — Wi-Fi requis
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/50">
          Ce menu est disponible uniquement pour les clients connectés au Wi-Fi du café.
          Veuillez vous connecter au réseau Wi-Fi de HEBLI puis réessayer.
        </p>
        <p className="mt-1 max-w-sm text-xs text-white/25">
          This menu is only available on the café’s Wi-Fi. Please connect to HEBLI’s
          Wi-Fi and try again.
        </p>
        <button
          onClick={check}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-black hover:bg-amber-400 transition-colors active:scale-[0.98]"
        >
          <RefreshCw className="h-4 w-4" /> Réessayer
        </button>
        {info?.yourIp && (
          <p className="mt-4 text-[10px] text-white/15">IP: {info.yourIp}</p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
