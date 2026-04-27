import { Reveal } from "./Reveal";

export const SectionHeader = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) => (
  <div className="text-center max-w-3xl mx-auto mb-16">
    <Reveal>
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/50">
        {eyebrow}
      </span>
    </Reveal>
    <Reveal delay={120}>
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mt-4 leading-[1.05]">
        {title}
      </h2>
    </Reveal>
    {description && (
      <Reveal delay={240}>
        <p className="mt-6 text-lg text-foreground/65 leading-relaxed">{description}</p>
      </Reveal>
    )}
  </div>
);
