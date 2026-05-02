import { Link } from "react-router-dom";
import { Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PLAN_LABEL, type FeatureKey } from "@/lib/entitlements";

type Props = {
  feature: FeatureKey;
  label: string; // e.g. "Analyses", "Cover letters"
  className?: string;
};

/**
 * Compact pill that tells the user how many of the current plan's monthly
 * quota for `feature` they have left. Hidden when the plan grants unlimited
 * usage of the feature. On Free, includes a quick "Upgrade" affordance.
 */
export function UsageMeter({ feature, label, className }: Props) {
  const ent = useEntitlements();
  if (ent.loading) return null;

  const limit = ent.limit(feature);
  const remaining = ent.remaining(feature);

  // Unlimited / true → don't show a counter at all.
  if (limit === "unlimited" || remaining === "unlimited") return null;

  // Locked feature on this plan.
  if (limit === false || remaining === false) {
    return (
      <Link
        to="/app/upgrade"
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-foreground/[0.08] bg-foreground/[0.04] text-[11px] tracking-tight text-foreground/70 hover:bg-foreground/[0.07] transition-colors",
          className,
        )}
        title={`${label} not included on ${PLAN_LABEL[ent.plan]} — upgrade to unlock`}
      >
        <Lock className="w-3 h-3" />
        <span className="font-medium">{label}</span>
        <span className="text-foreground/45">locked</span>
      </Link>
    );
  }

  if (typeof limit !== "number" || typeof remaining !== "number") return null;

  const used = Math.max(0, limit - remaining);
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const empty = remaining === 0;
  const low = remaining > 0 && remaining <= Math.max(1, Math.ceil(limit * 0.2));

  // Tone tokens — neutral by default, amber when low, rose when empty.
  const tone = empty
    ? "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300"
    : low
      ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-foreground/[0.08] bg-foreground/[0.04] text-foreground/75";

  const barTone = empty
    ? "bg-rose-500/70"
    : low
      ? "bg-amber-500/70"
      : "bg-foreground/55";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] tracking-tight transition-colors",
        tone,
        className,
      )}
      title={`${used} of ${limit} ${label.toLowerCase()} used on the ${PLAN_LABEL[ent.plan]} plan this month`}
    >
      <span className="font-medium">{label}</span>
      <span className="tabular-nums">
        <span className="font-semibold">{remaining}</span>
        <span className="opacity-60"> / {limit} left</span>
      </span>
      <span className="hidden sm:block w-12 h-1 rounded-full bg-foreground/[0.08] overflow-hidden">
        <span
          className={cn("block h-full rounded-full transition-[width]", barTone)}
          style={{ width: `${pct}%` }}
        />
      </span>
      {empty && (
        <Link
          to="/app/upgrade"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground text-background text-[10.5px] font-medium hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-2.5 h-2.5" />
          Upgrade
        </Link>
      )}
    </div>
  );
}

export default UsageMeter;
