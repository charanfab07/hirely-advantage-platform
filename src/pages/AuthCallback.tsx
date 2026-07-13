import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const getSafeReturnPath = (value: string | null) => {
  if (!value) return "/app/resume";
  if (!value.startsWith("/") || value.startsWith("//")) return "/app/resume";
  if (value.startsWith("/auth")) return "/app/resume";
  return value;
};

const getStoredReturnPath = () => {
  try {
    return sessionStorage.getItem("auth:returnPath");
  } catch {
    return null;
  }
};

const clearStoredReturnPath = () => {
  try {
    sessionStorage.removeItem("auth:returnPath");
  } catch {
    /* ignore */
  }
};

const applyPendingPlan = async (userId: string) => {
  let pending: string | null = null;
  try {
    pending = localStorage.getItem("pending_plan");
  } catch {
    /* ignore */
  }

  if (!pending || !["free", "pro", "advanced"].includes(pending)) return;

  await supabase
    .from("profiles")
    .update({ plan: pending as "free" | "pro" | "advanced" })
    .eq("user_id", userId);

  try {
    localStorage.removeItem("pending_plan");
  } catch {
    /* ignore */
  }

  toast.success(
    pending === "free"
      ? "You're on the Free plan."
      : `You're now on ${pending[0].toUpperCase()}${pending.slice(1)}.`,
  );
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    let active = true;
    const returnPath = getSafeReturnPath(params.get("next") ?? getStoredReturnPath());

    const finish = async () => {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        if (session?.user) {
          await applyPendingPlan(session.user.id);
          clearStoredReturnPath();
          if (active) navigate(returnPath, { replace: true });
          return;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }

      if (!active) return;
      toast.error("Google sign-in did not finish. Please try again.");
      navigate(`/auth?next=${encodeURIComponent(returnPath)}`, { replace: true });
    };

    finish();

    return () => {
      active = false;
    };
  }, [navigate, params]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 text-foreground">
      <p className="text-sm text-muted-foreground">Finishing sign-in…</p>
    </main>
  );
};

export default AuthCallback;