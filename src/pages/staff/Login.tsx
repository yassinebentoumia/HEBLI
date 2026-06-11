// ============================================================
// HEBLI – Staff Login Page
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Coffee, Shield, Cloud, CloudOff, Copy, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GoldButton from '@/components/ui/GoldButton';
import GlassCard from '@/components/ui/GlassCard';
import { useApp } from '@/contexts/AppContext';
import { createCafe, joinCafe, getCafeCode } from '@/utils/sync';

export default function StaffLogin() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state
  const [cafeCode, setCafeCode] = useState(getCafeCode() || '');
  const [joinInput, setJoinInput] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [copied, setCopied] = useState(false);
  const synced = !!cafeCode;

  const handleCreateCafe = async () => {
    setSyncLoading(true); setSyncError('');
    const c = await createCafe();
    setSyncLoading(false);
    if (c) { setCafeCode(c); localStorage.setItem('hebli_shared_cafe_published', c); }
    else setSyncError('No internet connection.');
  };

  const handleJoinCafe = async () => {
    if (!joinInput.trim()) return;
    setSyncLoading(true); setSyncError('');
    const ok = await joinCafe(joinInput.trim());
    setSyncLoading(false);
    if (ok) { setCafeCode(joinInput.trim()); localStorage.setItem('hebli_shared_cafe_published', joinInput.trim()); setTimeout(() => window.location.reload(), 400); }
    else setSyncError('Invalid code or no connection.');
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(cafeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLogin = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      const staff = login(pin);
      setLoading(false);
      if (!staff) {
        setError('Invalid PIN. Please try again.');
        return;
      }
      if (!staff.active) {
        setError('This account has been suspended.');
        return;
      }
      switch (staff.role) {
        case 'Barista':
          navigate('/barista');
          break;
        case 'Cashier':
          navigate('/cashier');
          break;
        case 'Administrator':
          navigate('/owner');
          break;
      }
    }, 600);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.06)_0%,_transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        {/* MULTI-DEVICE SYNC BANNER */}
        <div className={`mb-6 rounded-2xl border p-4 ${synced ? 'border-green-500/20 bg-green-500/[0.04]' : 'border-amber-500/30 bg-amber-500/[0.06]'}`}>
          {synced ? (
            <div>
              <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mb-2">
                <Cloud className="h-4 w-4" /> Devices Connected & Syncing
              </div>
              <div className="text-xs text-white/40 mb-2">Open this site on your other devices and paste this code to sync orders live:</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-black/40 px-3 py-2 text-xs font-mono text-[#D4AF37] break-all">{cafeCode}</code>
                <button onClick={copyCode} className="rounded-lg bg-white/[0.05] p-2 text-white/60 hover:text-white">
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-1">
                <CloudOff className="h-4 w-4" /> Connect Your Devices
              </div>
              <p className="text-xs text-white/50 mb-3">To make orders appear on every device (phone + PC), connect them to one café.</p>
              <button
                onClick={handleCreateCafe}
                disabled={syncLoading}
                className="w-full rounded-lg bg-[#D4AF37] py-2.5 text-xs font-bold text-black hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mb-2"
              >
                {syncLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Cloud className="h-3.5 w-3.5" />}
                Create Café (1st device)
              </button>
              <div className="flex gap-2">
                <input
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinCafe()}
                  placeholder="Or paste café code..."
                  className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none"
                />
                <button onClick={handleJoinCafe} disabled={syncLoading || !joinInput.trim()} className="rounded-lg border border-white/10 px-3 text-xs text-white/70 hover:bg-white/5 disabled:opacity-40">
                  Join
                </button>
              </div>
              {syncError && <p className="mt-2 text-xs text-red-400">{syncError}</p>}
            </div>
          )}
        </div>

        <GlassCard className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10"
          >
            <Shield className="h-8 w-8 text-[#D4AF37]" />
          </motion.div>

          <h2 className="text-2xl font-bold tracking-tight">
            <span className="text-[#D4AF37]">HEBLI</span> Staff
          </h2>
          <p className="mt-2 text-sm text-white/40">Enter your secure PIN to access the dashboard.</p>

          <div className="mt-8">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
              <input
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                maxLength={4}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3.5 pl-11 pr-4 text-center text-2xl tracking-[0.5em] text-white placeholder:text-white/10 outline-none focus:border-[#D4AF37]/50 transition-colors"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}

            <GoldButton
              className="mt-6 w-full"
              onClick={handleLogin}
              disabled={pin.length < 4 || loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Access Dashboard'
              )}
            </GoldButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
