import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Reveal } from "./Reveal";

export const Hero = () => {
  return (
    <section className="relative pt-40 pb-24 px-4">
      <div className="mx-auto max-w-6xl text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 glass-subtle rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-foreground/70" />
            <span className="text-xs font-medium text-foreground/80 tracking-wide">
              AI-Powered Career Acceleration
            </span>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-semibold leading-[1.02] text-foreground">
            Reverse-engineer
            <br />
            <span className="text-gradient">the hiring process.</span>
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

        {/* Floating preview card */}
        <Reveal delay={520}>
          <div className="mt-20 relative max-w-4xl mx-auto animate-float-y">
            <div className="glass-strong rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-1.5 mb-6">
                <div className="w-3 h-3 rounded-full bg-foreground/10" />
                <div className="w-3 h-3 rounded-full bg-foreground/10" />
                <div className="w-3 h-3 rounded-full bg-foreground/10" />
                <span className="ml-3 text-xs text-foreground/50 font-mono">hirely.ai/analyze</span>
              </div>

              <div className="grid md:grid-cols-3 gap-6 text-left">
                {/* Score gauge */}
                <div className="md:col-span-1 glass rounded-2xl p-6 flex flex-col items-center">
                  <p className="text-xs text-foreground/60 mb-2">Market Readiness</p>
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--foreground) / 0.08)" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke="hsl(var(--foreground))"
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42 * 0.87} ${2 * Math.PI * 42}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-3xl font-semibold">87</span>
                      <span className="text-[10px] text-foreground/50 uppercase tracking-wider">Score</span>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/60 mt-3">vs. Senior PM @ Stripe</p>
                </div>

                {/* Insights */}
                <div className="md:col-span-2 space-y-3">
                  <div className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-foreground/50">Impact Rewrite</span>
                    </div>
                    <p className="text-xs text-foreground/50 line-through mb-1">Responsible for managing team projects.</p>
                    <p className="text-sm text-foreground font-medium">Led 12-engineer squad to ship 4 revenue products, driving $2.3M ARR in 6 months.</p>
                  </div>
                  <div className="glass rounded-2xl p-4">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-foreground/50">Missing Keywords</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {["GTM strategy", "OKRs", "A/B testing", "SQL"].map((k) => (
                        <span key={k} className="text-xs px-2.5 py-1 rounded-full bg-foreground/5 text-foreground/80">
                          {k}
                        </span>
                      ))}
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
