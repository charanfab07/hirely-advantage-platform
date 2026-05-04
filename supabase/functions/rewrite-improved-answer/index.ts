// Rewrites an existing improved answer in a specific style — shorter, or more confident.
// Frontend-driven: used by the Interview Prep "Make shorter" / "Make more confident" buttons.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getPlan } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_STYLES = new Set(["shorter", "confident", "star"]);

const styleInstruction: Record<string, string> = {
  shorter:
    "Rewrite the answer to be SIGNIFICANTLY SHORTER (target 90–130 words). Keep STAR structure, keep the strongest metric, cut filler, hedging, and repeated context. Stay faithful to the candidate's experience.",
  confident:
    "Rewrite the answer to sound MORE CONFIDENT. Use active voice and decisive verbs (\"led\", \"built\", \"delivered\", \"decided\"). Remove hedging like \"kind of\", \"I think maybe\", \"I tried to\", \"sort of\". Keep STAR structure and the same facts.",
  star:
    "Rewrite the answer in EXPLICIT STAR structure. Open with one sentence of Situation, then Task, then Action (the bulk — what THEY did), then a measurable Result. Each section should be clearly distinguishable when read aloud. Keep facts faithful; if the original had no metric, keep a placeholder in [brackets]. Target 150–250 words.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    // Improved answer rewriting is a paid feature.
    const plan = await getPlan(userData.user.id);
    if (plan === "free") {
      return json(
        {
          error: "Improved-answer rewrites are a Pro feature. Upgrade to unlock.",
          locked: true,
        },
        402,
      );
    }

    const { question, answer, style } = (await req.json()) ?? {};
    if (typeof answer !== "string" || answer.trim().length < 20) {
      return json({ error: "answer must be provided" }, 400);
    }
    if (!ALLOWED_STYLES.has(style)) {
      return json({ error: "style must be 'shorter' or 'confident'" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI key not configured" }, 500);

    const sys = `You are an elite interview coach. You rewrite interview answers WITHOUT inventing new facts. Stay faithful to the candidate's story. Return ONLY the rewritten answer — no preamble, no labels.`;

    const user = `${styleInstruction[style as keyof typeof styleInstruction]}

QUESTION:
${typeof question === "string" ? question.trim() : "(unspecified)"}

CURRENT ANSWER:
${answer.trim()}

Return only the rewritten answer text.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return json({ error: "Rate limit. Try again shortly." }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits exhausted." }, 402);
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return json({ error: "Rewrite failed" }, 500);
    }

    const data = await aiResp.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) return json({ error: "Empty rewrite" }, 500);

    return json({ answer: text.trim() });
  } catch (e) {
    console.error("rewrite-improved-answer error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
