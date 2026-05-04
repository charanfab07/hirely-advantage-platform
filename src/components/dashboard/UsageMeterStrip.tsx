import { UsageMeter } from "./UsageMeter";
import { cn } from "@/lib/utils";

/**
 * Compact strip of the three primary monthly usage meters. Mounted once in
 * the dashboard shell so users see remaining quota on every tool page.
 * Each <UsageMeter> hides itself on plans where the feature is unlimited,
 * so on Advanced/Teams this strip renders nothing.
 */
export function UsageMeterStrip({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <UsageMeter feature="analyses" label="Analyses" />
      <UsageMeter feature="cover_letters" label="Cover letters" />
      <UsageMeter feature="mock_interviews" label="Mock interviews" />
    </div>
  );
}

export default UsageMeterStrip;
