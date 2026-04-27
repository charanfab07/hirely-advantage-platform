import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/useInView";

const stats = [
  { value: 94, suffix: "%", label: "Land an interview within 30 days" },
  { value: 3.2, suffix: "×", label: "More callbacks vs. industry baseline", decimals: 1 },
  { value: 50, suffix: "K+", label: "Resumes architected on Hirely" },
  { value: 1.0, suffix: "M", label: "Job descriptions analyzed", decimals: 1 },
];

const Counter = ({ value, suffix, decimals = 0 }: { value: number; suffix: string; decimals?: number }) => {
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
    <span ref={ref as any} className="font-display text-5xl md:text-6xl font-semibold text-foreground tracking-tight">
      {n.toFixed(decimals)}{suffix}
    </span>
  );
};

export const Stats = () => {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-6xl glass-strong rounded-3xl p-10 md:p-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-start text-left">
              <Counter value={s.value} suffix={s.suffix} decimals={s.decimals} />
              <p className="mt-3 text-sm text-foreground/60 leading-relaxed max-w-[180px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
