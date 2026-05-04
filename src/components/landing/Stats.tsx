import { FileSearch, KeyRound, MessageSquare, Wand2 } from "lucide-react";

const tiles = [
  { Icon: FileSearch, title: "ATS score", desc: "Instant 0–100 readiness check" },
  { Icon: KeyRound, title: "Keyword gaps", desc: "Find what recruiters scan for" },
  { Icon: Wand2, title: "AI rewrites", desc: "Stronger bullets in seconds" },
  { Icon: MessageSquare, title: "Interview prep", desc: "Role-tailored questions" },
];

export const Stats = ({ embedded = false }: { embedded?: boolean }) => {
  const inner = (
    <div className="glass-strong rounded-[2rem] px-6 md:px-8 py-5 md:py-6 relative overflow-hidden h-full">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[60%] h-40 rounded-full bg-white/40 blur-3xl pointer-events-none" />

      <p className="relative text-[10.5px] tracking-[0.18em] uppercase text-foreground/55 font-medium text-center md:text-left">
        What you get
      </p>

      <div className="relative mt-4 grid grid-cols-2 gap-4">
        {tiles.map(({ Icon, title, desc }, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-2xl bg-white/55 border border-white/70 px-3.5 py-3"
          >
            <div className="size-9 rounded-xl bg-foreground/[0.06] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-foreground/75" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground tracking-tight leading-tight">
                {title}
              </p>
              <p className="mt-0.5 text-[11.5px] text-foreground/60 leading-snug">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (embedded) return inner;

  return (
    <section className="px-4 -mt-8 md:-mt-16 pb-20 relative z-10">
      <div className="mx-auto max-w-6xl relative">
        <div className="absolute -inset-x-10 -inset-y-6 -z-10 opacity-60 blur-3xl pointer-events-none">
          <div className="absolute left-[5%] top-0 w-[40%] h-full rounded-full bg-[hsl(var(--ethereal-blue))]" />
          <div className="absolute right-[10%] top-0 w-[35%] h-full rounded-full bg-[hsl(var(--soft-lilac))]" />
          <div className="absolute left-[40%] top-0 w-[30%] h-full rounded-full bg-[hsl(var(--warm-blush))]" />
        </div>
        {inner}
      </div>
    </section>
  );
};
