import { useEffect, useRef } from "react";

/**
 * Premium animated landing background.
 * Layer 1: Moving aurora ribbons and luminous glass waves.
 * Layer 2: Cursor-reactive spotlight with eased follow.
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
      <div className="absolute inset-0 bg-aurora-base" />

      <div className="aurora-ribbon aurora-ribbon-one" />
      <div className="aurora-ribbon aurora-ribbon-two" />
      <div className="aurora-ribbon aurora-ribbon-three" />

      <div className="aurora-wave aurora-wave-one" />
      <div className="aurora-wave aurora-wave-two" />

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
