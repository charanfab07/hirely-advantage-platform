import { SectionCard } from "@/components/dashboard/SectionCard";

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
}

const PlaceholderPage = ({ eyebrow, title, description }: PlaceholderPageProps) => (
  <div className="max-w-6xl mx-auto">
    <p className="text-[10.5px] tracking-[0.22em] uppercase text-foreground/40 font-medium">
      {eyebrow}
    </p>
    <h1 className="mt-2 text-[36px] sm:text-[44px] leading-[1.04] font-semibold tracking-[-0.035em] text-foreground">
      {title}
    </h1>
    <SectionCard className="mt-7">
      <p className="text-[13.5px] text-foreground/65 leading-relaxed">{description}</p>
    </SectionCard>
  </div>
);

export default PlaceholderPage;
