import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";
import { Check, X, Sparkles } from "lucide-react";

const beforeBullets = [
  "Worked on improving onboarding for new users.",
  "Helped the team with product decisions.",
  "Was responsible for various analytics tasks.",
  "Collaborated with engineering on features.",
];

const afterBullets = [
  { text: "Drove ", highlight: "38% activation lift", tail: " across 6 A/B tests on onboarding." },
  { text: "Led ", highlight: "$4.2M roadmap", tail: " across 3 squads, shipping 2 quarters early." },
  { text: "Built ", highlight: "SQL dashboards", tail: " adopted by 40+ stakeholders weekly." },
  { text: "Partnered with eng to ship ", highlight: "12 OKR-aligned features", tail: " in H1." },
];

const wins = [
  { value: "+52", label: "ATS score points" },
  { value: "12", label: "Keywords added" },
  { value: "4×", label: "Callback rate" },
];

export const ResumeCompare = () => {
  return (
    <section className="px-4 py-28 relative">
      <SectionHeader
        eyebrow="Proof, not promises"
        title="The same resume. 47 minutes apart."
        description="Every bullet rewritten with quantified impact. Every missing keyword surfaced. The ATS reads you the way a hiring manager wishes recruiters did."
      />

      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="glass-strong rounded-[2rem] p-6 md:p-10 relative overflow-hidden">
            {/* Aurora wash on the After side */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-50 pointer-events-none -z-0">
              <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-[hsl(var(--soft-lilac))] blur-3xl" />
              <div className="absolute bottom-10 right-20 w-72 h-72 rounded-full bg-[hsl(var(--ethereal-blue))] blur-3xl" />
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-10 relative">
              {/* BEFORE */}
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs uppercase tracking-[0.18em] text-foreground/50 font-medium">Before</span>
                  </div>
                  <div className="glass rounded-full px-3 py-1 text-xs text-foreground/70 flex items-center gap-1.5">
                    <X className="w-3 h-3 text-red-500" />
                    ATS Score: 42 / 100
                  </div>
                </div>

                <div className="glass rounded-2xl p-6 space-y-4 grayscale-[35%] opacity-90">
                  <div>
                    <p className="font-display font-semibold text-foreground/80">Senior Product Manager</p>
                    <p className="text-xs text-foreground/45 mt-0.5">Acme Corp · 2021 – Present</p>
                  </div>
                  <ul className="space-y-2.5">
                    {beforeBullets.map((b, i) => (
                      <li key={i} className="text-sm text-foreground/55 leading-relaxed flex gap-2">
                        <span className="text-foreground/30 mt-1.5 w-1 h-1 rounded-full bg-foreground/30 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-3 border-t border-foreground/10 flex flex-wrap gap-1.5">
                    {["managed", "responsible", "helped"].map((k) => (
                      <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-700 line-through">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* AFTER */}
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs uppercase tracking-[0.18em] text-foreground/70 font-medium">After Hirely</span>
                  </div>
                  <div className="glass-strong rounded-full px-3 py-1 text-xs text-foreground flex items-center gap-1.5 font-medium">
                    <Check className="w-3 h-3 text-emerald-600" />
                    ATS Score: 94 / 100
                  </div>
                </div>

                <div className="glass-strong rounded-2xl p-6 space-y-4 shadow-[var(--shadow-float)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display font-semibold text-foreground">Senior Product Manager</p>
                      <p className="text-xs text-foreground/55 mt-0.5">Acme Corp · 2021 – Present</p>
                    </div>
                    <Sparkles className="w-4 h-4 text-foreground/60" />
                  </div>
                  <ul className="space-y-2.5">
                    {afterBullets.map((b, i) => (
                      <li key={i} className="text-sm text-foreground leading-relaxed flex gap-2">
                        <span className="mt-2 w-1 h-1 rounded-full bg-foreground shrink-0" />
                        <span>
                          {b.text}
                          <mark className="bg-[hsl(var(--soft-lilac))] text-foreground rounded px-1 font-medium">
                            {b.highlight}
                          </mark>
                          {b.tail}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-3 border-t border-foreground/10 flex flex-wrap gap-1.5">
                    {["+roadmap", "+OKRs", "+stakeholders", "+SQL", "+A/B testing"].map((k) => (
                      <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-foreground text-background font-medium">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Win chips */}
            <Reveal delay={200}>
              <div className="mt-8 grid grid-cols-3 gap-3 md:gap-4 max-w-2xl mx-auto">
                {wins.map((w) => (
                  <div key={w.label} className="glass rounded-2xl py-4 px-3 text-center">
                    <p className="font-display text-2xl md:text-3xl font-semibold text-foreground">{w.value}</p>
                    <p className="text-[11px] text-foreground/55 mt-1 leading-tight">{w.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
