import { Reveal } from "./Reveal";
import { Star } from "lucide-react";

export const ProofQuote = () => {
  return (
    <section className="px-4 pt-2 pb-8">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <figure className="glass-strong rounded-3xl px-7 py-8 md:px-10 md:py-10 text-center relative">
            {/* Stars */}
            <div className="flex items-center justify-center gap-1 mb-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-foreground text-foreground" />
              ))}
            </div>

            <blockquote className="font-display text-xl md:text-2xl leading-snug text-foreground tracking-tight">
              "Got{" "}
              <span className="relative inline-block">
                <span className="relative z-10 font-bold">4 interviews in 10 days</span>
                <span className="absolute bottom-0.5 left-0 w-full h-2.5 bg-[hsl(213_100%_75%/0.55)] -z-0 rounded-full -rotate-1" />
              </span>{" "}
              after fixing my resume with Hirely."
            </blockquote>

            <figcaption className="mt-6 flex items-center justify-center gap-3">
              <div className="size-10 rounded-full bg-foreground text-background flex items-center justify-center font-display font-bold text-sm">
                R
              </div>
              <div className="text-left">
                <p className="font-display font-semibold text-sm text-foreground">Rahul M.</p>
                <p className="text-xs text-foreground/55">Software Engineer · Bengaluru</p>
              </div>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
};
