import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Tailwind text size class for the wordmark, e.g. "text-lg", "text-xl", "text-3xl" */
  size?: string;
}

/**
 * Hirely AI wordmark — clean lockup:
 *   hirely · ai
 * Blue gradient dot separates the wordmark from the AI tag.
 */
export const LogoLockup = ({ className, size = "text-xl" }: LogoProps) => {
  return (
    <span className={cn("inline-flex items-baseline tracking-[-0.03em]", className)}>
      <span className={cn("font-semibold text-foreground", size)}>hirely</span>
      <span
        aria-hidden="true"
        className={cn("ml-0.5 font-semibold bg-clip-text text-transparent", size)}
        style={{
          backgroundImage: "linear-gradient(120deg, hsl(220 90% 60%), hsl(200 100% 55%))",
        }}
      >
        ·
      </span>
      <span className="ml-1.5 text-[0.62em] font-semibold tracking-[0.22em] text-foreground/45 uppercase">
        ai
      </span>
    </span>
  );
};

/**
 * Compact mark-only variant — the gradient dot in a circle.
 * Useful for tight spaces or future favicon work.
 */
export const LogoMark = ({ size = 32, className }: { size?: number; className?: string }) => {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex items-center justify-center rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, hsl(220 90% 60%), hsl(200 100% 55%))",
        boxShadow: "0 6px 20px -8px hsl(220 90% 60% / 0.5)",
      }}
    />
  );
};
