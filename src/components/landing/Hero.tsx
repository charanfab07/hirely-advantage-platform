import { ArrowRight } from "lucide-react";
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
          <div className="mt-10 flex items-center justify-center">
            <a
              href="#cta"
              className="group inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-all hover:scale-[1.02]"
            >
              Start Free Analysis
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
