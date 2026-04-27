import { useEffect, useRef } from "react";

/**
 * Premium animated landing background.
 * Layer 1: Moving aurora ribbons and luminous glass waves.
 * Layer 2: Cursor-reactive spotlight with eased follow.
 * Fixed full-screen, sits behind all content.
 */
export const MeshGradient = () => {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const ribbonOneRef = useRef<HTMLDivElement>(null);
  const ribbonTwoRef = useRef<HTMLDivElement>(null);
  const ribbonThreeRef = useRef<HTMLDivElement>(null);
  const waveOneRef = useRef<HTMLDivElement>(null);
  const waveTwoRef = useRef<HTMLDivElement>(null);
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

      // Normalized -0.5..0.5 offset from screen center
      const dx = current.current.x - 0.5;
      const dy = current.current.y - 0.5;

      const spotlight = spotlightRef.current;
      if (spotlight) {
        spotlight.style.transform = `translate3d(${current.current.x * 100}vw, ${current.current.y * 100}vh, 0) translate(-50%, -50%)`;
      }

      // Subtle parallax — different depths for layered feel
      const apply = (el: HTMLDivElement | null, depth: number) => {
        if (!el) return;
        el.style.setProperty("--parallax-x", `${dx * depth}px`);
        el.style.setProperty("--parallax-y", `${dy * depth}px`);
      };
      apply(ribbonOneRef.current, 36);
      apply(ribbonTwoRef.current, 24);
      apply(ribbonThreeRef.current, 18);
      apply(waveOneRef.current, 12);
      apply(waveTwoRef.current, 8);

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
      <div className="absolute inset-0 bg-aurora-base" />

      <div ref={ribbonOneRef} className="aurora-ribbon aurora-ribbon-one parallax-layer" />
      <div ref={ribbonTwoRef} className="aurora-ribbon aurora-ribbon-two parallax-layer" />
      <div ref={ribbonThreeRef} className="aurora-ribbon aurora-ribbon-three parallax-layer" />

      <div ref={waveOneRef} className="aurora-wave aurora-wave-one parallax-layer" />
      <div ref={waveTwoRef} className="aurora-wave aurora-wave-two parallax-layer" />

      <div className="light-sweep light-sweep-one" />
      <div className="light-sweep light-sweep-two" />

      <div className="spark-field">
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} style={{ "--i": index } as React.CSSProperties} />
        ))}
      </div>

      {/* Cursor-reactive spotlight — visibly rewards movement */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 w-[58vw] h-[58vw] rounded-full pointer-events-none will-change-transform"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--ethereal-blue) / 0.95) 0%, hsl(var(--soft-lilac) / 0.62) 34%, hsl(var(--warm-blush) / 0.32) 56%, hsl(var(--soft-lilac) / 0) 74%)",
          filter: "blur(24px)",
          mixBlendMode: "multiply",
          opacity: 0.9,
        }}
      />

      {/* Grain */}
      <div className="grain" />
    </div>
  );
};
