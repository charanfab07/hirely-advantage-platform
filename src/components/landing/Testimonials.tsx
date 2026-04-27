import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";

const testimonials = [
  {
    quote: "Hirely's ATS simulator caught keywords every recruiter said I was missing. 3 offers in 5 weeks.",
    name: "Maya R.",
    role: "Senior PM · ex-Stripe",
  },
  {
    quote: "The voice coach rewired how I tell stories. I stopped rambling and started landing punchlines.",
    name: "David K.",
    role: "Engineering Manager · Datadog",
  },
  {
    quote: "The Skill Gap Roadmap is the only career tool I've actually opened twice. It just keeps paying off.",
    name: "Priya S.",
    role: "Director of Design · Figma",
  },
];

export const Testimonials = () => {
  return (
    <section className="px-4 py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Loved by candidates"
          title="Built for the top of the market."
        />
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="glass-strong rounded-3xl p-7 h-full flex flex-col">
                <p className="font-display text-lg text-foreground leading-relaxed flex-1">
                  "{t.quote}"
                </p>
                <div className="mt-6 pt-6 border-t border-foreground/10">
                  <p className="font-medium text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-foreground/55 mt-0.5">{t.role}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
