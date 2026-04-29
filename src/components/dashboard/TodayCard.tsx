import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionCard } from "./SectionCard";

type Task = {
  id: string;
  label: string;
  duration: string;
  done?: boolean;
};

const DEFAULT_TASKS: Task[] = [
  { id: "1", label: "Polish Linear cover letter", duration: "12 min", done: false },
  { id: "2", label: "Confirm Wed 2:30 with Karri", duration: "2 min", done: true },
  { id: "3", label: "Run STAR drill · leadership", duration: "15 min", done: false },
];

interface TodayCardProps {
  tasks?: Task[];
  className?: string;
}

/**
 * Compact "today" surface designed to sit as the third hero column.
 * Shows pending count, a focus task, and a 3-row checklist preview.
 */
export const TodayCard = ({ tasks = DEFAULT_TASKS, className }: TodayCardProps) => {
  const pending = tasks.filter((t) => !t.done);
  const focus = pending[0];
  const total = tasks.length;
  const done = total - pending.length;

  return (
    <SectionCard className={cn("flex flex-col p-5", className)}>
      <div className="flex items-baseline justify-between">
        <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
          Today
        </p>
        <span className="text-[10.5px] text-foreground/40 tabular-nums">
          {done}/{total}
        </span>
      </div>

      <p className="mt-2 text-[28px] leading-none font-semibold tracking-[-0.035em] text-foreground tabular-nums">
        {pending.length}
        <span className="text-[12.5px] text-foreground/40 ml-1.5 tracking-tight font-medium">
          {pending.length === 1 ? "task due" : "tasks due"}
        </span>
      </p>

      {focus && (
        <div className="mt-3 rounded-xl bg-card/70 border border-white/70 px-3 py-2.5">
          <p className="text-[12.5px] font-medium text-foreground leading-snug tracking-tight">
            {focus.label}
          </p>
          <p className="text-[10.5px] text-foreground/50 mt-0.5">{focus.duration}</p>
        </div>
      )}

      <ul className="mt-3 space-y-1.5">
        {tasks.slice(0, 3).map((t) => (
          <li key={t.id} className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                t.done
                  ? "bg-[hsl(258_38%_52%)] text-white"
                  : "border border-foreground/25",
              )}
            >
              {t.done && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
            </span>
            <span
              className={cn(
                "text-[11.5px] leading-tight tracking-tight truncate",
                t.done ? "text-foreground/35 line-through" : "text-foreground/70",
              )}
            >
              {t.label}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-auto pt-3 text-[11.5px] font-medium text-[hsl(258_38%_52%)] tracking-tight self-start hover:opacity-80 transition-opacity"
      >
        View all →
      </button>
    </SectionCard>
  );
};
