// ============================================================
// HEBLI – Professional Staff & Owner Login (Camera Face Scan)
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowLeft, ScanFace, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import { useApp } from '@/contexts/AppContext';
import { getStaff } from '@/utils/store';
import CameraScanner from '@/components/CameraScanner';

const FACE_STORAGE_PREFIX = 'hebli_face_scan_';

export default function StaffLogin() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [view, setView] = useState<'selection' | 'owner-pin'>('selection');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Camera Scanner State
  const [scanningStaff, setScanningStaff] = useState<{ id: string; name: string; role: string } | null>(null);

  const staffList = getStaff().filter((s) => s.active);

  const handleOwnerLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const owner = staffList.find(s => s.role === 'Administrator');
      if (pin === '9999' && owner) {
        await login(owner.pin);
        navigate('/owner');
      } else if (owner && owner.pin === pin) {
        await login(pin);
        navigate('/owner');
      } else {
        setError('Incorrect Owner PIN');
      }
    } catch {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceScanSuccess = async (staff: { id: string; name: string; role: string }) => {
    setLoading(true);
    try {
      // Find real staff object to get PIN for context login
      const allStaff = getStaff();
      const realStaff = allStaff.find(s => s.id === staff.id);
      if (realStaff) {
        await login(realStaff.pin);
        if (realStaff.role === 'Barista') navigate('/barista');
        else if (realStaff.role === 'Cashier') navigate('/cashier');
      }
    } catch (e) {
      setError('Login failed after scan.');
    } finally {
      setLoading(false);
      setScanningStaff(null);
    }
  };

  const getSavedFace = (staffId: string) => {
    return localStorage.getItem(FACE_STORAGE_PREFIX + staffId);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.08)_0%,_transparent_60%)] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <button onClick={() => navigate('/')} className="mb-8 flex items-center gap-2 text-sm text-white/40 hover:text-[#D4AF37] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to HEBLI
        </button>

        <GlassCard className="p-8 text-center">
          <AnimatePresence mode="wait">
            
            {/* VIEW 1: Selection */}
            {view === 'selection' && (
              <motion.div key="sel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-8">
                  <h1 className="text-3xl font-black tracking-tighter text-white">
                    <span className="text-[#D4AF37]">HEBLI</span> PORTAL
                  </h1>
                  <p className="mt-2 text-sm text-white/50">Select your access method</p>
                </div>

                {error && (
                  <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" /> {error}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Owner Button */}
                  <button onClick={() => setView('owner-pin')} className="group relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-left transition-all hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
                        <Lock className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-bold text-white">Owner Access</div>
                        <div className="text-xs text-white/40">Secure PIN Entry</div>
                      </div>
                    </div>
                  </button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]"></div></div>
                    <div className="relative flex justify-center text-xs uppercase tracking-widest text-white/20"><span className="bg-[#111] px-2">Staff Face ID</span></div>
                  </div>

                  {/* Staff List */}
                  <div className="grid grid-cols-1 gap-3 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                    {staffList.filter(s => s.role !== 'Administrator').map((staff) => {
                      const hasFace = !!getSavedFace(staff.id);
                      return (
                        <button 
                          key={staff.id} 
                          onClick={() => setScanningStaff(staff)}
                          className={`group relative flex items-center gap-4 rounded-xl border p-3 text-left transition-all ${
                            hasFace 
                              ? 'border-white/[0.08] bg-white/[0.02] hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5' 
                              : 'border-white/[0.02] bg-white/[0.01] opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${hasFace ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-white/20'}`}>
                            <ScanFace className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-white">{staff.name}</div>
                            <div className="text-[10px] uppercase tracking-wider text-white/40">{staff.role}</div>
                          </div>
                          {hasFace ? (
                            <div className="text-[10px] font-bold text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity">SCAN &rarr;</div>
                          ) : (
                            <div className="text-[9px] text-red-400">No Face ID</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {staffList.filter(s => s.role !== 'Administrator').length === 0 && (
                    <div className="text-xs text-white/30 py-4">No staff members found.</div>
                  )}
                </div>
              </motion.div>
            )}

            {/* VIEW 2: Owner PIN */}
            {view === 'owner-pin' && (
              <motion.div key="pin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-left">
                <button onClick={() => { setView('selection'); setPin(''); setError(''); }} className="mb-6 text-xs text-white/40 hover:text-white flex items-center gap-1">
                  &larr; Back
                </button>
                <h2 className="text-xl font-bold text-white mb-1">Owner Access</h2>
                <p className="text-sm text-white/50 mb-8">Enter secure PIN (Default: 9999)</p>
                
                <div className="relative mb-6">
                  <input 
                    type="password" 
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g,'').slice(0,6))}
                    onKeyDown={(e) => e.key === 'Enter' && handleOwnerLogin()}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-4 px-4 text-center text-3xl tracking-[0.5em] text-white font-mono outline-none focus:border-[#D4AF37] transition-colors"
                    placeholder="••••"
                    autoFocus
                  />
                </div>
                
                {error && <div className="text-xs text-red-400 mb-4 text-center">{error}</div>}
                
                <button onClick={handleOwnerLogin} disabled={loading} className="w-full bg-[#D4AF37] hover:bg-amber-400 text-black font-bold py-4 rounded-xl transition-all">
                  {loading ? 'Verifying...' : 'Unlock Dashboard'}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </GlassCard>
      </motion.div>

      {/* Camera Scanner Modal */}
      {scanningStaff && (
        <CameraScanner
          mode="login"
          staffName={scanningStaff.name}
          savedFaceData={getSavedFace(scanningStaff.id)}
          onClose={() => setScanningStaff(null)}
          onSuccess={() => handleFaceScanSuccess(scanningStaff)}
          onError={(msg) => {
            setError(msg);
            setScanningStaff(null);
          }}
        />
      )}
    </div>
  );
}
