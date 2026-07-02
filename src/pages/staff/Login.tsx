// ============================================================
// HEBLI – Professional Full-Screen Staff Login
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Fingerprint, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { getStaff } from '@/utils/store';
import { verifyBiometric, getStoredCredential } from '@/utils/faceid';

export default function StaffLogin() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showFaceSelector, setShowFaceSelector] = useState(false);
  const [scanningStaff, setScanningStaff] = useState<{ id: string; name: string; role: string } | null>(null);
  const [scanError, setScanError] = useState('');

  const staffList = getStaff().filter((s) => s.active);

  // Handle PIN Input
  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      
      // Auto-submit when 4 digits reached
      if (newPin.length === 4) {
        setTimeout(() => handlePinSubmit(newPin), 300);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handlePinSubmit = async (submittedPin: string) => {
    // 1. Check Owner PIN (9999)
    if (submittedPin === '9999') {
      const owner = staffList.find(s => s.role === 'Administrator');
      if (owner) {
        await login(owner.pin); // Use actual DB PIN for context
        navigate('/owner');
        return;
      }
    }

    // 2. Check Staff PIN -> Trigger Face ID
    const staff = staffList.find(s => s.pin === submittedPin && s.role !== 'Administrator');
    if (staff) {
      const hasBio = getStoredCredential(staff.id);
      if (hasBio) {
        // Trigger Face ID verification
        try {
          const success = await verifyBiometric(staff.id);
          if (success) {
            await login(staff.pin);
            if (staff.role === 'Barista') navigate('/barista');
            else if (staff.role === 'Cashier') navigate('/cashier');
          } else {
            setError('Face ID failed');
            setPin('');
          }
        } catch (e: any) {
          setError('Face ID error');
          setPin('');
        }
      } else {
        setError('Face ID not registered');
        setPin('');
      }
    } else {
      setError('Incorrect PIN');
      setTimeout(() => setPin(''), 500); // Clear after animation
    }
  };

  const handleFaceScanSelect = async (staff: { id: string; name: string; role: string }) => {
    setScanningStaff(staff);
    setScanError('');
    try {
      const success = await verifyBiometric(staff.id);
      if (success) {
        await login(staff.id === 'admin' ? '9999' : staff.id); // Hack for context
        // Real login
        const allStaff = getStaff();
        const realStaff = allStaff.find(s => s.id === staff.id);
        if (realStaff) {
           await login(realStaff.pin);
           if (realStaff.role === 'Barista') navigate('/barista');
           else if (realStaff.role === 'Cashier') navigate('/cashier');
        }
      }
    } catch (e: any) {
      setScanError(e.message || 'Scan failed');
    } finally {
      setScanningStaff(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.15)_0%,_transparent_50%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6 h-full justify-center">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-black tracking-tight mb-2">
            <span className="text-[#D4AF37]">HEBLI</span> <span className="text-white">Staff</span>
          </h1>
          <p className="text-white/50 text-sm">Enter your secure PIN</p>
        </div>

        {/* PIN Dots (4 digits) */}
        <div className="flex gap-4 mb-12">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: i === pin.length ? 1.2 : 1,
                backgroundColor: i < pin.length ? '#D4AF37' : 'rgba(255,255,255,0.2)'
              }}
              className="h-4 w-4 rounded-full transition-colors duration-200"
            />
          ))}
        </div>

        {/* Error Message */}
        <div className="h-6 mb-4">
          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                className="text-red-400 text-sm font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-[320px] mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="h-20 w-20 rounded-full bg-white/5 border border-white/10 text-2xl font-medium hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all flex items-center justify-center mx-auto"
            >
              {num}
            </button>
          ))}
          <div className="h-20 w-20 mx-auto" /> {/* Empty spacer */}
          <button
            onClick={() => handleNumberClick('0')}
            className="h-20 w-20 rounded-full bg-white/5 border border-white/10 text-2xl font-medium hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all flex items-center justify-center mx-auto"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-20 w-20 rounded-full flex items-center justify-center mx-auto text-white/70 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
          >
            <Delete className="h-7 w-7" />
          </button>
        </div>

        {/* Scan Face ID Button */}
        <button
          onClick={() => setShowFaceSelector(true)}
          className="mt-4 flex items-center gap-2 text-[#D4AF37] hover:text-amber-400 transition-colors text-sm font-semibold uppercase tracking-wider"
        >
          <Fingerprint className="h-5 w-5" />
          Scan Face ID
        </button>

      </div>

      {/* Face ID Staff Selector Modal */}
      {showFaceSelector && (
        <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#111] rounded-3xl border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-4 text-center">Select Staff to Scan</h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {staffList.filter(s => s.role !== 'Administrator').map((staff) => {
                const hasBio = getStoredCredential(staff.id);
                return (
                  <button
                    key={staff.id}
                    onClick={() => { setShowFaceSelector(false); handleFaceScanSelect(staff); }}
                    disabled={!hasBio}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      hasBio 
                        ? 'border-white/10 bg-white/5 hover:bg-white/10' 
                        : 'border-white/5 bg-white/2 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-sm text-white">{staff.name}</div>
                      <div className="text-[10px] text-white/40 uppercase">{staff.role}</div>
                    </div>
                    {!hasBio && <span className="text-[10px] text-red-400">No Face ID</span>}
                  </button>
                );
              })}
            </div>
            <button 
              onClick={() => setShowFaceSelector(false)}
              className="w-full mt-4 py-3 text-sm text-white/50 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Actual Biometric Scanner Overlay (Hidden logic, triggers native prompt) */}
      {scanningStaff && (
        <div className="absolute inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center p-6">
          <div className="h-20 w-20 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">Verifying Identity</h3>
          <p className="text-white/50 text-center">Please look at your device, {scanningStaff.name}...</p>
          {scanError && <p className="text-red-400 mt-4">{scanError}</p>}
        </div>
      )}
    </div>
  );
}
