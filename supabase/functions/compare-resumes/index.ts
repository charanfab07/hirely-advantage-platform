// Compare two resumes — scores both side-by-side and recommends which has
// the higher chance of getting an interview. Uses Lovable AI tool calling.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkEntitlement } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a senior tech recruiter and ATS expert. You compare two resumes head-to-head for the SAME target role and decide which one is more likely to get an interview.

Be honest, specific, and confidence-building. Quote actual phrases from the resumes when justifying scores. Never invent facts.

Score both resumes on the SAME rubric (0–100 each):
- ats_score: ATS parsability, formatting, keyword presence
- impact_score: quantified results, strong verbs, specificity
- relevance_score: alignment with target role
- overall_score: weighted readiness for the role

Then pick a winner ("a", "b", or "tie") based primarily on overall_score and interview likelihood. Explain WHY in 2-3 sentences using concrete differences (e.g. "Resume A leads with quantified impact — '42% engagement lift' — while Resume B describes the same project generically.").

Provide 3-5 bullet "key_differences" — short, parallel comparisons of how the two resumes handle the same dimension.

Provide 2-4 actionable "recommendations_for_loser" — what the weaker (or tied) resume should fix to close the gap.

Always respond by calling the compare_resumes tool. Never reply with prose.`;

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "compare_resumes",
    description: "Return a structured head-to-head comparison of two resumes.",
    parameters: {
      type: "object",
      properties: {
        winner: {
          type: "string",
          enum: ["a", "b", "tie"],
          description: "Which resume has the higher chance of getting an interview.",
        },
        verdict: {
          type: "string",
          description: "2-3 sentence verdict explaining why the winner is stronger. ≤420 chars.",
        },
        resume_a: {
          type: "object",
          properties: {
            label: { type: "string", description: "Short label, e.g. file name or 'Resume A'" },
            ats_score: { type: "number" },
            impact_score: { type: "number" },
            relevance_score: { type: "number" },
            overall_score: { type: "number" },
            interview_chance: {
              type: "number",
              description: "0–100 likelihood of landing an interview for the target role.",
            },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
          },
          required: [
            "label",
            "ats_score",
            "impact_score",
            "relevance_score",
            "overall_score",
            "interview_chance",
            "strengths",
            "weaknesses",
          ],
          additionalProperties: false,
        },
        resume_b: {
          type: "object",
          properties: {
            label: { type: "string" },
            ats_score: { type: "number" },
            impact_score: { type: "number" },
            relevance_score: { type: "number" },
            overall_score: { type: "number" },
            interview_chance: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
          },
          required: [
            "label",
            "ats_score",
            "impact_score",
            "relevance_score",
            "overall_score",
            "interview_chance",
            "strengths",
            "weaknesses",
          ],
          additionalProperties: false,
        },
        key_differences: {
          type: "array",
          description: "3-5 short, parallel comparisons.",
          items: {
            type: "object",
            properties: {
              dimension: { type: "string", description: "e.g. 'Quantified impact', 'Keyword match'" },
              resume_a: { type: "string" },
              resume_b: { type: "string" },
            },
            required: ["dimension", "resume_a", "resume_b"],
            additionalProperties: false,
          },
        },
        recommendations_for_loser: {
          type: "array",
          description: "2-4 specific fixes for the weaker resume.",
          items: { type: "string" },
        },
      },
      required: [
        "winner",
        "verdict",
        "resume_a",
        "resume_b",
        "key_differences",
        "recommendations_for_loser",
      ],
      additionalProperties: false,
    },
  },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthenticated" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const { resume_a_id, resume_b_id, target_role } = body ?? {};
    if (!resume_a_id || !resume_b_id) {
      return json({ error: "Two resume IDs are required" }, 400);
    }
    if (resume_a_id === resume_b_id) {
      return json({ error: "Pick two different resumes to compare" }, 400);
    }

    const role = (typeof target_role === "string" ? target_role : "").trim().slice(0, 80);

    const gate = await checkEntitlement(userId, "compare_versions");
    if (!gate.ok) {
      return json({ error: gate.error, plan: gate.plan, upgrade_required: true }, gate.status);
    }

    const { data: rows, error: rErr } = await supabase
      .from("resumes")
      .select("id, user_id, file_name, raw_text")
      .in("id", [resume_a_id, resume_b_id]);
    if (rErr || !rows || rows.length !== 2) {
      return json({ error: "Resumes not found" }, 404);
    }
    if (rows.some((r) => r.user_id !== userId)) {
      return json({ error: "Forbidden" }, 403);
    }
    const a = rows.find((r) => r.id === resume_a_id)!;
    const b = rows.find((r) => r.id === resume_b_id)!;
    if (!a.raw_text || !b.raw_text) {
      return json({ error: "One of the resumes has no extracted text" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI key not configured" }, 500);

    const userPrompt = `Compare these two resumes head-to-head${
      role ? ` for the role: "${role}"` : ""
    } and decide which has a higher chance of landing an interview.

--- RESUME A — ${a.file_name} ---
${(a.raw_text as string).slice(0, 12000)}

--- RESUME B — ${b.file_name} ---
${(b.raw_text as string).slice(0, 12000)}

Now call compare_resumes. Use the file names above as the 'label' for each side.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "compare_resumes" } },
      }),
    });

    if (aiResp.status === 429) return json({ error: "Rate limit — try again in a moment" }, 429);
    if (aiResp.status === 402) return json({ error: "AI credits exhausted" }, 402);
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return json({ error: "AI gateway error" }, 500);
    }

    const aiJson = await aiResp.json();
    const call = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return json({ error: "AI did not return structured comparison" }, 500);
    }
    let parsed: any;
    try {
      parsed = JSON.parse(call.function.arguments);
    } catch {
      return json({ error: "Could not parse AI response" }, 500);
    }

    return json({
      comparison: {
        ...parsed,
        resume_a_id,
        resume_b_id,
        target_role: role || null,
      },
    });
  } catch (e) {
    console.error("compare-resumes error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
