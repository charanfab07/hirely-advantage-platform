import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";
import { ArrowRight, Sparkles } from "lucide-react";

const beforeBullets = [
  "Worked on improving onboarding for new users.",
  "Helped the team with product decisions.",
  "Was responsible for various analytics tasks.",
];

const afterBullets = [
  { text: "Drove ", highlight: "38% activation lift", tail: " across 6 A/B tests on onboarding." },
  { text: "Led ", highlight: "$4.2M roadmap", tail: " across 3 squads, shipping 2 quarters early." },
  { text: "Built ", highlight: "SQL dashboards", tail: " adopted by 40+ stakeholders weekly." },
];

const wins = [
  { value: "+52", label: "ATS score" },
  { value: "12", label: "Keywords added" },
  { value: "4×", label: "Callbacks" },
];

export const ResumeCompare = () => {
  return (
    <section className="px-4 py-28 relative">
      <SectionHeader
        eyebrow="Proof, not promises"
        title="The same resume. 47 minutes apart."
        description="Vague duties become quantified impact. Missing keywords get surfaced. The ATS reads you the way a hiring manager wishes recruiters did."
      />

      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="glass-strong rounded-[2rem] p-6 md:p-10 relative">
            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-8 items-stretch">
              {/* BEFORE */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display text-[13px] text-foreground font-bold px-2.5 py-1 rounded-md bg-foreground/10 flex items-center gap-1.5">
                    <span className="text-[14px] leading-none">❌</span> Before <span className="font-medium text-foreground/55">— Weak resume</span>
                  </span>
                  <span className="text-sm font-serif tracking-tight text-foreground/70">42 / 100</span>
                </div>

                <div className="glass rounded-2xl p-6 flex-1 opacity-75">
                  <p className="font-display font-semibold text-foreground/70 text-sm">Senior Product Manager</p>
                  <p className="text-[11px] text-foreground/40 mt-0.5 mb-4">Acme Corp · 2021 – Present</p>

                  <ul className="space-y-3">
                    {beforeBullets.map((b, i) => (
                      <li key={i} className="text-sm text-foreground/55 leading-relaxed flex gap-2.5">
                        <span className="mt-2 w-1 h-1 rounded-full bg-foreground/30 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 h-1 rounded-full bg-foreground/5 overflow-hidden">
                  <div className="h-full bg-foreground/30 rounded-full" style={{ width: "42%" }} />
                </div>
              </div>

              {/* Arrow divider */}
              <div className="hidden md:flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-[var(--shadow-float)]">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
              <div className="md:hidden flex items-center justify-center -my-2">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center rotate-90">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* AFTER */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display text-[13px] text-background font-bold px-2.5 py-1 rounded-md bg-foreground flex items-center gap-1.5">
                    <span className="text-[14px] leading-none">✅</span> After <span className="font-medium text-background/70">— Optimized</span>
                  </span>
                  <span className="text-sm font-serif tracking-tight text-foreground font-semibold">94 / 100</span>
                </div>

                <div className="glass-strong rounded-2xl p-6 flex-1">
                  <p className="font-display font-semibold text-foreground text-sm">Senior Product Manager</p>
                  <p className="text-[11px] text-foreground/55 mt-0.5 mb-4">Acme Corp · 2021 – Present</p>

                  <ul className="space-y-3">
                    {afterBullets.map((b, i) => (
                      <li key={i} className="text-sm text-foreground leading-relaxed flex gap-2.5">
                        <span className="mt-2 w-1 h-1 rounded-full bg-foreground shrink-0" />
                        <span>
                          {b.text}
                          <span className="font-semibold text-foreground border-b border-foreground/40">
                            {b.highlight}
                          </span>
                          {b.tail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 h-1 rounded-full bg-foreground/5 overflow-hidden">
                  <div className="h-full bg-foreground rounded-full" style={{ width: "94%" }} />
                </div>
              </div>
            </div>

            {/* Win stats */}
            <Reveal delay={200}>
              <div className="mt-10 pt-8 border-t border-foreground/10 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                {wins.map((w) => (
                  <div key={w.label} className="text-center">
                    <p className="font-display text-3xl md:text-4xl font-semibold text-foreground tracking-tight">{w.value}</p>
                    <p className="text-xs text-foreground/55 mt-1.5">{w.label}</p>
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
