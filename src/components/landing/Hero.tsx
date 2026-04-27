import { ArrowRight, Play, Check, TrendingUp, Zap, Target, Sparkles } from "lucide-react";
import { Reveal } from "./Reveal";

export const Hero = () => {
  return (
    <section className="relative pt-40 pb-24 px-4">
      <div className="mx-auto max-w-6xl text-center">
        <Reveal delay={120}>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-semibold leading-[1.02] text-foreground">
            From Ignored to
            <br />
            <span className="text-gradient">Interviewed — In Minutes</span>
          </h1>
        </Reveal>

        <Reveal delay={240}>
          <p className="mt-8 max-w-2xl mx-auto text-lg md:text-xl text-foreground/65 leading-relaxed">
            Hirely AI transforms standard job seekers into top-tier candidates — aligning your
            qualifications with live market data, dynamic resume architecture, and immersive
            interview simulations.
          </p>
        </Reveal>

        <Reveal delay={360}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#cta"
              className="group inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-all hover:scale-[1.02]"
            >
              Start Free Analysis
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 glass rounded-full px-7 py-3.5 text-sm font-medium text-foreground hover:bg-white/70 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-foreground" />
              Watch Demo
            </a>
          </div>
        </Reveal>

        {/* Floating preview — premium cockpit */}
        <Reveal delay={520}>
          <div className="mt-24 relative max-w-5xl mx-auto">
            {/* Ambient glow behind card */}
            <div className="absolute -inset-10 -z-10 opacity-70 blur-3xl pointer-events-none">
              <div className="absolute left-[10%] top-0 w-[40%] h-[60%] rounded-full bg-[hsl(var(--ethereal-blue))]" />
              <div className="absolute right-[5%] top-[20%] w-[45%] h-[55%] rounded-full bg-[hsl(var(--soft-lilac))]" />
              <div className="absolute left-[30%] bottom-0 w-[40%] h-[50%] rounded-full bg-[hsl(var(--warm-blush))]" />
            </div>

            {/* Floating side badges */}
            <div className="hidden md:flex absolute -left-6 top-24 z-20 glass rounded-2xl px-3.5 py-2.5 items-center gap-2 animate-float-y" style={{ animationDelay: "0.4s" }}>
              <div className="w-7 h-7 rounded-full bg-foreground text-background grid place-items-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <div className="text-[10px] uppercase tracking-wider text-foreground/50">Salary uplift</div>
                <div className="text-sm font-semibold">+$42K / yr</div>
              </div>
            </div>
            <div className="hidden md:flex absolute -right-4 top-44 z-20 glass rounded-2xl px-3.5 py-2.5 items-center gap-2 animate-float-y" style={{ animationDelay: "1.1s" }}>
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-700 grid place-items-center">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <div className="text-[10px] uppercase tracking-wider text-foreground/50">ATS pass rate</div>
                <div className="text-sm font-semibold">98.4%</div>
              </div>
            </div>

            <div className="glass-strong rounded-[2rem] p-5 md:p-7 animate-float-y relative overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 mb-6">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]/70" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]/70" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]/70" />
                <div className="ml-4 flex-1 flex items-center gap-2 glass-subtle rounded-full px-3 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-foreground/60 font-mono">hirely.ai / analyze · live scan</span>
                </div>
                <span className="hidden sm:inline-flex text-[10px] uppercase tracking-wider text-foreground/40 font-medium">v4.2</span>
              </div>

              <div className="grid md:grid-cols-12 gap-4 text-left">
                {/* LEFT — Score gauge */}
                <div className="md:col-span-4 relative rounded-2xl p-5 overflow-hidden bg-gradient-to-br from-foreground to-[hsl(250_25%_22%)] text-background">
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-background/60">Market Readiness</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-medium">+12 today</span>
                    </div>
                    <div className="relative w-36 h-36 mx-auto">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="gaugeStroke" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#A5B4FC" />
                            <stop offset="100%" stopColor="#F0ABFC" />
                          </linearGradient>
                        </defs>
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
                        <circle
                          cx="50" cy="50" r="42" fill="none"
                          stroke="url(#gaugeStroke)"
                          strokeWidth="7" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 42 * 0.87} ${2 * Math.PI * 42}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-display text-4xl font-semibold tracking-tight">87</span>
                        <span className="text-[9px] text-background/60 uppercase tracking-[0.2em] mt-0.5">/ 100</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-background/60">Benchmark</span>
                        <span className="font-medium">Sr PM · Stripe</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1.5">
                        <span className="text-background/60">Top percentile</span>
                        <span className="font-medium text-emerald-300">Top 6%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT — Insight stack */}
                <div className="md:col-span-8 space-y-3">
                  {/* Impact rewrite */}
                  <div className="glass rounded-2xl p-4 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-foreground/60" />
                        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-foreground/50">AI Impact Rewrite</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/5 text-foreground/60 font-medium">recruiter-tested</span>
                    </div>
                    <p className="text-xs text-foreground/40 line-through mb-1.5">Responsible for managing team projects.</p>
                    <p className="text-sm text-foreground font-medium leading-snug">
                      Led 12-engineer squad to ship 4 revenue products, driving{" "}
                      <span className="bg-gradient-to-r from-emerald-200/70 to-emerald-100/40 px-1 rounded">$2.3M ARR in 6 months</span>.
                    </p>
                  </div>

                  {/* Two-up: keywords + skill match */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass rounded-2xl p-4">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Target className="w-3 h-3 text-foreground/60" />
                        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-foreground/50">Add to land</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { k: "GTM strategy", hot: true },
                          { k: "OKRs", hot: false },
                          { k: "A/B testing", hot: true },
                          { k: "SQL", hot: false },
                        ].map(({ k, hot }) => (
                          <span key={k} className={`text-[11px] px-2 py-1 rounded-full font-medium ${hot ? "bg-foreground text-background" : "bg-foreground/5 text-foreground/75"}`}>
                            {hot && "+ "}{k}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="glass rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-foreground/50">Skill match</span>
                        <span className="text-[10px] font-semibold text-foreground">87 / 92</span>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { l: "Product strategy", v: 94 },
                          { l: "Data fluency", v: 78 },
                          { l: "Stakeholder mgmt", v: 88 },
                        ].map(({ l, v }) => (
                          <div key={l}>
                            <div className="flex items-center justify-between text-[10px] text-foreground/60 mb-0.5">
                              <span>{l}</span>
                              <span className="tabular-nums">{v}</span>
                            </div>
                            <div className="h-1 rounded-full bg-foreground/5 overflow-hidden">
                              <div className="h-full rounded-full bg-foreground/80" style={{ width: `${v}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live activity strip */}
                  <div className="glass rounded-2xl p-3 flex items-center gap-3">
                    <div className="flex -space-x-1.5">
                      {["bg-rose-300", "bg-amber-300", "bg-sky-300"].map((c, i) => (
                        <div key={i} className={`w-6 h-6 rounded-full ${c} ring-2 ring-white`} />
                      ))}
                    </div>
                    <div className="flex-1 text-xs text-foreground/65">
                      <span className="font-medium text-foreground">3 interview invites</span> matched to your profile this week
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-500/10 px-2 py-1 rounded-full">
                      <Check className="w-3 h-3" /> READY
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={680}>
          <p className="mt-12 text-xs uppercase tracking-[0.2em] text-foreground/45">
            Trained on 1M+ job descriptions · Trusted by candidates at FAANG, McKinsey & YC startups
          </p>
        </Reveal>
      </div>
    </section>
  );
};
