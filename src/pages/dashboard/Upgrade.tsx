import { Pricing } from "@/components/landing/Pricing";
import { Reveal } from "@/components/landing/Reveal";

const Upgrade = () => {
  return (
    <div className="max-w-7xl mx-auto pb-20">
      <Reveal>
        <div className="mb-10">
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-foreground/45">
            Upgrade
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-foreground mt-3 leading-[1.05]">
            Unlock the full Hirely suite.
          </h1>
          <p className="mt-4 text-[15px] text-foreground/60 max-w-2xl leading-relaxed">
            Faster rewrites, deeper ATS scoring, unlimited mock interviews — pick the plan that
            matches how seriously you're job hunting.
          </p>
        </div>
      </Reveal>

      <Pricing variant="dashboard" showHeader={false} />
    </div>
  );
};

export default Upgrade;
