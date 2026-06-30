// ============================================================
// HEBLI – Professional Camera Face Scanner (Robust)
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, CheckCircle2, AlertCircle, ScanFace, Loader2 } from 'lucide-react';

interface Props {
  mode: 'register' | 'login';
  staffName: string;
  savedFaceData?: string | null;
  onClose: () => void;
  onSuccess: (faceData: string) => void;
  onError: (msg: string) => void;
}

export default function CameraScanner({ mode, staffName, savedFaceData, onClose, onSuccess, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'scanning' | 'success' | 'error'>('loading');
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    let timeoutId: any;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        timeoutId = setTimeout(() => {
          if (status === 'loading') {
            onError('Camera is taking too long. Ensure you are on HTTPS.');
          }
        }, 5000);

        videoRef.current.onloadedmetadata = () => {
          clearTimeout(timeoutId);
          videoRef.current?.play().then(() => setStatus('idle')).catch(() => onError('Could not start video.'));
        };
      }
    } catch (err: any) {
      let msg = 'Camera access denied.';
      if (err.name === 'NotFoundError') msg = 'No camera found.';
      if (err.name === 'NotAllowedError') msg = 'Please allow camera access.';
      if (err.name === 'NotSupportedError') msg = 'Camera not supported on this browser. Try HTTPS.';
      onError(msg);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;
    
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const compareFaces = (img1: string, img2: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const image1 = new Image();
      const image2 = new Image();
      let loaded = 0;
      const onLoad = () => {
        loaded++;
        if (loaded === 2) {
          const canvas = document.createElement('canvas');
          const size = 64; 
          canvas.width = size; canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(false);
          ctx.drawImage(image1, 0, 0, size, size);
          const data1 = ctx.getImageData(0, 0, size, size).data;
          ctx.drawImage(image2, 0, 0, size, size);
          const data2 = ctx.getImageData(0, 0, size, size).data;
          let diff = 0;
          for (let i = 0; i < data1.length; i += 4) {
            const g1 = 0.299*data1[i] + 0.587*data1[i+1] + 0.114*data1[i+2];
            const g2 = 0.299*data2[i] + 0.587*data2[i+1] + 0.114*data2[i+2];
            diff += Math.abs(g1 - g2);
          }
          resolve((diff / (size * size)) < 45);
        }
      };
      image1.onload = onLoad; image2.onload = onLoad;
      image1.src = img1; image2.src = img2;
    });
  };

  const handleScan = async () => {
    setStatus('scanning');
    setScanProgress(0);
    const interval = setInterval(() => setScanProgress(p => p >= 95 ? 95 : p + 2), 40);

    setTimeout(async () => {
      clearInterval(interval);
      setScanProgress(100);
      const currentFace = captureFrame();
      
      if (!currentFace) {
        setStatus('error');
        onError('Failed to capture image. Try again.');
        return;
      }

      if (mode === 'register') {
        setStatus('success');
        setTimeout(() => onSuccess(currentFace), 1200);
      } else {
        if (!savedFaceData) { setStatus('error'); onError('No face registered.'); return; }
        const isMatch = await compareFaces(savedFaceData, currentFace);
        if (isMatch) {
          setStatus('success');
          setTimeout(() => onSuccess(currentFace), 1200);
        } else {
          setStatus('error');
          onError('Face not recognized.');
          setTimeout(() => setStatus('idle'), 2000);
        }
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md bg-[#111] rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent absolute top-0 left-0 right-0 z-20">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2"><ScanFace className="h-5 w-5 text-[#D4AF37]" /> {mode === 'register' ? 'Register Face' : 'Verify Identity'}</h3>
            <p className="text-xs text-white/50 mt-1">{staffName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="relative aspect-[4/5] bg-black flex items-center justify-center overflow-hidden">
          {status === 'loading' ? (
            <div className="flex flex-col items-center gap-4 text-white/50">
              <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
              <span className="text-sm">Opening Camera...</span>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-80" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="relative z-10 w-48 h-64 border-2 border-white/30 rounded-3xl flex items-center justify-center">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#D4AF37] rounded-tl-xl -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#D4AF37] rounded-tr-xl -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#D4AF37] rounded-bl-xl -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#D4AF37] rounded-br-xl -mb-1 -mr-1" />
                {status === 'scanning' && (
                  <motion.div className="absolute left-0 right-0 h-1 bg-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,1)]" animate={{ top: ['5%', '95%', '5%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
                )}
              </div>

              <AnimatePresence>
                {status === 'success' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                    <div className="bg-[#111] p-8 rounded-2xl flex flex-col items-center gap-4 border border-green-500/30 shadow-2xl">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20"><CheckCircle2 className="h-10 w-10 text-green-400" /></div>
                      <span className="text-green-400 font-bold text-xl">{mode === 'register' ? 'Face Registered!' : 'Access Granted'}</span>
                    </div>
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                    <div className="bg-[#111] p-8 rounded-2xl flex flex-col items-center gap-4 border border-red-500/30 shadow-2xl">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20"><AlertCircle className="h-10 w-10 text-red-400" /></div>
                      <span className="text-red-400 font-bold text-lg text-center px-4">Face Not Recognized</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        <div className="p-6 bg-[#111] border-t border-white/[0.08]">
          {status === 'idle' && (
            <button onClick={handleScan} className="w-full bg-[#D4AF37] hover:bg-amber-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#D4AF37]/20">
              <Camera className="h-5 w-5" /> {mode === 'register' ? 'Capture Face Now' : 'Scan Face Now'}
            </button>
          )}
          {status === 'scanning' && (
            <div className="text-center">
              <div className="text-[#D4AF37] font-bold mb-3 animate-pulse text-lg">Scanning Biometrics...</div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[#D4AF37] transition-all duration-75" style={{ width: `${scanProgress}%` }} /></div>
              <p className="text-xs text-white/40 mt-3">Keep face centered</p>
            </div>
          )}
          {status === 'error' && (
            <button onClick={() => setStatus('idle')} className="w-full bg-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/20 transition-all">Try Again</button>
          )}
        </div>
      </div>
    </div>
  );
}
