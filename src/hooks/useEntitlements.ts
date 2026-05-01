import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  type AppPlan,
  type FeatureKey,
  type Usage,
  ZERO_USAGE,
  canUse,
  isUnlocked,
  limitFor,
  remaining,
} from "@/lib/entitlements";

export type Entitlements = {
  plan: AppPlan;
  usage: Usage;
  loading: boolean;
  refresh: () => Promise<void>;
  can: (feature: FeatureKey) => boolean;
  unlocked: (feature: FeatureKey) => boolean;
  limit: (feature: FeatureKey) => ReturnType<typeof limitFor>;
  remaining: (feature: FeatureKey) => ReturnType<typeof remaining>;
};

export function useEntitlements(): Entitlements {
  const { user } = useAuth();
  const [plan, setPlan] = useState<AppPlan>("free");
  const [usage, setUsage] = useState<Usage>(ZERO_USAGE);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan("free");
      setUsage(ZERO_USAGE);
      setLoading(false);
      return;
    }
    setLoading(true);
    const periodStart = new Date();
    periodStart.setUTCDate(1);
    const periodIso = periodStart.toISOString().slice(0, 10);

    const [{ data: profile }, { data: counter }] = await Promise.all([
      supabase.from("profiles").select("plan").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("usage_counters")
        .select("resume_uploads, analyses, cover_letters, mock_interviews, interview_questions")
        .eq("user_id", user.id)
        .eq("period_start", periodIso)
        .maybeSingle(),
    ]);

    setPlan(((profile?.plan as AppPlan) ?? "free"));
    setUsage({
      resume_uploads: counter?.resume_uploads ?? 0,
      analyses: counter?.analyses ?? 0,
      cover_letters: counter?.cover_letters ?? 0,
      mock_interviews: counter?.mock_interviews ?? 0,
      interview_questions: counter?.interview_questions ?? 0,
    });
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    plan,
    usage,
    loading,
    refresh,
    can: (f) => canUse(plan, f, usage),
    unlocked: (f) => isUnlocked(plan, f),
    limit: (f) => limitFor(plan, f),
    remaining: (f) => remaining(plan, f, usage),
  };
}
