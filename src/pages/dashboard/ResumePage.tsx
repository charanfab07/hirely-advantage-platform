import { Sparkles, Search, ArrowRight, Check, FileText, Download } from "lucide-react";
import { useEffect, useState } from "react";

const missingKeywords = [
  { word: "roadmap", impact: "high" },
  { word: "OKRs", impact: "high" },
  { word: "stakeholders", impact: "med" },
  { word: "SQL", impact: "high" },
  { word: "A/B testing", impact: "med" },
  { word: "activation", impact: "low" },
];

const presentKeywords = ["product strategy", "user research", "shipping cadence", "growth"];

const trend = [42, 48, 51, 58, 63, 71, 78, 84, 88, 92, 94];

export default function ResumePage() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title row */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur border border-white/80 px-2.5 py-1 text-[10.5px] font-medium tracking-wide text-foreground/55 shadow-[0_1px_2px_hsl(var(--slate-ink)/0.04)]">
            <FileText className="size-3" />
            resume_v7.pdf
            <span className="text-foreground/30">·</span>
            <span className="text-emerald-600 inline-flex items-center gap-1">
              <span className="size-1 rounded-full bg-emerald-500" />
              Live scan
            </span>
          </div>
          <h1 className="mt-3 font-display text-[34px] leading-[1.05] font-semibold tracking-tight">
            Senior PM <span className="text-foreground/35">@ Stripe</span>
          </h1>
          <p className="mt-1.5 text-[13.5px] text-foreground/55">
            Tailored against the <span className="text-foreground font-medium">Growth Product</span> requisition · synced 2 min ago
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/80 backdrop-blur px-3.5 py-2 text-[12.5px] font-semibold text-foreground/75 hover:text-foreground hover:border-foreground/15 transition-colors shadow-[0_1px_2px_hsl(var(--slate-ink)/0.04)]">
          <Download className="size-3.5" />
          Export
        </button>
      </div>

      <ScoreCard />

      <div className="grid grid-cols-5 gap-6">
        <RewriteCard />
        <KeywordsCard />
      </div>

      <PresentKeywordsCard />
    </div>
  );
}

/* ─────────────────────────── Score Card ─────────────────────────── */

function ScoreCard() {
  const [score, setScore] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setScore(94), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/80 p-7 backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(135deg, hsl(0 0% 100% / 0.9), hsl(var(--ethereal-blue) / 0.55) 55%, hsl(var(--soft-lilac) / 0.5))",
        boxShadow:
          "0 1px 0 hsl(0 0% 100% / 0.85) inset, 0 1px 2px hsl(var(--slate-ink) / 0.04), 0 24px 60px -30px hsl(var(--slate-ink) / 0.18)",
      }}
    >
      <div
        className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full blur-2xl"
        style={{ background: "hsl(var(--warm-blush) / 0.5)" }}
      />

      <div className="relative grid grid-cols-[auto_1fr_auto] gap-8 items-center">
        <ScoreRing value={score} />

        <div className="min-w-0">
          <div className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-foreground/45">
            Market Readiness Score
          </div>
          <div className="mt-2 font-display text-[22px] font-semibold tracking-tight leading-tight">
            You're outperforming{" "}
            <span className="text-foreground/45">94%</span> of applicants for this role.
          </div>
          <div className="mt-3 flex items-center gap-3 text-[12.5px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 font-medium">
              <ArrowRight className="size-3 -rotate-45" />
              +52 pts since v1
            </span>
            <span className="text-foreground/45">·</span>
            <span className="text-foreground/55">Top 6% nationally</span>
          </div>
        </div>

        <Sparkline data={trend} />
      </div>
    </section>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative size-[132px] shrink-0">
      <svg viewBox="0 0 120 120" className="size-[132px] -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--slate-ink))" strokeOpacity="0.07" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(213 100% 75%)" />
            <stop offset="50%" stopColor="hsl(270 80% 78%)" />
            <stop offset="100%" stopColor="hsl(350 92% 82%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center leading-none">
          <div className="font-display text-[44px] font-semibold tabular-nums tracking-tight">
            {value}
          </div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.15em] text-foreground/40">
            / 100
          </div>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const w = 180;
  const h = 64;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  });
  const path = `M ${pts.join(" L ")}`;
  const area = `${path} L ${w},${h} L 0,${h} Z`;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <svg width={w} height={h} className="overflow-visible">
        <defs>
          <linearGradient id="sparkArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(270 80% 70%)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="hsl(270 80% 70%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sparkLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(213 100% 70%)" />
            <stop offset="100%" stopColor="hsl(350 92% 75%)" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sparkArea)" />
        <path d={path} fill="none" stroke="url(#sparkLine)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle
          cx={w}
          cy={h - ((data[data.length - 1] - min) / (max - min)) * h}
          r="3.5"
          fill="hsl(270 80% 70%)"
        />
        <circle
          cx={w}
          cy={h - ((data[data.length - 1] - min) / (max - min)) * h}
          r="7"
          fill="hsl(270 80% 70%)"
          fillOpacity="0.18"
        />
      </svg>
      <div className="text-[10px] font-mono uppercase tracking-wider text-foreground/40">
        11 scans · 14 days
      </div>
    </div>
  );
}

