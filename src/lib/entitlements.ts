// Plan / entitlement source of truth — kept in one place so UI and
// (via mirror in supabase/functions/_shared) edge functions agree on limits.
//
// NOTE: the DB enum column `profiles.plan` still uses 'advanced' — the UI
// just renames that tier to "Career Pro" via PLAN_LABEL.

export type AppPlan = "free" | "pro" | "advanced" | "teams";

export type FeatureKey =
  | "resume_uploads"
  | "analyses"
  | "ats_breakdown"           // full ATS deep-dive panels
  | "quick_wins"              // how many quick wins to surface
  | "enhanced_resume"         // Enhanced tab
  | "compare_versions"        // Compare tab + history
  | "tailored_edits"          // Tailored tab
  | "issues_panel"            // Issues tab
  | "cover_letters"           // monthly count
  | "cover_letter_clean"      // clean (un-watermarked) cover letter export
  | "interview_questions"     // monthly count
  | "improved_answer"         // AI-rewritten "improved" interview answers
  | "mock_interviews"         // text-based mock interview sessions / month
  | "voice_mock_interview"    // voice mode (Career Pro only)
  | "resume_export"           // PDF / DOCX / TXT — true means clean (no watermark)
  | "resume_export_watermark" // can export at all, watermarked
  | "application_tracker";    // monthly cap on applications, false = locked

export type Limit = number | "unlimited" | false; // false = feature locked, number = monthly/total cap

export type PlanLimits = Record<FeatureKey, Limit>;

export const PLAN_LIMITS: Record<AppPlan, PlanLimits> = {
  free: {
    resume_uploads: 1,
    analyses: 1,
    ats_breakdown: false,           // limited preview only
    quick_wins: 2,
    enhanced_resume: false,
    compare_versions: false,
    tailored_edits: false,
    issues_panel: false,
    cover_letters: 1,
    cover_letter_clean: false,      // watermarked exports allowed
    interview_questions: 5,
    improved_answer: false,
    mock_interviews: 0,
    voice_mock_interview: false,
    resume_export: false,           // no clean PDF/DOCX
    resume_export_watermark: true as unknown as Limit,  // BUT can export with watermark
    application_tracker: false,
  },
  pro: {
    resume_uploads: 10,
    analyses: 15,
    ats_breakdown: true as unknown as Limit,
    quick_wins: "unlimited",
    enhanced_resume: true as unknown as Limit,
    compare_versions: true as unknown as Limit,
    tailored_edits: true as unknown as Limit,
    issues_panel: true as unknown as Limit,
    cover_letters: 20,
    cover_letter_clean: true as unknown as Limit,
    interview_questions: 30,
    improved_answer: true as unknown as Limit,
    mock_interviews: 5,
    voice_mock_interview: false,
    resume_export: true as unknown as Limit,
    resume_export_watermark: true as unknown as Limit,
    application_tracker: 10,         // limited tracker
  },
  advanced: {
    // Career Pro
    resume_uploads: 50,
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
    improved_answer: true as unknown as Limit,
    mock_interviews: "unlimited",
    voice_mock_interview: true as unknown as Limit,
    resume_export: true as unknown as Limit,
    resume_export_watermark: true as unknown as Limit,
    application_tracker: "unlimited",
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
    improved_answer: true as unknown as Limit,
    mock_interviews: "unlimited",
    voice_mock_interview: true as unknown as Limit,
    resume_export: true as unknown as Limit,
    resume_export_watermark: true as unknown as Limit,
    application_tracker: "unlimited",
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
  advanced: "Career Pro",
  teams: "Teams",
};
