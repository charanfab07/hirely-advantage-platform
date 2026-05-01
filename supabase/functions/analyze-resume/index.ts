// Resume analyzer — deep, hiring-manager style review via Lovable AI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkEntitlement, incrementUsage } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a senior tech hiring coach and ATS expert. You write like a premium career advisor at a top firm — warm, encouraging, specific, and confidence-building. The candidate should finish reading the review feeling motivated, not deflated, while still understanding exactly what to improve.

TONE RULES (critical — never break these):
- Never use words like: "weak", "bad", "poor", "terrible", "lacking", "fails", "you don't", "you can't", "missing" (as a verdict).
- Reframe every issue as an opportunity. Lead with what's already working before suggesting refinements.
- Use phrases like: "With a few refinements…", "You're well positioned to…", "A small adjustment here will…", "This is a strong foundation — let's sharpen…", "Recruiters will respond even more strongly when…".
- Speak TO the candidate ("your experience shows…") not AT them.
- Be specific and actionable. Quote their actual words when suggesting improvements, and rewrite weak bullets with realistic, plausible metrics ("Managed social media accounts" → "Managed 5 social media accounts, increasing engagement by 42% in 6 months").

Always respond by calling the analyze_resume tool. Never reply with prose.

Scoring rubric (overall_score, 0–100) — be honest with the number, premium with the words:
- 90–100: Exceptional. Quantified, senior-level, ATS-ready, tailored.
- 75–89: Strong. Mostly quantified, clear progression, a few refinements away from exceptional.
- 60–74: Promising foundation. With targeted polish, ready to compete for mid-level roles.
- <60: A solid starting point — a focused rework will unlock significantly stronger results.

Most resumes score 60–80. Reserve 90+ for genuinely strong, quantified resumes.

The 'summary' field MUST follow the premium tone — e.g. "With a few refinements, your resume can strongly compete for mid-level product roles." NOT "Your resume is weak in metrics."

In 'weaknesses', the 'title' and 'detail' must still be specific, but framed as growth opportunities (e.g. "Quantify impact for stronger recall" rather than "No metrics").

score_breakdown sub-scores must each be 0–100 and roughly justify overall_score.

