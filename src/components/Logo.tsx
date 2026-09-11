// ============================================================
// HEBLI – Brand Logo
// Your real logo (public/logo.png) is DARK olive-green on a
// transparent background. On the dark app it would vanish, so we
// place it on a light "paper/stone" card (like the brand mockups)
// inside a gold-ringed frame → crisp + luxurious everywhere.
// Just replace public/logo.png with your file.
// ============================================================

export const LOGO_SRC = '/logo.png';

// Light "stone/cream" surface the dark-green logo sits on (matches the mockups).
const CARD_BG = 'bg-gradient-to-br from-[#F3EEE3] to-[#E7DECB]';

interface MarkProps {
  className?: string; // outer sizing (h-/w-)
  rounded?: string;   // corner radius util
}

// Small brand chip for dark headers (logo on a light rounded card).
export function HebliMark({ className = 'h-9 w-9', rounded = 'rounded-xl' }: MarkProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${rounded} ${CARD_BG} ${className} p-1 ring-1 ring-[#D4AF37]/40 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.5)]`}
    >
      <img src={LOGO_SRC} alt="HEBLI" className="h-full w-full object-contain select-none" draggable={false} />
    </span>
  );
}

// Raw logo image (use on already-light backgrounds: print, invoices, reports).
export function HebliPlain({ className = 'h-10' }: { className?: string }) {
  return <img src={LOGO_SRC} alt="HEBLI" className={`${className} object-contain select-none`} draggable={false} />;
}

// Big hero logo for the Landing page: logo on a light stone card, gold ring,
// warm glow — auto-sized and always premium (works with a transparent logo).
export function HebliHeroLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`relative mx-auto inline-flex items-center justify-center ${className}`}>
      {/* warm gold glow behind the card */}
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-[#D4AF37]/20 blur-3xl" />
      {/* light stone card with gold ring (mirrors the printed mockup) */}
      <div
        className={`relative flex items-center justify-center rounded-[1.75rem] ${CARD_BG} p-8 sm:p-12 ring-1 ring-[#D4AF37]/50 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.7)]`}
      >
        {/* thin inner gold hairline for a framed, luxury feel */}
        <div className="pointer-events-none absolute inset-3 rounded-[1.35rem] border border-[#6B5B2E]/15" />
        <img
          src={LOGO_SRC}
          alt="HEBLI — Coffee × Working Space"
          className="relative h-40 w-40 sm:h-56 sm:w-56 object-contain select-none"
          draggable={false}
        />
      </div>
    </div>
  );
}

// Full inline lockup (logo chip + wordmark + tagline) — optional.
export function HebliLogo({
  className = '',
  size = 'md',
  tagline = true,
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tagline?: boolean;
}) {
  const mark =
    size === 'xl' ? 'h-20 w-20' : size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-8 w-8' : 'h-11 w-11';
  const word =
    size === 'xl' ? 'text-5xl sm:text-7xl' : size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
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
