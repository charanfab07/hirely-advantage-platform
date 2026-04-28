import { Sparkles, TrendingUp, Search } from "lucide-react";

const missingKeywords = ["roadmap", "OKRs", "stakeholders", "SQL", "A/B testing", "activation"];

export default function ResumePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Senior PM @ Stripe
        </h1>
      </div>

      {/* Score card */}
      <section className="rounded-2xl bg-card border border-border/50 shadow-sm p-6">
        <div className="flex items-center gap-5">
          <ScoreRing value={94} />
          <div className="flex-1">
            <div className="font-display text-lg font-semibold tracking-tight">
              Market Readiness Score
            </div>
            <div className="mt-1 text-[13px] text-muted-foreground">
              +52 pts since v1 · top 6% of applicants
            </div>
          </div>
          <TrendingUp className="size-5 text-emerald-600" />
        </div>
      </section>

      {/* AI rewrite */}
      <section className="rounded-2xl bg-card border border-border/50 shadow-sm p-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <Sparkles className="size-3" />
          AI Rewrite · Bullet 3
        </div>
        <p className="mt-4 text-[14px] text-muted-foreground line-through decoration-muted-foreground/40">
          Helped improve product onboarding metrics.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground">
          Drove{" "}
          <mark className="rounded bg-violet-100 px-1 text-foreground">38% activation lift</mark>{" "}
          across 6 A/B tests on onboarding, unlocking{" "}
          <mark className="rounded bg-emerald-100 px-1 text-foreground">$1.2M ARR</mark>.
        </p>
      </section>

      {/* Missing keywords */}
      <section className="rounded-2xl bg-card border border-border/50 shadow-sm p-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <Search className="size-3" />
          Missing keywords
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {missingKeywords.map((k) => (
            <span
              key={k}
              className="rounded-full bg-foreground text-background px-3 py-1.5 text-[12px] font-medium"
            >
              +{k}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative size-16 shrink-0">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle cx="32" cy="32" r={r} className="fill-none stroke-muted" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          className="fill-none stroke-foreground"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center font-display text-base font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}
