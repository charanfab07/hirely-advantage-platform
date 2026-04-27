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
  const smoothedTarget = useRef({ x: 0.5, y: 0.3 });
  const current = useRef({ x: 0.5, y: 0.3 });
  const raf = useRef<number>(0);
  const lastInput = useRef<number>(performance.now());
  const startTime = useRef<number>(performance.now());

  useEffect(() => {
    // Respect reduced motion
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const isTouch = window.matchMedia("(hover: none)").matches;

    // Tuning — touch gets more inertia (lower = smoother / laggier)
    const TARGET_SMOOTH = isTouch ? 0.18 : 1; // pre-smooth raw input on touch
    const FOLLOW = isTouch ? 0.035 : 0.06;    // main eased follow
    const MAX_STEP = isTouch ? 0.012 : 1;     // per-frame velocity clamp (normalized)

    const markInput = () => {
      lastInput.current = performance.now();
    };

    const onPointer = (e: PointerEvent) => {
      target.current.x = e.clientX / window.innerWidth;
      target.current.y = e.clientY / window.innerHeight;
      markInput();
    };

    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      target.current.x = t.clientX / window.innerWidth;
      target.current.y = t.clientY / window.innerHeight;
      markInput();
    };

    // Map device tilt to parallax target. gamma: left/right (-90..90), beta: front/back (-180..180)
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      // Clamp to ±25° of tilt for a subtle range, normalize to 0..1
      const gx = Math.max(-25, Math.min(25, e.gamma)) / 25; // -1..1
      const gy = Math.max(-25, Math.min(25, (e.beta ?? 0) - 30)) / 25; // -1..1, neutral around 30°
      target.current.x = 0.5 + gx * 0.5;
      target.current.y = 0.5 + gy * 0.5;
      markInput();
    };

    const stepToward = (from: number, to: number, factor: number, maxStep: number) => {
      const delta = (to - from) * factor;
      const clamped = Math.max(-maxStep, Math.min(maxStep, delta));
      return from + clamped;
    };

    // Idle drift — after no input for IDLE_DELAY ms, slowly orbit on a Lissajous path.
    // Amplitude eases in over IDLE_RAMP ms so the transition is imperceptible.
    const IDLE_DELAY = 2500;
    const IDLE_RAMP = 1800;
    const IDLE_AMP_X = 0.18; // normalized — keeps motion within a calm range
    const IDLE_AMP_Y = 0.12;
    const IDLE_SPEED = 0.00018; // radians per ms — slow orbit

    const tick = () => {
      const now = performance.now();
      const idleFor = now - lastInput.current;

      if (idleFor > IDLE_DELAY) {
        const ramp = Math.min(1, (idleFor - IDLE_DELAY) / IDLE_RAMP);
        const t = (now - startTime.current) * IDLE_SPEED;
        // Lissajous (1:1.3 ratio) for an organic, non-repeating orbit
        target.current.x = 0.5 + Math.sin(t) * IDLE_AMP_X * ramp;
        target.current.y = 0.4 + Math.sin(t * 1.3 + Math.PI / 3) * IDLE_AMP_Y * ramp;
      }

      // Stage 1: pre-smooth the raw input target (kills high-frequency jitter from gyroscope/touch)
      smoothedTarget.current.x += (target.current.x - smoothedTarget.current.x) * TARGET_SMOOTH;
      smoothedTarget.current.y += (target.current.y - smoothedTarget.current.y) * TARGET_SMOOTH;

      // Stage 2: eased follow with per-frame velocity clamp for inertia feel
      current.current.x = stepToward(current.current.x, smoothedTarget.current.x, FOLLOW, MAX_STEP);
      current.current.y = stepToward(current.current.y, smoothedTarget.current.y, FOLLOW, MAX_STEP);

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

    if (isTouch) {
      // Touch fallback — finger drag drives parallax
      window.addEventListener("touchmove", onTouch, { passive: true });
      window.addEventListener("touchstart", onTouch, { passive: true });

      // Device orientation (gyroscope) — works without finger interaction
      // iOS 13+ requires explicit permission via a user gesture
      const DOE = (window as unknown as {
        DeviceOrientationEvent?: { requestPermission?: () => Promise<"granted" | "denied"> };
      }).DeviceOrientationEvent;
      const needsPermission = typeof DOE?.requestPermission === "function";

      if (needsPermission) {
        const requestOnce = async () => {
          try {
            const res = await DOE!.requestPermission!();
            if (res === "granted") {
              window.addEventListener("deviceorientation", onOrientation);
            }
          } catch {
            // ignore
          }
          window.removeEventListener("touchstart", requestOnce);
        };
        window.addEventListener("touchstart", requestOnce, { once: true, passive: true });
      } else {
        window.addEventListener("deviceorientation", onOrientation);
      }
    } else {
      window.addEventListener("pointermove", onPointer, { passive: true });
    }

    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("deviceorientation", onOrientation);
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
