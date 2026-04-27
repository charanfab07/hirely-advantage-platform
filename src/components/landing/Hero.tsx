import { ArrowRight, Play, Star, Sparkles, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";

const TARGET_SCORE = 87;

const useCountUp = (target: number, durationMs = 1800, start = false) => {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (!start) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, durationMs, start]);
  return value;
};

const ScoreGauge = () => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const score = useCountUp(TARGET_SCORE, 2000, inView);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const sweep = (score / 100) * 360;

  return (
    <div ref={ref} className="flex justify-center mb-8">
      <div className="relative size-[260px] rounded-full bg-white/30 flex items-center justify-center p-5 shadow-[inset_0_4px_12px_rgba(0,0,0,0.04)]">
        <div
          className="w-full h-full rounded-full flex items-center justify-center relative transition-[background] duration-300"
          style={{
            background: `conic-gradient(
              hsl(var(--warm-blush)) 0deg,
              hsl(var(--soft-lilac)) ${sweep * 0.45}deg,
              hsl(var(--ethereal-blue)) ${sweep}deg,
              hsl(var(--slate-ink) / 0.06) ${sweep}deg
            )`,
            boxShadow: "0 0 40px hsl(var(--ethereal-blue) / 0.5)",
          }}
        >
          <div className="absolute inset-3 bg-white/90 backdrop-blur-xl rounded-full flex flex-col items-center justify-center shadow-[inset_0_2px_15px_rgba(0,0,0,0.04)]">
            <span className="font-display font-semibold text-7xl tracking-tighter tabular-nums text-foreground leading-none">
              {score}
            </span>
            <span className="text-foreground/40 font-medium text-xs tracking-widest uppercase mt-2">
              Out of 100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MockupCard = () => {
  return (
    <div className="relative w-full max-w-[460px] mx-auto lg:mx-0 transform lg:rotate-[1.5deg] hover:rotate-0 hover:-translate-y-2 transition-transform duration-700 ease-out">
      <div className="backdrop-blur-2xl bg-white/50 border border-white/70 shadow-[0_32px_64px_-16px_hsl(var(--slate-ink)/0.18),inset_0_1px_0_rgba(255,255,255,1)] rounded-[2rem] p-8 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-gradient-to-br from-[hsl(var(--ethereal-blue))] to-[hsl(var(--soft-lilac))] p-[2px]">
              <div className="w-full h-full bg-white/80 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-foreground/60" />
              </div>
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg tracking-tight leading-none mb-1">
                Market Readiness
              </h3>
              <p className="text-[10px] font-medium text-foreground/50 uppercase tracking-wider">
                Real-time algorithm check
              </p>
            </div>
          </div>
          <div className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        </div>

        <ScoreGauge />

        {/* Keywords */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-semibold text-foreground/60">
              High-Impact Keywords
            </div>
            <div className="text-[11px] font-bold text-emerald-600">+14 found</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Strategic Vision", "Enterprise SaaS", "Cross-functional"].map((k) => (
              <div
                key={k}
                className="px-3 py-2 rounded-2xl bg-white/70 border border-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] text-xs font-semibold text-foreground backdrop-blur-md flex items-center gap-2"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {k}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating decorative pill */}
      <div className="absolute -bottom-5 -left-6 px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 shadow-lg flex items-center gap-3 transform -rotate-3">
        <div className="w-8 h-8 rounded-full bg-[hsl(var(--warm-blush))] flex items-center justify-center text-foreground font-bold text-sm">
          ↗
        </div>
        <div className="text-xs font-semibold text-foreground/80 leading-tight">
          Optimized for
          <br />
          <span className="text-foreground">Senior Product roles</span>
        </div>
      </div>
    </div>
  );
};

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-24 px-4 lg:px-12 overflow-hidden">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-10 items-center">
        {/* Left: copy */}
        <div className="flex flex-col gap-9 text-center lg:text-left">
          <Reveal delay={120}>
            <h1 className="font-display text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.04] text-foreground lg:text-9xl">
              From Ignored to
              <br />
              <span className="relative inline-block">
                <span className="text-gradient">Interviewed</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-[hsl(var(--warm-blush)/0.7)] -z-10 rounded-full transform -rotate-1" />
              </span>
              <br className="sm:hidden" /> — In Minutes.
            </h1>
          </Reveal>

          <Reveal delay={240}>
            <p className="text-lg lg:text-xl text-foreground/65 max-w-[48ch] mx-auto lg:mx-0 leading-relaxed">
              Stop sending applications into the void. Hirely AI reverse-engineers
              hiring algorithms — aligning your story with live market data, dynamic
              resume architecture, and immersive interview simulations.
            </p>
          </Reveal>

          <Reveal delay={360}>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <a
                href="#cta"
                className="group inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_hsl(var(--slate-ink)/0.4)]"
              >
                Start Free Analysis
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-white/40 backdrop-blur-md border border-foreground/10 text-foreground text-sm font-medium hover:bg-white/70 transition-colors"
              >
                <span className="size-6 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <Play className="w-3 h-3 text-foreground fill-foreground ml-0.5" />
                </span>
                Watch Demo
              </a>
            </div>
          </Reveal>

          <Reveal delay={480}>
            <div className="pt-6 mt-2 border-t border-foreground/5 flex flex-col gap-5">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-medium text-foreground/60">
                  4.9 from 2,400+ candidates hired at
                </span>
              </div>
              <div className="flex items-center justify-center lg:justify-start flex-wrap gap-x-8 gap-y-3 opacity-50">
                <span className="font-display font-bold text-lg tracking-tighter uppercase text-foreground">
                  Omnisearch
                </span>
                <span className="font-sans font-medium text-lg tracking-widest text-foreground">
                  VANGUARD
                </span>
                <span className="font-display font-semibold text-xl tracking-tight lowercase text-foreground">
                  streamer
                </span>
                <span className="font-display italic font-medium text-lg text-foreground">
                  Lumina
                </span>
                <span className="font-display font-bold text-lg tracking-tight text-foreground">
                  Northwind
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right: mockup */}
        <Reveal delay={300}>
          <MockupCard />
        </Reveal>
      </div>
    </section>
  );
};
