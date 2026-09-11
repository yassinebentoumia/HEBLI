// ============================================================
// HEBLI – Brand Logo (leaf "H" monogram) as crisp SVG
// Matches the "Classic Premium" identity: Forest Green + Gold.
// ============================================================

interface LogoProps {
  className?: string;   // sizing for the monogram (h-/w-)
  gold?: string;        // override gold color
}

// The leaf-H monogram only (use in headers, favicons, badges).
export function HebliMark({ className = 'h-8 w-8', gold = '#D4AF37' }: LogoProps) {
  return (
    <svg viewBox="0 0 64 72" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="HEBLI">
      {/* left stem */}
      <rect x="8" y="6" width="8" height="60" rx="2" fill={gold} />
      {/* right stem */}
      <rect x="48" y="6" width="8" height="60" rx="2" fill={gold} />
      {/* crossbar */}
      <rect x="16" y="32" width="32" height="8" rx="2" fill={gold} />
      {/* leaf rising through the center */}
      <path
        d="M32 8 C 20 20, 20 40, 32 52 C 44 40, 44 20, 32 8 Z"
        fill={gold}
        opacity="0.92"
      />
      {/* leaf vein */}
      <path d="M32 12 L32 50" stroke="#0B1512" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

// Full lockup: monogram + wordmark + tagline (use on Landing / Login).
export function HebliLogo({
  className = '',
  size = 'md',
  tagline = true,
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  tagline?: boolean;
}) {
  const mark = size === 'lg' ? 'h-16 w-16' : size === 'sm' ? 'h-8 w-8' : 'h-11 w-11';
  const word = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
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
