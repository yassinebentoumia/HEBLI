// ============================================================
// HEBLI – Brand Logo
// Renders your real logo file from /public/logo.png everywhere.
// Just replace public/logo.png with your own image and it updates
// across the whole app (headers, landing, login, loading, badge).
// ============================================================

interface MarkProps {
  className?: string; // sizing (h-/w-)
}

// Path to your uploaded logo. Put your file at: public/logo.png
export const LOGO_SRC = '/logo.png';

// The brand mark (your logo image). Used in headers, badges, hero, etc.
export function HebliMark({ className = 'h-8 w-8' }: MarkProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="HEBLI"
      className={`${className} object-contain select-none`}
      draggable={false}
    />
  );
}

// Full lockup: logo + "HEBLI" wordmark + tagline.
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
