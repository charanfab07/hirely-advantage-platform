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
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#1A1D27]/[0.07] px-2.5 py-1 text-[10.5px] font-medium tracking-wide text-[#1A1D27]/55">
            <FileText className="size-3" />
            resume_v7.pdf
            <span className="text-[#1A1D27]/30">·</span>
            <span className="text-emerald-600 inline-flex items-center gap-1">
              <span className="size-1 rounded-full bg-emerald-500" />
              Live scan
            </span>
          </div>
          <h1 className="mt-3 font-display text-[34px] leading-[1.05] font-semibold tracking-tight">
            Senior PM <span className="text-[#1A1D27]/35">@ Stripe</span>
          </h1>
          <p className="mt-1.5 text-[13.5px] text-[#1A1D27]/55">
            Tailored against the <span className="text-[#1A1D27] font-medium">Growth Product</span> requisition · synced 2 min ago
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-xl border border-[#1A1D27]/[0.08] bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[#1A1D27]/75 hover:text-[#1A1D27] hover:border-[#1A1D27]/15 transition-colors">
          <Download className="size-3.5" />
          Export
        </button>
      </div>

      {/* Score Card — hero */}
      <ScoreCard />

      {/* Two-up: AI Rewrite + Keywords */}
      <div className="grid grid-cols-5 gap-6">
        <RewriteCard />
        <KeywordsCard />
      </div>

      {/* Bottom: present keywords + actions */}
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
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-[#F3E8FF] border border-[#1A1D27]/[0.06] p-7 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_1px_2px_rgba(15,15,14,0.03),0_24px_60px_-30px_rgba(15,15,14,0.18)]"
    >
      {/* decorative corner mark */}
      <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-gradient-to-br from-[#1A1D27]/[0.03] to-transparent blur-2xl" />

      <div className="relative grid grid-cols-[auto_1fr_auto] gap-8 items-center">
        {/* Big radial score */}
        <ScoreRing value={score} />

        {/* Middle: copy */}
        <div className="min-w-0">
          <div className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-[#1A1D27]/45">
            Market Readiness Score
          </div>
          <div className="mt-2 font-display text-[22px] font-semibold tracking-tight leading-tight">
            You're outperforming{" "}
            <span className="text-[#1A1D27]/45">94%</span> of applicants for this role.
          </div>
          <div className="mt-3 flex items-center gap-3 text-[12.5px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 font-medium">
              <ArrowRight className="size-3 -rotate-45" />
              +52 pts since v1
            </span>
            <span className="text-[#1A1D27]/45">·</span>
            <span className="text-[#1A1D27]/55">Top 6% nationally</span>
          </div>
        </div>

        {/* Right: sparkline */}
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
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1A1D27" strokeOpacity="0.06" strokeWidth="9" />
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
            <stop offset="0%" stopColor="#1A1D27" />
            <stop offset="100%" stopColor="#4B5275" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center leading-none">
          <div className="font-display text-[44px] font-semibold tabular-nums tracking-tight">
            {value}
          </div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.15em] text-[#1A1D27]/40">
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
            <stop offset="0%" stopColor="#1A1D27" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1A1D27" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sparkArea)" />
        <path d={path} fill="none" stroke="#1A1D27" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        {/* End dot */}
        <circle
          cx={w}
          cy={h - ((data[data.length - 1] - min) / (max - min)) * h}
          r="3.5"
          fill="#1A1D27"
        />
        <circle
          cx={w}
          cy={h - ((data[data.length - 1] - min) / (max - min)) * h}
          r="7"
          fill="#1A1D27"
          fillOpacity="0.12"
        />
      </svg>
      <div className="text-[10px] font-mono uppercase tracking-wider text-[#1A1D27]/40">
        11 scans · 14 days
      </div>
    </div>
  );
}

/* ─────────────────────────── Rewrite Card ─────────────────────────── */

function RewriteCard() {
  return (
    <section className="col-span-3 rounded-3xl bg-white border border-[#1A1D27]/[0.06] p-6 shadow-[0_1px_2px_rgba(15,15,14,0.03)]">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#1A1D27] text-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]">
          <Sparkles className="size-3" />
          AI Rewrite
        </div>
        <span className="text-[11px] font-mono text-[#1A1D27]/40">Bullet 3 of 12</span>
      </div>

      {/* Before */}
      <div className="mt-5">
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#1A1D27]/40 mb-2">
          Before
        </div>
        <p className="text-[14px] text-[#1A1D27]/45 line-through decoration-[#1A1D27]/25 leading-relaxed">
          Helped improve product onboarding metrics.
        </p>
      </div>

      {/* Arrow divider */}
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#1A1D27]/[0.06]" />
        <ArrowRight className="size-3.5 text-[#1A1D27]/35 rotate-90" />
        <div className="h-px flex-1 bg-[#1A1D27]/[0.06]" />
      </div>

      {/* After */}
      <div>
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#1A1D27] mb-2">
          After
        </div>
        <p className="font-display text-[16px] leading-[1.55] text-[#1A1D27]">
          Drove a{" "}
          <span className="bg-[#1A1D27] text-white px-1.5 py-0.5 rounded-md font-semibold tabular-nums">
            38% activation lift
          </span>{" "}
          across 6 A/B tests on onboarding flow, unlocking{" "}
          <span className="bg-[#1A1D27] text-white px-1.5 py-0.5 rounded-md font-semibold tabular-nums">
            $1.2M ARR
          </span>{" "}
          for the SMB segment.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1D27] text-white px-3 py-1.5 text-[12px] font-semibold hover:bg-[#1A1D27]/85 transition-colors">
          <Check className="size-3.5" />
          Accept rewrite
        </button>
        <button className="rounded-lg border border-[#1A1D27]/[0.1] px-3 py-1.5 text-[12px] font-medium text-[#1A1D27]/65 hover:text-[#1A1D27] hover:border-[#1A1D27]/20 transition-colors">
          Regenerate
        </button>
        <button className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[#1A1D27]/45 hover:text-[#1A1D27] transition-colors ml-auto">
          Skip
        </button>
      </div>
    </section>
  );
}

/* ─────────────────────────── Keywords Cards ─────────────────────────── */

function KeywordsCard() {
  return (
    <section className="col-span-2 rounded-3xl bg-white border border-[#1A1D27]/[0.06] p-6 shadow-[0_1px_2px_rgba(15,15,14,0.03)]">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#1A1D27]/[0.04] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#1A1D27]/65">
          <Search className="size-3" />
          Missing keywords
        </div>
        <span className="text-[11px] font-mono text-[#1A1D27]/40">6 gaps</span>
      </div>

      <p className="mt-3 text-[12.5px] text-[#1A1D27]/55 leading-relaxed">
        These terms appear in the JD but not in your resume. Adding them lifts your score the most.
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {missingKeywords.map((k) => (
          <span
            key={k.word}
            className="group inline-flex items-center gap-1 rounded-full bg-[#1A1D27] text-white px-2.5 py-1 text-[11.5px] font-medium hover:scale-105 transition-transform cursor-pointer"
          >
            <span className="text-white/55">+</span>
            {k.word}
            {k.impact === "high" && (
              <span className="ml-0.5 size-1 rounded-full bg-amber-400" />
            )}
          </span>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-[#1A1D27]/[0.06] flex items-center justify-between text-[11px]">
        <span className="text-[#1A1D27]/45">
          <span className="inline-block size-1.5 rounded-full bg-amber-400 mr-1.5 align-middle" />
          High impact
        </span>
        <button className="text-[#1A1D27] font-semibold hover:underline underline-offset-2">
          Auto-insert all →
        </button>
      </div>
    </section>
  );
}

function PresentKeywordsCard() {
  return (
    <section className="rounded-3xl bg-[#1A1D27]/[0.025] border border-[#1A1D27]/[0.05] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#1A1D27]/50">
          Already strong on
        </div>
        <span className="text-[11px] font-mono text-[#1A1D27]/40">{presentKeywords.length} matches</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presentKeywords.map((w) => (
          <span
            key={w}
            className="inline-flex items-center gap-1 rounded-full bg-white border border-[#1A1D27]/[0.07] px-2.5 py-1 text-[11.5px] font-medium text-[#1A1D27]/70"
          >
            <Check className="size-3 text-emerald-600" />
            {w}
          </span>
        ))}
      </div>
    </section>
  );
}
