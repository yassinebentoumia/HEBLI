// ============================================================
// HEBLI – Staff & Owner Login (Face ID + PIN)
// Owner: PIN "9999"
// Staff: Face ID (WebAuthn) only
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Fingerprint, ArrowLeft, Lock, AlertCircle, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { getStaff } from '@/utils/store';
import type { Staff } from '@/types';

type View = 'select' | 'owner' | 'staff-list' | 'face-scan';

// WebAuthn helpers
const rpName = 'HEBLI Coffee';
const rpId = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

const STORAGE_KEY_PREFIX = 'hebli_faceid_';

async function registerFaceId(staff: Staff): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = new TextEncoder().encode(staff.id);
  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: { name: rpName, id: rpId },
    user: { id: userId, name: staff.name, displayName: staff.name },
    pubKeyCredParams: [{ alg: -7, type: 'public-key' }], // ES256
    authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
    timeout: 60000,
  };
  try {
    const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential;
    const rawId = arrayBufferToBase64(credential.rawId);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${staff.id}`, JSON.stringify({ id: rawId, name: staff.name }));
    return true;
  } catch {
    return false;
  }
}

async function authenticateFaceId(staff: Staff): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  const storedRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${staff.id}`);
  if (!storedRaw) return false;
  const stored = JSON.parse(storedRaw);
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge,
    allowCredentials: [{ id: base64ToArrayBuffer(stored.id), type: 'public-key' }],
    timeout: 60000,
    userVerification: 'required',
    rpId,
  };
  try {
    await navigator.credentials.get({ publicKey });
    return true;
  } catch {
    return false;
  }
}

