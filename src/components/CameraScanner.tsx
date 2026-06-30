// ============================================================
// HEBLI – Professional Camera Face Scanner
// Opens webcam, captures face, and compares for verification.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, CheckCircle2, AlertCircle, ScanFace } from 'lucide-react';

interface Props {
  mode: 'register' | 'login';
  staffName: string;
  savedFaceData?: string | null; // Base64 image for login comparison
  onClose: () => void;
  onSuccess: (faceData: string) => void;
  onError: (msg: string) => void;
}

export default function CameraScanner({ mode, staffName, savedFaceData, onClose, onSuccess, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      onError('Camera access denied. Please allow camera permissions.');
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
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  };

  // Simple pixel comparison to verify face (grayscale diff)
  const compareFaces = (img1: string, img2: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const image1 = new Image();
      const image2 = new Image();
      let loaded = 0;
      
      const onLoad = () => {
        loaded++;
        if (loaded === 2) {
          const canvas = document.createElement('canvas');
          const size = 64; // Resize to small for fast comparison
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(false);

          // Draw and get data for img1
          ctx.drawImage(image1, 0, 0, size, size);
          const data1 = ctx.getImageData(0, 0, size, size).data;
          
          // Draw and get data for img2
          ctx.drawImage(image2, 0, 0, size, size);
          const data2 = ctx.getImageData(0, 0, size, size).data;

          let diff = 0;
          for (let i = 0; i < data1.length; i += 4) {
            // Convert to grayscale
            const gray1 = 0.299 * data1[i] + 0.587 * data1[i + 1] + 0.114 * data1[i + 2];
            const gray2 = 0.299 * data2[i] + 0.587 * data2[i + 1] + 0.114 * data2[i + 2];
            diff += Math.abs(gray1 - gray2);
          }
          
          const avgDiff = diff / (size * size);
          // Threshold: if average pixel difference is less than 35, it's a match
          // (This is a basic visual match, good enough for a demo flow)
          console.log('Face difference score:', avgDiff);
          resolve(avgDiff < 40); 
        }
      };

      image1.onload = onLoad;
      image2.onload = onLoad;
      image1.src = img1;
      image2.src = img2;
    });
  };

  const handleScan = async () => {
    setStatus('scanning');
    setScanProgress(0);

    // Simulate scanning animation
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    // Wait for "scan" to finish
    setTimeout(async () => {
      clearInterval(interval);
      const currentFace = captureFrame();
      
      if (!currentFace) {
        setStatus('error');
        onError('Failed to capture image.');
        return;
      }

      if (mode === 'register') {
        onSuccess(currentFace);
        setStatus('success');
      } else {
        // Login mode: compare with saved face
        if (!savedFaceData) {
          setStatus('error');
          onError('No face registered for this staff member.');
          return;
        }
        
        const isMatch = await compareFaces(savedFaceData, currentFace);
        if (isMatch) {
          setStatus('success');
          onSuccess(currentFace); // Pass current face just to trigger success
        } else {
          setStatus('error');
          onError('Face not recognized. Please try again.');
          setTimeout(() => setStatus('idle'), 2000);
        }
      }
    }, 1500); // 1.5s scan time
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md bg-[#111] rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <ScanFace className="h-5 w-5 text-[#D4AF37]" />
              {mode === 'register' ? 'Register Face' : 'Verify Identity'}
            </h3>
            <p className="text-xs text-white/50 mt-1">{staffName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative aspect-[4/5] bg-black flex items-center justify-center overflow-hidden">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Face Outline Box */}
          <div className="relative z-10 w-48 h-64 border-2 border-white/30 rounded-3xl flex items-center justify-center">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#D4AF37] rounded-tl-xl -mt-1 -ml-1" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#D4AF37] rounded-tr-xl -mt-1 -mr-1" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#D4AF37] rounded-bl-xl -mb-1 -ml-1" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#D4AF37] rounded-br-xl -mb-1 -mr-1" />
            
            {/* Scanning Line Animation */}
            {status === 'scanning' && (
              <motion.div 
                className="absolute left-0 right-0 h-0.5 bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.8)]"
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </div>

          {/* Status Overlays */}
          {status === 'success' && (
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm z-20">
              <div className="bg-black/80 p-6 rounded-2xl flex flex-col items-center gap-3 border border-green-500/30">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
                <span className="text-green-400 font-bold text-lg">
                  {mode === 'register' ? 'Face Registered!' : 'Access Granted'}
                </span>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm z-20">
              <div className="bg-black/80 p-6 rounded-2xl flex flex-col items-center gap-3 border border-red-500/30">
                <AlertCircle className="h-12 w-12 text-red-400" />
                <span className="text-red-400 font-bold text-lg text-center px-4">Face Not Recognized</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer / Controls */}
        <div className="p-6 bg-[#111] border-t border-white/[0.08]">
          {status === 'idle' && (
            <button 
              onClick={handleScan}
              className="w-full bg-[#D4AF37] hover:bg-amber-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Camera className="h-5 w-5" />
              {mode === 'register' ? 'Capture Face' : 'Scan Face Now'}
            </button>
          )}
          
          {status === 'scanning' && (
            <div className="text-center">
              <div className="text-[#D4AF37] font-bold mb-2 animate-pulse">Scanning Biometrics...</div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#D4AF37] transition-all duration-75" style={{ width: `${scanProgress}%` }} />
              </div>
              <p className="text-xs text-white/40 mt-2">Please keep your face in the frame</p>
            </div>
          )}

          {(status === 'success' || status === 'error') && (
            <button 
              onClick={status === 'success' ? onClose : () => setStatus('idle')}
              className={`w-full font-bold py-4 rounded-xl transition-all ${
                status === 'success' ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {status === 'success' ? 'Continue' : 'Try Again'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
