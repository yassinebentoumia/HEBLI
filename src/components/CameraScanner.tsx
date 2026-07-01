// ============================================================
// HEBLI – Professional AI Face Scanner (Landmark & Descriptor)
// Uses face-api.js to detect 68 facial landmarks and compare face descriptors.
// Robust to pose changes, lighting, and hairstyles.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, CheckCircle2, AlertCircle, ScanFace, Loader2 } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';

interface Props {
  mode: 'register' | 'login';
  staffName: string;
  savedFaceDescriptor?: number[] | null; // 128-dimension array for login comparison
  onClose: () => void;
  onSuccess: (descriptor: number[]) => void;
  onError: (msg: string) => void;
}

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';

export default function CameraScanner({ mode, staffName, savedFaceDescriptor, onClose, onSuccess, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'scanning' | 'success' | 'error'>('loading');
  const [loadProgress, setLoadProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    loadModels();
    return () => {
      stopCamera();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const loadModels = async () => {
    try {
      setStatus('loading');
      setLoadProgress(10);
      
      // Load models from CDN
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      setLoadProgress(40);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      setLoadProgress(70);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      setLoadProgress(100);
      
      startCamera();
    } catch (err) {
      console.error('Model load error:', err);
      onError('Failed to load AI models. Please check your internet connection.');
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setStatus('idle');
          detectFaces(); // Start detection loop
        };
      }
    } catch (err: any) {
      let msg = 'Camera failed. ';
      if (err.name === 'NotAllowedError') msg += 'Permission denied.';
      else if (err.name === 'NotFoundError') msg += 'No camera found.';
      else if (err.name === 'SecurityError') msg += 'Requires HTTPS or localhost.';
      else msg += err.message;
      onError(msg);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || status === 'loading') return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Match canvas size to video
    if (video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Detect face with landmarks
      const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (detection) {
          setFaceDetected(true);
          // Draw landmarks (professional look)
          faceapi.draw.drawFaceLandmarks(canvas, detection);
        } else {
          setFaceDetected(false);
        }
      }
    }
    
    animationRef.current = requestAnimationFrame(detectFaces);
  };

  const handleScan = async () => {
    if (!faceDetected || !videoRef.current) {
      onError('No face detected. Please look at the camera.');
      return;
    }

    setStatus('scanning');
    
    try {
      // Get high-quality descriptor
      const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      if (!detection) {
        setStatus('error');
        onError('Face lost. Please try again.');
        return;
      }

      const currentDescriptor = Array.from(detection.descriptor); // Convert Float32Array to normal array

      if (mode === 'register') {
        setStatus('success');
        setTimeout(() => onSuccess(currentDescriptor), 1000);
      } else {
        // Login mode: Compare descriptors using Euclidean distance
        if (!savedFaceDescriptor) {
          setStatus('error');
          onError('No face registered.');
          return;
        }
        
        const distance = faceapi.euclideanDistance(savedFaceDescriptor, currentDescriptor);
        console.log('Face match distance:', distance); // Lower is better. < 0.6 is usually a match.
        
        if (distance < 0.6) {
          setStatus('success');
          setTimeout(() => onSuccess(currentDescriptor), 1000);
        } else {
          setStatus('error');
          onError(`Face not recognized (Match score: ${Math.max(0, 100 - (distance * 100)).toFixed(0)}%). Please try again.`);
          setTimeout(() => setStatus('idle'), 2500);
        }
      }
    } catch (e) {
      setStatus('error');
      onError('Scan failed. Please try again.');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md bg-[#111] rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent absolute top-0 left-0 right-0 z-20">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <ScanFace className="h-5 w-5 text-[#D4AF37]" />
              {mode === 'register' ? 'Register Face ID' : 'Verify Identity'}
            </h3>
            <p className="text-xs text-white/50 mt-1">{staffName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="relative aspect-[4/5] bg-black flex items-center justify-center overflow-hidden flex-1">
          
          {/* Loading State */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 z-30">
              <Loader2 className="h-12 w-12 text-[#D4AF37] animate-spin" />
              <div className="text-white font-medium">Loading AI Models...</div>
              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#D4AF37] transition-all duration-300" style={{ width: `${loadProgress}%` }} />
              </div>
              <div className="text-xs text-white/40">Downloading facial recognition neural networks</div>
            </div>
          )}

          {/* Camera Viewport */}
          {status !== 'loading' && (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-60" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
              
              {/* Face Guide Box */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className={`w-56 h-72 border-2 rounded-[3rem] transition-colors duration-300 ${faceDetected ? 'border-[#D4AF37]/80 shadow-[0_0_30px_rgba(212,175,55,0.3)]' : 'border-white/20'}`}>
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#D4AF37] rounded-tl-3xl -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#D4AF37] rounded-tr-3xl -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#D4AF37] rounded-bl-3xl -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#D4AF37] rounded-br-3xl -mb-1 -mr-1" />
                </div>
              </div>

              {/* Status Text */}
              <div className="absolute bottom-20 left-0 right-0 text-center z-20">
                {faceDetected ? (
                  <span className="bg-[#D4AF37] text-black text-xs font-bold px-3 py-1 rounded-full">Face Detected - Ready to Scan</span>
                ) : (
                  <span className="bg-black/50 text-white/70 text-xs px-3 py-1 rounded-full backdrop-blur">Position face in frame</span>
                )}
              </div>
            </>
          )}

          {/* Overlays */}
          {status === 'success' && (
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm z-30">
              <div className="bg-black/90 p-8 rounded-3xl flex flex-col items-center gap-4 border border-green-500/30 shadow-2xl">
                <CheckCircle2 className="h-16 w-16 text-green-400" />
                <span className="text-green-400 font-bold text-xl">
                  {mode === 'register' ? 'Face Registered!' : 'Access Granted'}
                </span>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm z-30">
              <div className="bg-black/90 p-8 rounded-3xl flex flex-col items-center gap-4 border border-red-500/30 shadow-2xl">
                <AlertCircle className="h-16 w-16 text-red-400" />
                <span className="text-red-400 font-bold text-lg text-center px-4">Face Not Recognized</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer / Controls */}
        {status !== 'loading' && (
          <div className="p-6 bg-[#111] border-t border-white/[0.08]">
            {status === 'idle' && (
              <button 
                onClick={handleScan}
                disabled={!faceDetected}
                className="w-full bg-[#D4AF37] hover:bg-amber-400 disabled:bg-white/10 disabled:text-white/30 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Camera className="h-5 w-5" />
                {mode === 'register' ? 'Capture Face ID' : 'Scan Face Now'}
              </button>
            )}
            
            {status === 'scanning' && (
              <div className="text-center py-4">
                <div className="text-[#D4AF37] font-bold mb-2 animate-pulse">Analyzing Facial Structure...</div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#D4AF37] animate-progress" style={{ width: '100%', animation: 'pulse 1s infinite' }} />
                </div>
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
        )}
      </div>
    </div>
  );
}