export default function StaffLogin() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [view, setView] = useState<View>('select');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [scanStep, setScanStep] = useState<'register' | 'auth'>('auth');

  useEffect(() => {
    setStaffList(getStaff().filter((s) => s.active && s.role !== 'Administrator'));
  }, []);

  const handleOwnerLogin = async () => {
    setError('');
    if (pin !== '9999') {
      setError('Invalid Owner PIN.');
      return;
    }
    setLoading(true);
    // Find admin account to log in properly
    const admin = getStaff().find((s) => s.role === 'Administrator' && s.active);
    if (admin) {
      await login(admin.pin);
      navigate('/owner');
    } else {
      setError('Owner account not found. Please contact support.');
    }
    setLoading(false);
  };

  const handleStaffSelect = async (staff: Staff) => {
    setSelectedStaff(staff);
    setError('');
    const hasFaceId = localStorage.getItem(`${STORAGE_KEY_PREFIX}${staff.id}`);
    setScanStep(hasFaceId ? 'auth' : 'register');
    setView('face-scan');
  };

  const handleFaceScan = async () => {
    if (!selectedStaff) return;
    setLoading(true);
    setError('');
    let success = false;
    if (scanStep === 'register') {
      success = await registerFaceId(selectedStaff);
      if (success) {
        // Auto-login after registration
        await login(selectedStaff.pin);
        navigate(selectedStaff.role === 'Cashier' ? '/cashier' : '/barista');
      } else {
        setError('Face ID registration failed. Please try again.');
      }
    } else {
      success = await authenticateFaceId(selectedStaff);
      if (success) {
        await login(selectedStaff.pin);
        navigate(selectedStaff.role === 'Cashier' ? '/cashier' : '/barista');
      } else {
        setError('Face ID not recognized. Please try again.');
      }
    }
    setLoading(false);
  };

  const isBiometricSupported = typeof window !== 'undefined' && !!window.PublicKeyCredential;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.06)_0%,_transparent_70%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back button */}
        {view !== 'select' && (
          <button
            onClick={() => { setView('select'); setError(''); setPin(''); setSelectedStaff(null); }}
            className="mb-6 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* SELECT ROLE VIEW */}
          {view === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
                  <Shield className="h-8 w-8 text-[#D4AF37]" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight"><span className="text-[#D4AF37]">HEBLI</span> Portal</h2>
                <p className="mt-2 text-sm text-white/40">Select your access method.</p>
              </div>

              <button
                onClick={() => setView('owner')}
                className="w-full group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-left transition-all hover:border-[#D4AF37]/30 hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
                    <Lock className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Owner Access</div>
                    <div className="text-xs text-white/40">Secure PIN required</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setView('staff-list')}
                disabled={!isBiometricSupported}
                className="w-full group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-left transition-all hover:border-[#D4AF37]/30 hover:bg-white/[0.04] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                    <Fingerprint className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Staff Access</div>
                    <div className="text-xs text-white/40">
                      {isBiometricSupported ? 'Face ID / Touch ID required' : 'Biometrics not supported on this device'}
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          )}

          {/* OWNER PIN VIEW */}
          {view === 'owner' && (
            <motion.div
              key="owner"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl border border-white/[0.06] bg-[#0C0C0C] p-6"
            >
              <div className="text-center mb-6">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                  <Lock className="h-7 w-7 text-[#D4AF37]" />
                </div>
                <h3 className="text-xl font-bold">Owner PIN</h3>
                <p className="text-xs text-white/40 mt-1">Enter your secure code.</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleOwnerLogin()}
                    maxLength={4}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-4 text-center text-3xl tracking-[0.5em] text-white placeholder:text-white/10 outline-none focus:border-[#D4AF37]/50 transition-colors"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4" /> {error}
                  </div>
                )}

                <button
                  onClick={handleOwnerLogin}
                  disabled={pin.length < 4 || loading}
                  className="w-full rounded-xl bg-[#D4AF37] py-4 text-sm font-bold text-black hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Verifying...' : 'Access Dashboard'}
                </button>
              </div>
            </motion.div>
          )}

          {/* STAFF LIST VIEW */}
          {view === 'staff-list' && (
            <motion.div
              key="staff-list"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl border border-white/[0.06] bg-[#0C0C0C] p-6"
            >
              <div className="text-center mb-6">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10">
                  <Fingerprint className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold">Staff Login</h3>
                <p className="text-xs text-white/40 mt-1">Select your name to scan Face ID.</p>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {staffList.length === 0 ? (
                  <div className="text-center py-8 text-white/30 text-sm">No active staff accounts found.</div>
                ) : (
                  staffList.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleStaffSelect(s)}
                      className="w-full flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 hover:border-[#D4AF37]/30 hover:bg-white/[0.04] transition-all text-left"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-bold">
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{s.name}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">{s.role}</div>
                      </div>
                      <Fingerprint className="h-4 w-4 text-white/20" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* FACE ID SCAN VIEW */}
          {view === 'face-scan' && selectedStaff && (
            <motion.div
              key="face-scan"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl border border-white/[0.06] bg-[#0C0C0C] p-8 text-center"
            >
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-500/10 relative">
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border-2 border-blue-400/30 border-t-blue-400"
                  />
                ) : (
                  <Fingerprint className="h-10 w-10 text-blue-400" />
                )}
              </div>

              <h3 className="text-xl font-bold mb-1">
                {scanStep === 'register' ? 'Register Face ID' : 'Scan Face ID'}
              </h3>
              <p className="text-sm text-white/40 mb-6">
                {scanStep === 'register'
                  ? `First time, ${selectedStaff.name}? Look at your device to register.`
                  : `Hi ${selectedStaff.name}. Look at your device to verify.`}
              </p>

              {error && (
                <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}

              <button
                onClick={handleFaceScan}
                disabled={loading}
                className="w-full rounded-xl bg-blue-500 py-4 text-sm font-bold text-white hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Scanning...'
                ) : (
                  <>
                    <Smartphone className="h-4 w-4" />
                    {scanStep === 'register' ? 'Register Now' : 'Scan Now'}
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
