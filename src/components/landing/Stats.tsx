import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/useInView";

const stats = [
  { value: 94, suffix: "%", label: "Land an interview within 30 days" },
  { value: 3.2, suffix: "×", label: "More callbacks vs. industry baseline", decimals: 1 },
  { value: 50, suffix: "K+", label: "Resumes architected on Hirely" },
  { value: 1.0, suffix: "M", label: "Job descriptions analyzed", decimals: 1 },
];

const Counter = ({ value, suffix, decimals = 0, className = "font-display text-5xl md:text-6xl font-semibold text-foreground tracking-tight" }: { value: number; suffix: string; decimals?: number; className?: string }) => {
  const { ref, inView } = useInView();
  const [n, setN] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const duration = 1600;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref as any} className={className}>
      {n.toFixed(decimals)}{suffix}
    </span>
  );
};

export const Stats = ({ embedded = false }: { embedded?: boolean }) => {
  const inner = (
    <div className="glass-strong rounded-[2rem] px-6 md:px-8 py-4 md:py-5 relative overflow-hidden h-full">
      {/* Inner sheen */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[60%] h-40 rounded-full bg-white/40 blur-3xl pointer-events-none" />

      <div className="grid grid-cols-2 gap-y-8 relative h-full content-center">
        {stats.map((s, i) => (
          <div
            key={i}
            className={`flex flex-col items-center text-center px-2 ${
              i % 2 === 1 ? "border-l border-foreground/10" : ""
            }`}
          >
            <Counter
              value={s.value}
              suffix={s.suffix}
              decimals={s.decimals}
              className="font-display text-3xl md:text-4xl font-semibold text-foreground tracking-tight"
            />
            <p className="mt-2 text-xs text-foreground/60 leading-relaxed max-w-[180px]">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );

  if (embedded) return inner;

  return (
    <section className="px-4 -mt-8 md:-mt-16 pb-20 relative z-10">
      <div className="mx-auto max-w-6xl relative">
        {/* Ambient halo */}
        <div className="absolute -inset-x-10 -inset-y-6 -z-10 opacity-60 blur-3xl pointer-events-none">
          <div className="absolute left-[5%] top-0 w-[40%] h-full rounded-full bg-[hsl(var(--ethereal-blue))]" />
          <div className="absolute right-[10%] top-0 w-[35%] h-full rounded-full bg-[hsl(var(--soft-lilac))]" />
          <div className="absolute left-[40%] top-0 w-[30%] h-full rounded-full bg-[hsl(var(--warm-blush))]" />
        </div>
        {inner}
      </div>
    </section>
  );
};
