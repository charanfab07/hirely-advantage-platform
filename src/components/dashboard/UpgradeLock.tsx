import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { SectionCard } from "./SectionCard";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  ctaLabel?: string;
  to?: string;
  className?: string;
  variant?: "card" | "inline";
};

export const UpgradeLock = ({
  title,
  description,
  ctaLabel = "See plans",
  to = "/app/upgrade",
  className,
  variant = "card",
}: Props) => {
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 flex items-start gap-3",
          className,
        )}
      >
        <span className="w-8 h-8 rounded-xl bg-foreground/[0.06] flex items-center justify-center shrink-0">
          <Lock className="w-3.5 h-3.5 text-foreground/55" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium tracking-tight text-foreground">{title}</p>
          <p className="mt-0.5 text-[12px] text-foreground/55 leading-snug">{description}</p>
        </div>
        <Link
          to={to}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-[11.5px] font-medium hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-3 h-3" />
          {ctaLabel}
        </Link>
      </div>
    );
  }
  return (
    <SectionCard className={cn("relative overflow-hidden", className)}>
      <div className="flex items-start gap-4">
        <span className="w-10 h-10 rounded-2xl bg-foreground/[0.06] flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-foreground/60" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
            Unlock with Pro
          </p>
          <p className="mt-1 text-[18px] font-medium tracking-tight text-foreground">{title}</p>
          <p className="mt-2 text-[13px] text-foreground/65 leading-snug max-w-xl">
            {description}
          </p>
          <Link
            to={to}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-[12.5px] font-medium hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {ctaLabel}
          </Link>
        </div>
      </div>
    </SectionCard>
  );
};