/* ─────────────────────────── Rewrite Card ─────────────────────────── */

function RewriteCard() {
  return (
    <section
      className="col-span-3 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 p-6"
      style={{
        boxShadow:
          "0 1px 0 hsl(0 0% 100% / 0.85) inset, 0 1px 2px hsl(var(--slate-ink) / 0.04), 0 18px 40px -28px hsl(var(--slate-ink) / 0.12)",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground border border-white"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--soft-lilac)), hsl(var(--ethereal-blue)))",
          }}
        >
          <Sparkles className="size-3" />
          AI Rewrite
        </div>
        <span className="text-[11px] font-mono text-foreground/40">Bullet 3 of 12</span>
      </div>

      <div className="mt-5">
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/40 mb-2">
          Before
        </div>
        <p className="text-[14px] text-foreground/45 line-through decoration-foreground/25 leading-relaxed">
          Helped improve product onboarding metrics.
        </p>
      </div>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-foreground/[0.08]" />
        <ArrowRight className="size-3.5 text-foreground/35 rotate-90" />
        <div className="h-px flex-1 bg-foreground/[0.08]" />
      </div>

      <div>
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-foreground mb-2">
          After
        </div>
        <p className="font-display text-[16px] leading-[1.55] text-foreground">
          Drove a{" "}
          <span
            className="px-1.5 py-0.5 rounded-md font-semibold tabular-nums text-foreground"
            style={{ background: "hsl(213 100% 80% / 0.55)" }}
          >
            38% activation lift
          </span>{" "}
          across 6 A/B tests on onboarding flow, unlocking{" "}
          <span
            className="px-1.5 py-0.5 rounded-md font-semibold tabular-nums text-foreground"
            style={{ background: "hsl(350 92% 85% / 0.6)" }}
          >
            $1.2M ARR
          </span>{" "}
          for the SMB segment.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <button
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-foreground border border-white hover:-translate-y-px transition-all shadow-[0_6px_16px_-6px_hsl(var(--slate-ink)/0.18)]"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--ethereal-blue)), hsl(var(--soft-lilac)) 60%, hsl(var(--warm-blush)))",
          }}
        >
          <Check className="size-3.5" />
          Accept rewrite
        </button>
        <button className="rounded-lg border border-foreground/[0.12] bg-white/70 backdrop-blur px-3 py-1.5 text-[12px] font-medium text-foreground/70 hover:text-foreground hover:border-foreground/25 transition-colors">
          Regenerate
        </button>
        <button className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-foreground/45 hover:text-foreground transition-colors ml-auto">
          Skip
        </button>
      </div>
    </section>
  );
}

/* ─────────────────────────── Keywords ─────────────────────────── */

function KeywordsCard() {
  return (
    <section
      className="col-span-2 rounded-3xl border border-white/80 p-6 backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(160deg, hsl(0 0% 100% / 0.85), hsl(var(--dawn-orange) / 0.45))",
        boxShadow:
          "0 1px 0 hsl(0 0% 100% / 0.85) inset, 0 1px 2px hsl(var(--slate-ink) / 0.04), 0 18px 40px -28px hsl(var(--slate-ink) / 0.12)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/65">
          <Search className="size-3" />
          Missing keywords
        </div>
        <span className="text-[11px] font-mono text-foreground/40">6 gaps</span>
      </div>

      <p className="mt-3 text-[12.5px] text-foreground/55 leading-relaxed">
        These terms appear in the JD but not in your resume. Adding them lifts your score the most.
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {missingKeywords.map((k) => (
          <span
            key={k.word}
            className="group inline-flex items-center gap-1 rounded-full bg-foreground text-background px-2.5 py-1 text-[11.5px] font-medium hover:scale-105 transition-transform cursor-pointer"
          >
            <span className="text-background/55">+</span>
            {k.word}
            {k.impact === "high" && (
              <span className="ml-0.5 size-1 rounded-full bg-amber-400" />
            )}
          </span>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-foreground/[0.08] flex items-center justify-between text-[11px]">
        <span className="text-foreground/45">
          <span className="inline-block size-1.5 rounded-full bg-amber-400 mr-1.5 align-middle" />
          High impact
        </span>
        <button className="text-foreground font-semibold hover:underline underline-offset-2">
          Auto-insert all →
        </button>
      </div>
    </section>
  );
}

function PresentKeywordsCard() {
  return (
    <section className="rounded-3xl bg-white/50 backdrop-blur border border-white/70 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/50">
          Already strong on
        </div>
        <span className="text-[11px] font-mono text-foreground/40">{presentKeywords.length} matches</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presentKeywords.map((w) => (
          <span
            key={w}
            className="inline-flex items-center gap-1 rounded-full bg-white border border-white px-2.5 py-1 text-[11.5px] font-medium text-foreground/70 shadow-[0_1px_2px_hsl(var(--slate-ink)/0.04)]"
          >
            <Check className="size-3 text-emerald-600" />
            {w}
          </span>
        ))}
      </div>
    </section>
  );
}
