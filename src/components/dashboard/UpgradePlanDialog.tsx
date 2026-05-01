import { Sparkles, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AppPlan, FeatureKey } from "@/lib/entitlements";

type PlanCard = {
  id: AppPlan;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
};

const PLAN_CARDS: Record<Exclude<AppPlan, "free">, PlanCard> = {
  pro: {
    id: "pro",
    name: "Pro",
    price: "$12",
    cadence: "/month",
    tagline: "Most popular for active job seekers.",
    features: [
      "15 resume analyses / month",
      "20 cover letters / month",
      "Clean PDF + DOCX export",
      "Full ATS resume breakdown",
      "5 mock interviews / month",
    ],
  },
  advanced: {
    id: "advanced",
    name: "Advanced",
    price: "$29",
    cadence: "/month",
    tagline: "For serious, multi-role applicants.",
    features: [
      "Unlimited resume analyses",
      "100 cover letters / month",
      "Full mock interview simulator",
      "Real-time answer feedback",
      "Application tracker",
    ],
  },
  teams: {
    id: "teams",
    name: "Teams",
    price: "$79",
    cadence: "/month",
    tagline: "5 seats — bootcamps, coaches, universities.",
    features: [
      "Everything in Advanced",
      "5 team seats",
      "Admin dashboard",
      "Bulk resume screening",
    ],
  },
};

type FeatureCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

const FEATURE_COPY_BY_PLAN: Record<
  AppPlan,
  Partial<Record<FeatureKey, FeatureCopy>> & { default: FeatureCopy }
> = {
  free: {
    default: {
      eyebrow: "Free plan limit reached",
      title: "You've hit your Free-plan limit.",
      description:
        "Upgrade to keep going — full ATS breakdown, more cover letters, and clean exports.",
    },
    cover_letters: {
      eyebrow: "Free plan limit reached",
      title: "You've used your one free cover letter.",
      description:
        "Upgrade to keep generating tailored, recruiter-ready letters — clean exports, no watermark, plus the full Hirely toolkit.",
    },
    analyses: {
      eyebrow: "Free plan limit reached",
      title: "You've used your free resume analysis.",
      description:
        "Upgrade for the full ATS deep-dive, enhanced resume rewrites, and tailored edits.",
    },
    mock_interviews: {
      eyebrow: "Free plan",
      title: "Mock interviews are a Pro feature.",
      description:
        "Upgrade to unlock 5 mock interviews per month with real-time feedback and scoring.",
    },
  },
  pro: {
    default: {
      eyebrow: "Pro plan limit reached",
      title: "You've reached your monthly Pro limit.",
      description:
        "Upgrade to Advanced for unlimited usage and the full simulator suite.",
    },
    cover_letters: {
      eyebrow: "Pro plan limit reached",
      title: "You've used your 20 cover letters this month.",
      description:
        "Upgrade to Advanced for 100 letters / month, or wait until your Pro quota resets next month.",
    },
    analyses: {
      eyebrow: "Pro plan limit reached",
      title: "You've used your 15 monthly resume analyses.",
      description:
        "Upgrade to Advanced for unlimited analyses, or wait until your Pro quota resets next month.",
    },
    mock_interviews: {
      eyebrow: "Pro plan limit reached",
      title: "You've used your 5 mock interviews this month.",
      description:
        "Upgrade to Advanced for unlimited mock interviews with the full simulator.",
    },
  },
  advanced: {
    default: {
      eyebrow: "Advanced plan",
      title: "You've reached your Advanced limit.",
      description: "Upgrade to Teams for unlimited team usage and admin tools.",
    },
  },
  teams: {
    default: {
      eyebrow: "Teams plan",
      title: "Limit reached on the Teams plan.",
      description: "Contact us to expand your seat count or quotas.",
    },
  },
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** The user's current plan — drives which tier is "current" and which to highlight */
  currentPlan: AppPlan;
  /** Which feature triggered this dialog (for headline copy) */
  feature?: FeatureKey;
};

export const UpgradePlanDialog = ({
  open,
  onOpenChange,
  currentPlan,
  feature,
}: Props) => {
  const copyMap = FEATURE_COPY_BY_PLAN[currentPlan];
  const copy = (feature && copyMap[feature]) || copyMap.default;

  // Decide which 3 cards to show + which to highlight as the "next step"
  // Free → highlight Pro, also show Advanced + Teams
  // Pro  → highlight Advanced, also show Teams (and show Pro as "current")
  // Advanced → highlight Teams (show Advanced as current, plus Pro for context)
  let cardOrder: AppPlan[];
  let highlightId: AppPlan;
  if (currentPlan === "free") {
    cardOrder = ["pro", "advanced", "teams"];
    highlightId = "pro";
  } else if (currentPlan === "pro") {
    cardOrder = ["pro", "advanced", "teams"];
    highlightId = "advanced";
  } else {
    cardOrder = ["pro", "advanced", "teams"];
    highlightId = "teams";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-2xl">
        <DialogHeader className="text-left">
          <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-foreground/[0.06] px-2.5 py-1 text-[10.5px] tracking-[0.18em] uppercase text-foreground/60 font-medium">
            <Sparkles className="w-3 h-3" />
            {copy.eyebrow}
          </div>
          <DialogTitle className="mt-3 text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] leading-tight">
            {copy.title}
          </DialogTitle>
          <DialogDescription className="text-[14px] text-foreground/60 tracking-tight max-w-2xl">
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {cardOrder.map((id) => {
            const plan = PLAN_CARDS[id as Exclude<AppPlan, "free">];
            const isCurrent = id === currentPlan;
            const isHighlight = id === highlightId;
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-2xl border p-5 flex flex-col",
                  isHighlight && !isCurrent
                    ? "border-foreground/25 bg-foreground/[0.04] shadow-[0_10px_40px_-15px_hsl(var(--foreground)/0.18)]"
                    : "border-foreground/10 bg-foreground/[0.02]",
                  isCurrent && "opacity-80",
                )}
              >
                {isHighlight && !isCurrent && (
                  <span className="absolute -top-2.5 left-5 text-[10px] tracking-[0.16em] uppercase font-semibold px-2.5 py-1 rounded-full bg-foreground text-background">
                    Recommended
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-2.5 left-5 text-[10px] tracking-[0.16em] uppercase font-semibold px-2.5 py-1 rounded-full bg-foreground/[0.08] text-foreground/65 border border-foreground/15">
                    Current plan
                  </span>
                )}
                <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                  {plan.name}
                </p>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="text-[28px] font-semibold tracking-[-0.02em] text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-[12px] text-foreground/50">{plan.cadence}</span>
                </div>
                <p className="mt-1 text-[12.5px] text-foreground/60 tracking-tight">
                  {plan.tagline}
                </p>
                <ul className="mt-4 space-y-2 mb-5">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-[12.5px] leading-snug text-foreground/75"
                    >
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-foreground/55" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <button
                    type="button"
                    disabled
                    className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-medium tracking-tight bg-foreground/[0.04] text-foreground/45 cursor-not-allowed"
                  >
                    Current plan
                  </button>
                ) : (
                  <a
                    href="/app/upgrade"
                    className={cn(
                      "mt-auto inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-medium tracking-tight transition-colors",
                      isHighlight
                        ? "bg-foreground text-background hover:opacity-90"
                        : "bg-foreground/[0.06] text-foreground hover:bg-foreground/10",
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Choose {plan.name}
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-foreground/[0.06]">
          <p className="text-[11.5px] text-foreground/45 tracking-tight">
            Cancel anytime · 14-day refund · Secure payment
          </p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-[12px] text-foreground/55 hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradePlanDialog;
