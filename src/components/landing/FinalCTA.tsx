import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

export const FinalCTA = () => {
  return (
    <section id="cta" className="px-4 py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="glass-strong rounded-[2rem] p-10 md:p-16 text-center relative overflow-hidden">
            <h2 className="font-display text-4xl md:text-6xl font-semibold text-foreground leading-[1.05]">
              Get a clearer picture of your <span className="text-gradient">resume in minutes.</span>
            </h2>
            <p className="mt-6 text-lg text-foreground/65 max-w-xl mx-auto">
              Upload your resume, pick a target role, and see your AI-generated ATS score,
              missing keywords, and rewrite suggestions. Free to try — no credit card.
            </p>

            <form
              className="mt-10 flex flex-col sm:flex-row items-stretch gap-3 max-w-md mx-auto"
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = "/app";
              }}
            >
              <input
                type="email"
                placeholder="you@work.com"
                className="flex-1 glass rounded-full px-5 py-3.5 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-foreground/20"
              />
              <button
                type="submit"
                className="group inline-flex items-center justify-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-all"
              >
                Get my score
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            <p className="mt-6 text-xs text-foreground/45">
              Free forever for analysis · Premium plans from $19/mo
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
