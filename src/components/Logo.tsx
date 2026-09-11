// ============================================================
// HEBLI – Brand Logo (advanced luxury treatment)
// Your logo (public/logo.png) is dark olive-green on transparent.
// We present it on a light stone medallion framed by a rotating
// conic-gold ring, dual glow, corner ornaments and an animated
// sheen sweep — a premium, high-end emblem.
// ============================================================

import { motion } from 'framer-motion';

export const LOGO_SRC = '/logo.png';

// Light "stone/cream" surface the dark-green logo sits on.
const CARD_BG = 'bg-gradient-to-br from-[#F5F0E6] via-[#EFE7D6] to-[#E3D8C0]';

interface MarkProps {
  className?: string;
  rounded?: string;
}

// ---- Small brand chip (headers / login) ---------------------------------
// Light medallion + thin gold ring + gloss. Crisp on the dark UI.
export function HebliMark({ className = 'h-9 w-9', rounded = 'rounded-xl' }: MarkProps) {
  return (
    <span
      className={`group relative inline-flex items-center justify-center overflow-hidden ${rounded} ${CARD_BG} ${className} ring-1 ring-[#D4AF37]/50 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.6)]`}
    >
      {/* top gloss */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent" />
      <img src={LOGO_SRC} alt="HEBLI" className="relative h-full w-full object-contain p-1 select-none" draggable={false} />
    </span>
  );
}

// Raw logo (already-light backgrounds: print invoices / reports).
export function HebliPlain({ className = 'h-10' }: { className?: string }) {
  return <img src={LOGO_SRC} alt="HEBLI" className={`${className} object-contain select-none`} draggable={false} />;
}

// ---- Advanced hero emblem (Landing) -------------------------------------
export function HebliHeroLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`relative mx-auto grid place-items-center ${className}`} style={{ width: 'min(78vw, 340px)', height: 'min(78vw, 340px)' }}>
      {/* Ambient dual glow */}
      <div className="pointer-events-none absolute inset-0 -z-20 rounded-full bg-[#D4AF37]/25 blur-[70px]" />
      <div className="pointer-events-none absolute inset-6 -z-20 rounded-full bg-emerald-400/10 blur-3xl" />

      {/* Rotating conic gold ring */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, #D4AF37 60deg, #FFE8A3 120deg, #8C6F1F 180deg, transparent 240deg, #D4AF37 320deg, transparent 360deg)',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      {/* Static fine gold hairline just inside the rotating ring */}
      <div className="absolute inset-[10px] rounded-full border border-[#D4AF37]/25" />

      {/* Corner ornaments (four gold ticks around the emblem) */}
      {[
        'top-1 left-1/2 -translate-x-1/2',
        'bottom-1 left-1/2 -translate-x-1/2',
        'left-1 top-1/2 -translate-y-1/2 rotate-90',
        'right-1 top-1/2 -translate-y-1/2 rotate-90',
      ].map((pos, i) => (
        <div key={i} className={`pointer-events-none absolute ${pos}`}>
          <div className="h-3 w-3 border-t border-[#D4AF37]/60" />
        </div>
      ))}

      {/* Floating medallion */}
      <motion.div
        className="relative grid place-items-center"
        style={{ width: '74%', height: '74%' }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* medallion surface */}
        <div className={`relative grid h-full w-full place-items-center overflow-hidden rounded-full ${CARD_BG} shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75),inset_0_2px_10px_rgba(255,255,255,0.6)] ring-1 ring-[#D4AF37]/40`}>
          {/* inner engraved rings */}
          <div className="pointer-events-none absolute inset-4 rounded-full border border-[#6B5B2E]/15" />
          <div className="pointer-events-none absolute inset-7 rounded-full border border-[#6B5B2E]/10" />

          {/* the logo */}
          <img
            src={LOGO_SRC}
            alt="HEBLI — Coffee × Working Space"
            className="relative z-10 h-[62%] w-[62%] object-contain select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
            draggable={false}
          />

          {/* Animated sheen sweep across the medallion */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={{ x: '-120%' }}
            animate={{ x: '120%' }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
          >
            <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" style={{ transform: 'skewX(-18deg)' }} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ---- Inline lockup (optional) -------------------------------------------
export function HebliLogo({
  className = '',
  size = 'md',
  tagline = true,
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tagline?: boolean;
}) {
  const mark = size === 'xl' ? 'h-20 w-20' : size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-8 w-8' : 'h-11 w-11';
  const word = size === 'xl' ? 'text-5xl sm:text-7xl' : size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <HebliMark className={mark} />
      <div className="leading-none">
        <div className={`${word} font-bold tracking-[0.15em] text-[#D4AF37]`}>HEBLI</div>
        {tagline && (
          <div className="mt-1 text-[9px] sm:text-[10px] font-medium tracking-[0.3em] text-white/45 uppercase">
            Coffee × Working Space
          </div>
        )}
      </div>
    </div>
  );
}

export default HebliLogo;
