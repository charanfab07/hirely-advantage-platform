import { cn } from "@/lib/utils";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * LogoMark — geometric 'H' monogram on a slate-ink rounded tile.
 * Crossbar tilts upward to suggest career trajectory; small spark hints at AI.
 * Scales cleanly down to favicon size.
 */
export const LogoMark = ({ size = 32, className }: LogoMarkProps) => {
  const radius = size * 0.31; // ~rounded-xl at 32

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center bg-foreground overflow-hidden",
        className
      )}
      style={{ width: size, height: size, borderRadius: radius }}
      aria-hidden="true"
    >
      {/* Subtle aurora wash inside the tile */}
      <span
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(120% 100% at 20% 0%, hsl(270 100% 80% / 0.35), transparent 55%), radial-gradient(120% 100% at 100% 100%, hsl(213 100% 75% / 0.35), transparent 55%)",
        }}
      />
      <svg
        viewBox="0 0 32 32"
        width={size * 0.62}
        height={size * 0.62}
        fill="none"
        className="relative"
      >
        <defs>
          <linearGradient id="logoStroke" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(213 100% 92%)" />
            <stop offset="55%" stopColor="hsl(0 0% 100%)" />
            <stop offset="100%" stopColor="hsl(270 100% 92%)" />
          </linearGradient>
        </defs>

        {/* Left vertical bar */}
        <rect x="5" y="4" width="4" height="24" rx="1.4" fill="url(#logoStroke)" />
        {/* Right vertical bar */}
        <rect x="23" y="4" width="4" height="24" rx="1.4" fill="url(#logoStroke)" />
        {/* Angled crossbar — upward trajectory (~15°) */}
        <path
          d="M9 19 L23 13 L23 17 L9 23 Z"
          fill="url(#logoStroke)"
        />
        {/* Spark accent — top of right bar */}
        <circle cx="25" cy="3.2" r="1.6" fill="hsl(213 100% 88%)" />
      </svg>
    </span>
  );
};

interface LogoLockupProps {
  size?: number;
  showBadge?: boolean;
  className?: string;
}

/**
 * LogoLockup — mark + "Hirely" wordmark + optional "AI" badge.
 */
export const LogoLockup = ({ size = 32, showBadge = true, className }: LogoLockupProps) => {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark size={size} className="transition-transform group-hover:scale-105" />
      <span className="font-display font-semibold text-lg tracking-tight text-foreground">
        Hirely
      </span>
      {showBadge && (
        <span className="text-xs font-medium text-muted-foreground/80 px-1.5 py-0.5 rounded-md bg-foreground/5">
          AI
        </span>
      )}
    </span>
  );
};
