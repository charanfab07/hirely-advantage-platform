import { Reveal } from "./Reveal";
import { Star } from "lucide-react";

export const ProofQuote = ({ embedded = false }: { embedded?: boolean }) => {
  const card = (
    <figure className="glass-strong rounded-3xl px-6 py-4 md:px-8 md:py-5 text-center relative h-full flex flex-col justify-center">
      {/* Stars */}
      <div className="flex items-center justify-center gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 fill-foreground text-foreground" />
        ))}
      </div>

      <blockquote className="font-display text-base md:text-lg leading-snug text-foreground tracking-tight">
        "Got{" "}
        <span className="relative inline-block">
          <span className="relative z-10 font-bold">4 interviews in 10 days</span>
          <span className="absolute bottom-0.5 left-0 w-full h-2 bg-[hsl(213_100%_75%/0.55)] -z-0 rounded-full -rotate-1" />
        </span>{" "}
        after fixing my resume with Hirely."
      </blockquote>

      <figcaption className="mt-5 flex items-center justify-center gap-3">
        <div className="size-9 rounded-full bg-foreground text-background flex items-center justify-center font-display font-bold text-sm">
          R
        </div>
        <div className="text-left">
          <p className="font-display font-semibold text-sm text-foreground">Rahul M.</p>
          <p className="text-xs text-foreground/55">Software Engineer · Bengaluru</p>
        </div>
      </figcaption>
    </figure>
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
