import { cn } from "@/lib/utils";

export type Stat = {
  label: string;
  value: string | number;
  highlight?: boolean;
};

interface StatStripProps {
  stats: Stat[];
  className?: string;
}

/**
 * 4-up divided stat row inside a faint glass shell.
 * `highlight` swaps that column to the violet accent.
 */
export const StatStrip = ({ stats, className }: StatStripProps) => (
  <div
    className={cn(
      "rounded-[22px] p-2 bg-card/40 backdrop-blur-xl border border-white/70",
      className,
    )}
  >
    <div className="grid divide-x divide-foreground/[0.06]" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
      {stats.map((s) => (
        <div key={s.label} className="px-5 py-3">
          <p
            className={cn(
              "text-[10.5px] tracking-[0.16em] uppercase font-medium",
              s.highlight ? "text-[hsl(258_38%_52%)]" : "text-foreground/45",
            )}
          >
            {s.label}
          </p>
          <p
            className={cn(
              "text-[24px] font-semibold tracking-[-0.025em] mt-0.5",
              s.highlight ? "text-[hsl(258_38%_52%)]" : "text-foreground",
            )}
          >
            {s.value}
          </p>
        </div>
      ))}
    </div>
  </div>
);