If a target_role is provided, evaluate job_match.match_percent honestly against typical requirements and frame missing_requirements as "areas to highlight" rather than deficiencies.`;

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "analyze_resume",
    description: "Return a complete, deep structured analysis of the candidate's resume.",
    parameters: {
      type: "object",
      properties: {
        overall_score: { type: "number", description: "0–100 overall readiness" },
        ats_score: { type: "number", description: "0–100 ATS compatibility" },
        summary: { type: "string", description: "One-sentence verdict, ≤140 chars, specific not generic" },

        score_breakdown: {
          type: "object",
          description: "Sub-scores 0–100 that justify overall_score.",
          properties: {
            ats_compatibility: { type: "number" },
            impact_statements: { type: "number" },
            relevance: { type: "number" },
            clarity: { type: "number" },
            keyword_match: { type: "number" },
          },
          required: ["ats_compatibility", "impact_statements", "relevance", "clarity", "keyword_match"],
          additionalProperties: false,
        },

        job_match: {
          type: "object",
          description: "Match against the target role (if given). Otherwise generic for resume's apparent target.",
          properties: {
            target_role: { type: "string" },
            match_percent: { type: "number", description: "0–100" },
            target_percent: { type: "number", description: "Realistic reachable % after fixes, 0–100" },
            missing_requirements: { type: "array", items: { type: "string" } },
            matched_requirements: { type: "array", items: { type: "string" } },
          },
          required: ["match_percent", "missing_requirements", "matched_requirements"],
          additionalProperties: false,
        },

        extracted: {
          type: "object",
          properties: {
            name: { type: "string" },
            headline: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            location: { type: "string" },
            skills: { type: "array", items: { type: "string" } },
            keywords: { type: "array", items: { type: "string" } },
            experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  company: { type: "string" },
                  dates: { type: "string" },
                  bullets: { type: "array", items: { type: "string" } },
                },
                required: ["title", "company"],
                additionalProperties: false,
              },
            },
            projects: {
              type: "array",
              items: {
                type: "object",
                properties: { name: { type: "string" }, description: { type: "string" } },
                required: ["name"],
                additionalProperties: false,
              },
            },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  degree: { type: "string" },
                  school: { type: "string" },
                  dates: { type: "string" },
                },
                required: ["degree", "school"],
                additionalProperties: false,
              },
            },
            achievements: { type: "array", items: { type: "string" } },
          },
          required: ["skills", "keywords", "experience", "education"],
          additionalProperties: false,
        },

        strengths: {
          type: "array",
          description: "3–5 specific strengths. Each must reference something concrete from the resume.",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "≤8 words, e.g. 'Strong project diversity'" },
              detail: { type: "string", description: "≤160 chars, cite specifics from resume" },
            },
            required: ["title", "detail"],
            additionalProperties: false,
          },
        },

        weaknesses: {
          type: "array",
          description: "3–6 categorized refinement opportunities. Be specific and constructive — frame each as a growth opportunity, never as a criticism. Titles like 'Quantify impact for stronger recall' not 'No metrics'.",
          items: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: [
                  "lack_of_metrics",
                  "weak_action_verbs",
                  "too_generic",
                  "missing_summary",
                  "skills_mismatch",
                  "ats_formatting",
                  "grammar",
                  "other",
                ],
              },
              title: { type: "string", description: "≤10 words" },
              detail: { type: "string", description: "≤220 chars, quote the resume when possible" },
              severity: { type: "string", enum: ["high", "medium", "low"] },
            },
            required: ["category", "title", "detail", "severity"],
            additionalProperties: false,
          },
        },

        bullet_rewrites: {
          type: "array",
          description: "2–5 concrete before/after rewrites of weak bullets. Use plausible realistic metrics.",
          items: {
            type: "object",
            properties: {
              before: { type: "string" },
              after: { type: "string" },
              why: { type: "string", description: "≤140 chars" },
            },
            required: ["before", "after", "why"],
            additionalProperties: false,
          },
        },

        issues: {
          type: "object",
          properties: {
            missing_sections: { type: "array", items: { type: "string" } },
            weak_bullets: {
              type: "array",
              items: {
                type: "object",
                properties: { text: { type: "string" }, reason: { type: "string" } },
                required: ["text", "reason"],
                additionalProperties: false,
              },
            },
            grammar_issues: { type: "array", items: { type: "string" } },
            formatting_problems: { type: "array", items: { type: "string" } },
            ats_problems: { type: "array", items: { type: "string" } },
          },
          required: [
            "missing_sections",
            "weak_bullets",
            "grammar_issues",
            "formatting_problems",
            "ats_problems",
          ],
          additionalProperties: false,
        },

        insights: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            gaps: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
          },
          required: ["strengths", "gaps", "risks"],
          additionalProperties: false,
        },

        quick_wins: {
          type: "array",
          description: "Top 3 single-tap improvements, highest impact first.",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "≤8 words" },
              detail: { type: "string", description: "≤140 chars" },
              impact: { type: "string", enum: ["high", "medium", "low"] },
            },
            required: ["title", "detail", "impact"],
            additionalProperties: false,
          },
        },
      },
      required: [
        "overall_score",
        "ats_score",
        "summary",
        "score_breakdown",
        "job_match",
        "extracted",
        "strengths",
        "weaknesses",
        "bullet_rewrites",
        "issues",
        "insights",
        "quick_wins",
      ],
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
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json();
    const { resume_id, raw_text, target_role } = body ?? {};
    if (!resume_id || typeof raw_text !== "string" || raw_text.trim().length < 50) {
      return json({ error: "resume_id and meaningful raw_text are required" }, 400);
    }

    const { data: resumeRow, error: resumeErr } = await supabase
      .from("resumes")
      .select("id, user_id")
      .eq("id", resume_id)
      .single();
    if (resumeErr || !resumeRow || resumeRow.user_id !== userId) {
      return json({ error: "Resume not found" }, 404);
    }

    const gate = await checkEntitlement(userId, "analyses");
    if (!gate.ok) return json({ error: gate.error, plan: gate.plan, upgrade_required: true }, gate.status);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI key not configured" }, 500);

    const truncated = raw_text.slice(0, 18000);
    const targetLine = target_role
      ? `Target role: ${String(target_role).slice(0, 120)}`
      : `Target role: (infer from resume — likely the candidate's most recent / highest title).`;

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
          {
            role: "user",
            content: `Analyze this resume and call analyze_resume.\n\n${targetLine}\n\n--- RESUME TEXT ---\n${truncated}`,
          },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "analyze_resume" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return json({ error: "Rate limit exceeded. Try again in a moment." }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits exhausted. Add credits in workspace usage." }, 402);
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return json({ error: "AI analysis failed" }, 500);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response", JSON.stringify(aiData).slice(0, 500));
      return json({ error: "AI did not return structured analysis" }, 500);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args", e);
      return json({ error: "AI returned invalid JSON" }, 500);
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("resume_analyses")
      .insert({
        resume_id,
        user_id: userId,
        overall_score: Math.round(parsed.overall_score ?? 0),
        ats_score: Math.round(parsed.ats_score ?? 0),
        summary: parsed.summary ?? "",
        extracted: parsed.extracted ?? {},
        issues: parsed.issues ?? {},
        insights: parsed.insights ?? {},
        quick_wins: parsed.quick_wins ?? [],
        strengths: parsed.strengths ?? [],
        weaknesses: parsed.weaknesses ?? [],
        bullet_rewrites: parsed.bullet_rewrites ?? [],
        score_breakdown: parsed.score_breakdown ?? {},
        job_match: parsed.job_match ?? {},
        target_role: target_role ?? null,
        model: "google/gemini-2.5-flash",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error", insertErr);
      return json({ error: "Failed to save analysis" }, 500);
    }

    await incrementUsage(userId, "analyses");
    return json({ analysis: inserted });
  } catch (e) {
    console.error("analyze-resume error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
