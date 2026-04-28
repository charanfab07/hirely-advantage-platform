import { Reveal } from "./Reveal";
import { Star } from "lucide-react";

export const ProofQuote = () => {
  return (
    <section className="px-4 pt-0 pb-4">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <figure className="glass-strong rounded-2xl px-6 py-4 md:px-8 md:py-5 flex items-center gap-5 md:gap-7 relative">
            {/* Stars */}
            <div className="hidden md:flex flex-col items-center gap-1 shrink-0">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-foreground text-foreground" />
                ))}
              </div>
            </div>

            <blockquote className="font-display text-base md:text-lg leading-snug text-foreground tracking-tight flex-1">
              "Got{" "}
              <span className="relative inline-block">
                <span className="relative z-10 font-bold">4 interviews in 10 days</span>
                <span className="absolute bottom-0.5 left-0 w-full h-2 bg-[hsl(213_100%_75%/0.55)] -z-0 rounded-full -rotate-1" />
              </span>{" "}
              after fixing my resume with Hirely."
            </blockquote>

            <figcaption className="flex items-center gap-3 shrink-0 border-l border-foreground/10 pl-5">
              <div className="size-9 rounded-full bg-foreground text-background flex items-center justify-center font-display font-bold text-sm">
                R
              </div>
              <div className="text-left">
                <p className="font-display font-semibold text-sm text-foreground leading-tight">Rahul M.</p>
                <p className="text-[11px] text-foreground/55 leading-tight">Software Engineer</p>
              </div>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
};
