import { cn } from "@/lib/utils";

export type SegmentedTab = {
  value: string;
  label: string;
  count?: number;
};

interface SegmentedTabsProps {
  tabs: SegmentedTab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * iOS-style segmented control. Inactive track sits on a faint black wash;
 * the active pill is a solid white card with a subtle 1px shadow.
 */
export const SegmentedTabs = ({ tabs, value, onChange, className }: SegmentedTabsProps) => (
  <div
    className={cn(
      "inline-flex p-[3px] rounded-xl bg-foreground/[0.05] border border-foreground/[0.04]",
      className,
    )}
    role="tablist"
  >
    {tabs.map((tab) => {
      const active = tab.value === value;
      return (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(tab.value)}
          className={cn(
            "px-4 py-1.5 rounded-[9px] text-[12.5px] tracking-tight transition-colors",
            active
              ? "bg-card text-foreground font-medium shadow-[0_1px_2px_hsl(var(--slate-ink)/0.08)]"
              : "text-foreground/55 hover:text-foreground/80",
          )}
        >
          {tab.label}
          {typeof tab.count === "number" && (
            <span
              className={cn(
                "ml-1.5 text-[10px] px-1.5 py-[1px] rounded-full",
                active ? "bg-foreground/[0.06] text-foreground/55" : "bg-foreground/[0.05] text-foreground/45",
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
