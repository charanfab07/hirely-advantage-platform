// Plan / entitlement source of truth — kept in one place so UI and
// (via mirror in supabase/functions/_shared) edge functions agree on limits.

export type AppPlan = "free" | "pro" | "advanced" | "teams";

export type FeatureKey =
  | "resume_uploads"
  | "analyses"
  | "ats_breakdown"        // full ATS deep-dive panels
  | "quick_wins"           // how many quick wins to surface
  | "enhanced_resume"      // Enhanced tab
  | "compare_versions"     // Compare tab + history
  | "tailored_edits"       // Tailored tab
  | "issues_panel"         // Issues tab
  | "cover_letters"        // monthly count
  | "cover_letter_clean"   // clean (un-watermarked) export
  | "interview_questions"  // monthly count
  | "mock_interviews"      // monthly count
  | "resume_export";       // PDF / DOCX / TXT export from ResumeEditor

export type Limit = number | "unlimited" | false; // false = feature locked, number = monthly cap

export type PlanLimits = Record<FeatureKey, Limit>;

export const PLAN_LIMITS: Record<AppPlan, PlanLimits> = {
  free: {
    resume_uploads: 1,
    analyses: 1,
    ats_breakdown: false,
    quick_wins: 2,
    enhanced_resume: false,
    compare_versions: false,
    tailored_edits: false,
    issues_panel: false,
    cover_letters: 1,
    cover_letter_clean: false,
    interview_questions: 3,
    mock_interviews: 0,
    resume_export: false,
  },
  pro: {
    resume_uploads: "unlimited",
    analyses: 15,
    ats_breakdown: true as unknown as Limit,
    quick_wins: "unlimited",
    enhanced_resume: true as unknown as Limit,
    compare_versions: true as unknown as Limit,
    tailored_edits: true as unknown as Limit,
    issues_panel: true as unknown as Limit,
    cover_letters: 20,
    cover_letter_clean: true as unknown as Limit,
    interview_questions: "unlimited",
    mock_interviews: 5,
    resume_export: true as unknown as Limit,
  },
  advanced: {
    resume_uploads: "unlimited",
    analyses: "unlimited",
    ats_breakdown: true as unknown as Limit,
    quick_wins: "unlimited",
    enhanced_resume: true as unknown as Limit,
    compare_versions: true as unknown as Limit,
    tailored_edits: true as unknown as Limit,
    issues_panel: true as unknown as Limit,
    cover_letters: 100,
    cover_letter_clean: true as unknown as Limit,
    interview_questions: "unlimited",
    mock_interviews: "unlimited",
    resume_export: true as unknown as Limit,
  },
  teams: {
    resume_uploads: "unlimited",
    analyses: "unlimited",
    ats_breakdown: true as unknown as Limit,
    quick_wins: "unlimited",
    enhanced_resume: true as unknown as Limit,
    compare_versions: true as unknown as Limit,
    tailored_edits: true as unknown as Limit,
    issues_panel: true as unknown as Limit,
    cover_letters: "unlimited",
    cover_letter_clean: true as unknown as Limit,
    interview_questions: "unlimited",
    mock_interviews: "unlimited",
    resume_export: true as unknown as Limit,
  },
};

export type Usage = {
  resume_uploads: number;
  analyses: number;
  cover_letters: number;
  mock_interviews: number;
  interview_questions: number;
};

export const ZERO_USAGE: Usage = {
  resume_uploads: 0,
  analyses: 0,
  cover_letters: 0,
  mock_interviews: 0,
  interview_questions: 0,
};

const COUNTABLE = new Set<FeatureKey>([
  "resume_uploads",
  "analyses",
  "cover_letters",
  "mock_interviews",
  "interview_questions",
]);

export function limitFor(plan: AppPlan, feature: FeatureKey): Limit {
  return PLAN_LIMITS[plan][feature];
}

export function isUnlocked(plan: AppPlan, feature: FeatureKey): boolean {
  const l = limitFor(plan, feature);
  if (l === false) return false;
  if (l === "unlimited") return true;
  if (typeof l === "number") return l > 0;
  // boolean-as-Limit (true)
  return true;
}

export function remaining(
  plan: AppPlan,
  feature: FeatureKey,
  usage: Usage,
): number | "unlimited" | false {
  const l = limitFor(plan, feature);
  if (l === false) return false;
  if (l === "unlimited") return "unlimited";
  if (typeof l !== "number") return "unlimited";
  if (!COUNTABLE.has(feature)) return l > 0 ? "unlimited" : false;
  const used = (usage as Record<string, number>)[feature] ?? 0;
  return Math.max(0, l - used);
}

export function canUse(plan: AppPlan, feature: FeatureKey, usage: Usage): boolean {
  const r = remaining(plan, feature, usage);
  if (r === false) return false;
  if (r === "unlimited") return true;
  return r > 0;
}

export const PLAN_LABEL: Record<AppPlan, string> = {
  free: "Free",
  pro: "Pro",
  advanced: "Advanced",
  teams: "Teams",
};
