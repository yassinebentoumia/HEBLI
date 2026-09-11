// ============================================================
// HEBLI – Brand Logo (matches the real "H + leaf" monogram)
// Olive-green → gold gradient. Left stroke of the H is a leaf.
// ============================================================

let _gid = 0;

interface MarkProps {
  className?: string; // sizing (h-/w-)
}

// The leaf-"H" monogram (used in headers, favicons, badges).
export function HebliMark({ className = 'h-8 w-8' }: MarkProps) {
  // unique gradient id so multiple marks on one page don't clash
  const id = `hebliGrad-${(_gid = (_gid + 1) % 100000)}`;
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="HEBLI">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8D8A0" />
          <stop offset="45%" stopColor="#C9B060" />
          <stop offset="100%" stopColor="#5A6B3B" />
        </linearGradient>
      </defs>

      {/* Right vertical stroke of the H (straight) */}
      <rect x="66" y="14" width="12" height="72" rx="2" fill={`url(#${id})`} />

      {/* Crossbar */}
      <rect x="34" y="44" width="34" height="12" rx="2" fill={`url(#${id})`} />

      {/* Left stroke rendered as a LEAF (curved, pointed top) */}
      <path
        d="M40 14
           C 22 30, 22 66, 40 86
           C 46 78, 46 22, 40 14 Z"
        fill={`url(#${id})`}
      />
      {/* leaf vein */}
      <path d="M40 20 C 33 40, 33 62, 40 80"
        stroke="#0B1512" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.35" />
    </svg>
  );
}

// Full stacked lockup: monogram on top, wordmark + tagline below (Landing hero).
export function HebliLogo({
  className = '',
  size = 'md',
  tagline = true,
  stacked = false,
  est = false,
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tagline?: boolean;
  stacked?: boolean;
  est?: boolean;
}) {
  const mark =
    size === 'xl' ? 'h-24 w-24' : size === 'lg' ? 'h-16 w-16' : size === 'sm' ? 'h-8 w-8' : 'h-11 w-11';
  const word =
    size === 'xl' ? 'text-5xl sm:text-7xl' : size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl';

  if (stacked) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <HebliMark className={mark} />
        <div className={`mt-3 ${word} font-bold tracking-[0.35em] text-[#D4AF37]`}>HEBLI</div>
        {tagline && (
          <div className="mt-2 text-[10px] sm:text-xs font-medium tracking-[0.4em] text-white/50 uppercase">
            Coffee × Working Space
          </div>
        )}
        {est && (
          <div className="mt-2 flex items-center gap-2 text-[9px] tracking-[0.4em] text-white/30 uppercase">
            <span className="h-px w-6 bg-white/20" /> Est. 2025 <span className="h-px w-6 bg-white/20" />
          </div>
        )}
      </div>
    );
  }

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
