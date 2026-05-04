import { Reveal } from "./Reveal";
import { ShieldCheck, Sparkles, GraduationCap } from "lucide-react";

const items = [
  {
    Icon: GraduationCap,
    title: "Built for students & freshers",
    body: "Designed for first jobs, internships, and early-career switches.",
  },
  {
    Icon: Sparkles,
    title: "AI-generated suggestions",
    body: "Scores and rewrites are produced by AI — review them before you apply.",
  },
  {
    Icon: ShieldCheck,
    title: "Verify before applying",
    body: "We never invent jobs or credentials. Confirm any added metric is true.",
  },
];

export const ProofQuote = ({ embedded = false }: { embedded?: boolean }) => {
  const card = (
    <div className="glass-strong rounded-3xl px-6 py-5 md:px-7 md:py-6 relative h-full flex flex-col">
      <div className="inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 border border-foreground/10 text-[10px] font-medium tracking-[0.16em] uppercase text-foreground/70">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Honest beta
      </div>

      <h3 className="mt-3 font-display text-lg md:text-xl font-semibold text-foreground tracking-tight leading-snug">
        We won't pretend we have testimonials yet.
      </h3>
      <p className="mt-1.5 text-[12.5px] text-foreground/60 leading-relaxed">
        Hirely is in early beta. Here's what that means for you:
      </p>

      <ul className="mt-4 space-y-2.5 flex-1">
        {items.map(({ Icon, title, body }, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <div className="size-7 rounded-lg bg-foreground/[0.06] flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5 text-foreground/75" />
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-foreground tracking-tight leading-tight">
                {title}
              </p>
              <p className="mt-0.5 text-[11.5px] text-foreground/60 leading-snug">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  if (embedded) return card;

  return (
    <section className="px-4 py-6 md:py-8">
      <div className="mx-auto max-w-3xl">
        <Reveal>{card}</Reveal>
      </div>
    </section>
  );
};
