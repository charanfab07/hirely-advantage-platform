import { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

interface FeatureBlockProps {
  index: number;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  visual: ReactNode;
  reverse?: boolean;
}

export const FeatureBlock = ({
  index,
  eyebrow,
  title,
  description,
  bullets,
  visual,
  reverse,
}: FeatureBlockProps) => {
  return (
    <div className="px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <Reveal className={cn("order-2", reverse ? "md:order-2" : "md:order-1")}>
          <div className="flex items-center gap-3 mb-5">
            <span className="font-display text-sm text-foreground/50">0{index}</span>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/50">
              {eyebrow}
            </span>
          </div>
          <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground leading-[1.08]">
            {title}
          </h3>
          <p className="mt-5 text-lg text-foreground/65 leading-relaxed">{description}</p>
          <ul className="mt-8 space-y-3">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-foreground/80">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
                <span className="text-[15px] leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={180} className={cn("order-1", reverse ? "md:order-1" : "md:order-2")}>
          {visual}
        </Reveal>
      </div>
    </div>
  );
};
