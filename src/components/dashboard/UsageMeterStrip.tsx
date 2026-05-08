import { useLocation } from "react-router-dom";
import { UsageMeter } from "./UsageMeter";
import { cn } from "@/lib/utils";
import type { FeatureKey } from "@/lib/entitlements";

/**
 * Compact strip showing the monthly usage meter for the feature the user is
 * currently looking at. Mounted once in the dashboard shell. Each
 * <UsageMeter> hides itself on plans where the feature is unlimited, so on
 * Career Pro/Teams this strip renders nothing.
 */
const ROUTE_TO_FEATURE: Array<{
  match: (p: string) => boolean;
  feature: FeatureKey;
  label: string;
}> = [
  { match: (p) => p.includes("/app/resume"), feature: "analyses", label: "Analyses" },
  { match: (p) => p.includes("/app/compare"), feature: "analyses", label: "Analyses" },
  { match: (p) => p.includes("/app/ats-optimizer"), feature: "analyses", label: "Analyses" },
  { match: (p) => p.includes("/app/resume-builder"), feature: "analyses", label: "Analyses" },
  { match: (p) => p.includes("/app/cover-letter"), feature: "cover_letters", label: "Cover letters" },
  { match: (p) => p.includes("/app/interview-prep"), feature: "mock_interviews", label: "Mock interviews" },
];

export function UsageMeterStrip({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const entry = ROUTE_TO_FEATURE.find((r) => r.match(pathname));
  if (!entry) return null;
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <UsageMeter feature={entry.feature} label={entry.label} />
    </div>
  );
}

export default UsageMeterStrip;
