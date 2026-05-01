// Shared by edge functions. Mirrors src/lib/entitlements.ts. Keep in sync.
// Deno runtime — uses ESM-compatible imports from supabase-js.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type AppPlan = "free" | "pro" | "advanced" | "teams";

export type FeatureKey =
  | "resume_uploads"
  | "analyses"
  | "ats_breakdown"
  | "quick_wins"
  | "enhanced_resume"
  | "compare_versions"
  | "tailored_edits"
  | "issues_panel"
  | "cover_letters"
  | "cover_letter_clean"
  | "interview_questions"
  | "mock_interviews"
  | "resume_export";

type Limit = number | "unlimited" | false;

const LIMITS: Record<AppPlan, Record<FeatureKey, Limit>> = {
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

const COUNTER_COLUMN: Partial<Record<FeatureKey, string>> = {
  resume_uploads: "resume_uploads",
  analyses: "analyses",
  cover_letters: "cover_letters",
  interview_questions: "interview_questions",
  mock_interviews: "mock_interviews",
};

export function adminClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function periodStartIso(): string {
  const d = new Date();
  d.setUTCDate(1);
  return d.toISOString().slice(0, 10);
}

export async function getPlan(userId: string): Promise<AppPlan> {
  const admin = adminClient();
  const { data } = await admin
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.plan as AppPlan) ?? "free";
}

/**
 * Check whether the user can perform `feature`. Returns
 * { ok: true } if allowed, { ok: false, reason, status } otherwise.
 *
 * If `feature` has a numeric monthly cap, this also reads the current
 * counter row. Caller is responsible for `incrementUsage` after success.
 */
export async function checkEntitlement(
  userId: string,
  feature: FeatureKey,
): Promise<
  | { ok: true; plan: AppPlan }
  | { ok: false; status: number; error: string; plan: AppPlan }
> {
  const admin = adminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();
  const plan = (profile?.plan as AppPlan) ?? "free";
  const limit = LIMITS[plan][feature];

  if (limit === false || limit === 0) {
    return {
      ok: false,
      status: 402,
      plan,
      error: `Your ${plan} plan does not include this feature. Upgrade to unlock it.`,
    };
  }
  if (limit === "unlimited") return { ok: true, plan };

  const col = COUNTER_COLUMN[feature];
  if (!col) return { ok: true, plan };

  const period = periodStartIso();
  const { data: counter } = await admin
    .from("usage_counters")
    .select(col)
    .eq("user_id", userId)
    .eq("period_start", period)
    .maybeSingle();
  const used = (counter as Record<string, number> | null)?.[col] ?? 0;

  if (used >= (limit as number)) {
    return {
      ok: false,
      status: 402,
      plan,
      error: `You've used your monthly ${feature.replace(/_/g, " ")} on the ${plan} plan (${limit}). Upgrade for more.`,
    };
  }
  return { ok: true, plan };
}

/**
 * Increment a usage counter by 1. Idempotent on (user_id, period_start)
 * via ON CONFLICT.
 */
export async function incrementUsage(
  userId: string,
  feature: FeatureKey,
  delta = 1,
): Promise<void> {
  const col = COUNTER_COLUMN[feature];
  if (!col) return;
  const admin = adminClient();
  const period = periodStartIso();

  // Ensure row exists, then increment.
  await admin
    .from("usage_counters")
    .upsert(
      { user_id: userId, period_start: period },
      { onConflict: "user_id,period_start", ignoreDuplicates: true },
    );

  const { data: row } = await admin
    .from("usage_counters")
    .select(`id, ${col}`)
    .eq("user_id", userId)
    .eq("period_start", period)
    .maybeSingle();
  if (!row) return;
  const current = (row as Record<string, number | string>)[col] as number ?? 0;
  await admin
    .from("usage_counters")
    .update({ [col]: current + delta })
    .eq("id", (row as { id: string }).id);
}
