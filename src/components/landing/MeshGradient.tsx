import { useEffect, useRef } from "react";

/**
 * Animated fluid mesh gradient background + cursor-reactive spotlight.
 * Layer 1: Slow drifting pastel orbs (ambient, always-on)
 * Layer 2: Soft radial glow that follows the cursor with easing (rewards interaction)
 * Fixed full-screen, sits behind all content.
 */
export const MeshGradient = () => {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0.5, y: 0.3 });
  const current = useRef({ x: 0.5, y: 0.3 });
  const raf = useRef<number>(0);

  useEffect(() => {
    // Respect reduced motion
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    // Skip on touch-primary devices (no hover cursor)
    const isTouch = window.matchMedia("(hover: none)").matches;
    if (isTouch) return;

    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX / window.innerWidth;
      target.current.y = e.clientY / window.innerHeight;
    };

    const tick = () => {
      // Eased follow (0.06 = soft lag)
      current.current.x += (target.current.x - current.current.x) * 0.06;
      current.current.y += (target.current.y - current.current.y) * 0.06;
      const el = spotlightRef.current;
      if (el) {
        el.style.transform = `translate3d(${current.current.x * 100}vw, ${current.current.y * 100}vh, 0) translate(-50%, -50%)`;
      }
      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ backgroundColor: "hsl(var(--pearl))" }}
    >
      {/* Ethereal blue */}
      <div
        className="absolute -top-[20%] -left-[15%] w-[70vw] h-[70vw] rounded-full opacity-90 animate-orb-1"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--ethereal-blue) / 0.95) 0%, hsl(var(--ethereal-blue) / 0) 65%)",
          filter: "blur(80px)",
        }}
      />
      {/* Soft lilac */}
      <div
        className="absolute top-[10%] -right-[15%] w-[65vw] h-[65vw] rounded-full opacity-90 animate-orb-2"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--soft-lilac) / 0.95) 0%, hsl(var(--soft-lilac) / 0) 65%)",
          filter: "blur(90px)",
        }}
      />
      {/* Warm blush */}
      <div
        className="absolute top-[40%] left-[10%] w-[60vw] h-[60vw] rounded-full opacity-80 animate-orb-3"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--warm-blush) / 0.9) 0%, hsl(var(--warm-blush) / 0) 65%)",
          filter: "blur(100px)",
        }}
      />
      {/* Dawn orange */}
      <div
        className="absolute bottom-[-20%] right-[5%] w-[70vw] h-[70vw] rounded-full opacity-85 animate-orb-4"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--dawn-orange) / 0.95) 0%, hsl(var(--dawn-orange) / 0) 65%)",
          filter: "blur(110px)",
        }}
      />

      {/* Cursor-reactive spotlight — soft warm-blush + lilac tint */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 w-[60vw] h-[60vw] rounded-full pointer-events-none will-change-transform"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--warm-blush) / 0.55) 0%, hsl(var(--soft-lilac) / 0.35) 35%, hsl(var(--soft-lilac) / 0) 70%)",
          filter: "blur(60px)",
          mixBlendMode: "screen",
        }}
      />

      {/* Grain */}
      <div className="grain" />
    </div>
  );
};
