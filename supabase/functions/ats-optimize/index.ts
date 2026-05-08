// ATS Keyword Optimizer — compare resume vs job description, surface missing
// keywords, and propose natural (non-stuffed) bullet rewrites.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkEntitlement } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an ATS optimization specialist who has helped candidates pass automated resume screens at Fortune 500 companies.

Your job: compare a candidate's resume against a target job description, surface the most important missing keywords, and produce HONEST, natural rewrites — never keyword-stuffed.

Hard rules (never break):
- Only suggest adding a keyword if the candidate's existing experience plausibly supports it. If it doesn't, mark it "evidence_in_resume": false and "recommendation": "skip" with a short reason.
- Never invent jobs, employers, schools, certifications, or fabricate metrics out of thin air. Plausible quantification of EXISTING work is fine.
- Rewrites must read naturally. No comma-separated keyword dumps, no "Skills: X, Y, Z" stuffing inside experience bullets.
- Categorize every keyword: technical_skill | tool | role_keyword | soft_skill | certification | industry_term.
- match_before reflects honest current alignment. match_after reflects realistic alignment AFTER applying ONLY the recommended (evidence-supported) edits.

Always respond by calling the optimize_ats tool. Never reply with prose.`;

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "optimize_ats",
    description: "Return a keyword match analysis and natural rewrite suggestions.",
    parameters: {
      type: "object",
      properties: {
        match_before: { type: "number", description: "0–100 honest current ATS keyword match" },
        match_after: { type: "number", description: "0–100 realistic match after applying ONLY recommended edits" },
        summary: { type: "string", description: "≤160 chars. Plain-English verdict." },
        jd_keywords: {
          type: "array",
          description: "Most important keywords extracted from the JD, ranked by importance.",
          items: {
            type: "object",
            properties: {
              keyword: { type: "string" },
              category: {
                type: "string",
                enum: ["technical_skill", "tool", "role_keyword", "soft_skill", "certification", "industry_term"],
              },
              importance: { type: "string", enum: ["must_have", "nice_to_have"] },
              found_in_resume: { type: "boolean" },
              evidence_in_resume: {
                type: "boolean",
                description: "True if the candidate's resume shows plausible underlying experience even if the exact word is missing.",
              },
            },
            required: ["keyword", "category", "importance", "found_in_resume", "evidence_in_resume"],
            additionalProperties: false,
          },
        },
        suggestions: {
          type: "array",
          description: "Per-missing-keyword recommendation. Cap at 12.",
          items: {
            type: "object",
            properties: {
              keyword: { type: "string" },
              recommendation: {
                type: "string",
                enum: ["add", "skip"],
                description: "'add' if evidence supports it, 'skip' if it would be dishonest.",
              },
              where_to_add: {
                type: "string",
                description: "Which section to weave it into (e.g. 'Skills section', 'XYZ Corp bullet 2'). ≤80 chars.",
              },
              reason: { type: "string", description: "≤160 chars. Why add or why skip." },
            },
            required: ["keyword", "recommendation", "where_to_add", "reason"],
            additionalProperties: false,
          },
        },
        bullet_rewrites: {
          type: "array",
          description: "2–6 natural rewrites of existing bullets that organically incorporate missing keywords. Only rewrite bullets where keyword fit is genuine.",
          items: {
            type: "object",
            properties: {
              before: { type: "string", description: "Verbatim original bullet." },
              after: { type: "string", description: "Natural rewrite. No keyword dumping." },
              keywords_added: { type: "array", items: { type: "string" } },
              why: { type: "string", description: "≤140 chars." },
            },
            required: ["before", "after", "keywords_added", "why"],
            additionalProperties: false,
          },
        },
      },
      required: ["match_before", "match_after", "summary", "jd_keywords", "suggestions", "bullet_rewrites"],
      additionalProperties: false,
    },
  },
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
    const userId = userData.user.id;

    const body = await req.json();
    const { resume_text, job_description } = body ?? {};

    if (
      !resume_text || typeof resume_text !== "string" || resume_text.trim().length < 80 ||
      !job_description || typeof job_description !== "string" || job_description.trim().length < 40
    ) {
      return json({ error: "Both resume_text (≥80 chars) and job_description (≥40 chars) are required." }, 400);
    }

    // Pro+ gate (reuses existing entitlement so no schema change).
    const gate = await checkEntitlement(userId, "ats_breakdown");
    if (!gate.ok) return json({ error: gate.error, plan: gate.plan, code: "OVER_QUOTA", upgrade_required: true }, gate.status);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI key not configured" }, 500);

    const userPrompt = `Compare this resume against this job description.

--- JOB DESCRIPTION ---
${job_description.slice(0, 8000)}

--- RESUME ---
${resume_text.slice(0, 15000)}

Now call optimize_ats.`;

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
        tool_choice: { type: "function", function: { name: "optimize_ats" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return json({ error: "Rate limit exceeded. Try again shortly." }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits exhausted." }, 402);
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return json({ error: "AI optimization failed" }, 500);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return json({ error: "AI did not return structured output" }, 500);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return json({ error: "AI returned invalid JSON" }, 500);
    }

    // Deterministic correction: the LLM sometimes flags keywords as "missing"
    // even when they appear verbatim in the resume. Run a case-insensitive,
    // punctuation-tolerant substring check on the raw resume text and override
    // false negatives so the user never sees a keyword marked Missing when
    // it's literally on their resume.
    const normalizedResume = resume_text.toLowerCase().replace(/[^a-z0-9+#./\s-]/g, " ");
    const resumeHasKeyword = (kw: string): boolean => {
      if (!kw) return false;
      const k = kw.trim().toLowerCase();
      if (!k) return false;
      // Word-boundary-ish check that tolerates punctuation around the keyword.
      const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, "i");
      return re.test(normalizedResume);
    };

    if (Array.isArray(parsed?.jd_keywords)) {
      let corrected = 0;
      for (const k of parsed.jd_keywords) {
        if (k && typeof k.keyword === "string" && resumeHasKeyword(k.keyword)) {
          if (k.found_in_resume !== true || k.evidence_in_resume !== true) corrected++;
          k.found_in_resume = true;
          k.evidence_in_resume = true;
        }
      }
      if (corrected > 0) {
        // Drop AI suggestions for keywords we just confirmed are present.
        if (Array.isArray(parsed.suggestions)) {
          parsed.suggestions = parsed.suggestions.filter(
            (s: any) => !(s && typeof s.keyword === "string" && resumeHasKeyword(s.keyword)),
          );
        }
        // Recompute match_before honestly from the corrected list.
        const total = parsed.jd_keywords.length;
        const found = parsed.jd_keywords.filter((k: any) => k.found_in_resume).length;
        if (total > 0) {
          const honest = Math.round((found / total) * 100);
          parsed.match_before = Math.max(parsed.match_before ?? 0, honest);
          parsed.match_after = Math.max(parsed.match_after ?? 0, parsed.match_before);
        }
      }
    }

    return json({ result: parsed, plan: gate.plan });
  } catch (e) {
    console.error("ats-optimize error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
