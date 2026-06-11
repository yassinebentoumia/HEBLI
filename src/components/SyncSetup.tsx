// ============================================================
// HEBLI – Cross-Device Sync Setup (Café Code)
// ============================================================

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff, Copy, Check, X, Wifi, Loader2 } from 'lucide-react';
import { createCafe, joinCafe, getCafeCode, clearCafeCode } from '@/utils/sync';

export default function SyncSetup() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(getCafeCode() || '');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const synced = !!getCafeCode();

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    const newCode = await createCafe();
    setLoading(false);
    if (newCode) {
      setCode(newCode);
      localStorage.setItem('hebli_shared_cafe_published', newCode);
      setTimeout(() => window.location.reload(), 500);
    } else {
      setError('Could not connect to cloud. Check your internet.');
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    setError('');
    const ok = await joinCafe(joinCode.trim());
    setLoading(false);
    if (ok) {
      setCode(joinCode.trim());
      localStorage.setItem('hebli_shared_cafe_published', joinCode.trim());
      setJoinCode('');
      setTimeout(() => window.location.reload(), 500);
    } else {
      setError('Invalid code or no connection.');
    }
  };

  const handleDisconnect = () => {
    clearCafeCode();
    localStorage.removeItem('hebli_shared_cafe_published');
    setCode('');
    window.location.reload();
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shareableLink = () => {
    const base = window.location.origin + window.location.pathname;
    return `${base}#/?cafe=${code}`;
  };

  const [linkCopied, setLinkCopied] = useState(false);
  const copyLink = () => {
    navigator.clipboard?.writeText(shareableLink());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`relative rounded-xl border p-2 transition-colors ${
          synced
            ? 'border-green-500/20 bg-green-500/5 text-green-400 hover:bg-green-500/10'
            : 'border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10'
        }`}
        title={synced ? 'Synced across devices' : 'Not synced — tap to connect'}
      >
        {synced ? <Cloud className="h-4 w-4 sm:h-5 sm:w-5" /> : <CloudOff className="h-4 w-4 sm:h-5 sm:w-5" />}
        {synced && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        )}
      </button>

      {createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0C0C0C] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-[#D4AF37]" />
                  <h3 className="text-lg font-bold">Multi-Device Sync</h3>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-white/30 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-white/40 mb-6">
                Connect all your devices (cashier, barista, owner) to share the same live data in real time.
              </p>

              {synced ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.04] p-4">
                    <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mb-2">
                      <Check className="h-4 w-4" /> Connected & Syncing
                    </div>
                    <div className="text-xs text-white/40 mb-2">Your Café Code:</div>
                    <div className="flex items-center gap-2 mb-3">
                      <code className="flex-1 rounded-xl bg-black/40 px-3 py-2.5 text-sm font-mono text-[#D4AF37] break-all">
                        {code}
                      </code>
                      <button
                        onClick={copyCode}
                        className="rounded-xl bg-white/[0.05] p-2.5 text-white/60 hover:text-white hover:bg-white/[0.1] transition-colors"
                        title="Copy code"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="text-xs text-white/40 mb-2">📱 Or share this link — opens already connected:</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-xl bg-black/40 px-3 py-2.5 text-[10px] font-mono text-white/60 break-all">
                        {shareableLink()}
                      </code>
                      <button
                        onClick={copyLink}
                        className="rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-2.5 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors flex-shrink-0"
                        title="Copy share link"
                      >
                        {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="w-full rounded-xl border border-red-500/20 py-3 text-sm font-medium text-red-400/80 hover:bg-red-500/10 transition-colors"
                  >
                    Disconnect This Device
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="text-xs font-semibold tracking-wider uppercase text-white/40 mb-2">
                      First device? Create a café
                    </div>
                    <button
                      onClick={handleCreate}
                      disabled={loading}
                      className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-black hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
                      Create Café & Get Code
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-xs text-white/20">OR</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>

                  <div>
                    <div className="text-xs font-semibold tracking-wider uppercase text-white/40 mb-2">
                      Other device? Enter the code
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                        placeholder="Paste Café Code..."
                        className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#D4AF37]/50"
                      />
                      <button
                        onClick={handleJoin}
                        disabled={loading || !joinCode.trim()}
                        className="rounded-xl border border-white/[0.1] px-4 text-sm font-medium text-white/80 hover:bg-white/[0.05] disabled:opacity-40 transition-colors"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body)}
    </>
  );
}
