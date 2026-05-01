import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";

const steps = [
  { n: "01", title: "Upload", desc: "Drop your resume and the role you want." },
  { n: "02", title: "Analyze", desc: "AI simulates the ATS and benchmarks against the market." },
  { n: "03", title: "Optimize", desc: "Rewrite bullets, draft outreach, rehearse interviews." },
  { n: "04", title: "Land", desc: "Walk into offers — then plan the next promotion." },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="px-4 pt-0 pb-4 md:pb-5">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-[10px] font-medium uppercase tracking-[0.22em] text-foreground/50 mb-2">
          How it works
        </p>
        <div className="relative grid grid-cols-4 gap-3 md:gap-6">
          <div className="hidden md:block absolute top-6 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-foreground/25 to-transparent" />
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="relative flex flex-col items-center text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 glass-strong rounded-full flex items-center justify-center mb-1.5">
                  <span className="font-display text-xs md:text-sm font-semibold text-foreground">{s.n}</span>
                </div>
                <h4 className="font-display text-xs font-semibold text-foreground">{s.title}</h4>
                <p className="mt-0.5 text-[9px] md:text-[10px] text-foreground/60 leading-tight max-w-[140px]">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
