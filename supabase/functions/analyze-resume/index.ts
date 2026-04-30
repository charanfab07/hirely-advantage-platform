// Resume analyzer — extracts structured info & insights via Lovable AI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a senior tech hiring manager and ATS expert.
You review resumes the way a real reviewer would: ruthlessly, fairly, with concrete next steps.
Always respond by calling the analyze_resume tool with structured data. Never reply with prose.
Score honestly — most resumes score 60–80. Reserve 90+ for genuinely strong, quantified resumes.`;

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "analyze_resume",
    description: "Return a complete structured analysis of the candidate's resume.",
    parameters: {
      type: "object",
      properties: {
        overall_score: { type: "number", description: "0–100 overall readiness" },
        ats_score: { type: "number", description: "0–100 ATS compatibility" },
        summary: { type: "string", description: "One-sentence verdict, ≤140 chars" },
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
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                },
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
        issues: {
          type: "object",
          properties: {
            missing_sections: { type: "array", items: { type: "string" } },
            weak_bullets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  reason: { type: "string" },
                },
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
            strengths: { type: "array", items: { type: "string" }, description: "2 concise bullets" },
            gaps: { type: "array", items: { type: "string" }, description: "2 concise bullets" },
            risks: { type: "array", items: { type: "string" }, description: "2 concise bullets" },
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
        "extracted",
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
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json();
    const { resume_id, raw_text } = body ?? {};
    if (!resume_id || typeof raw_text !== "string" || raw_text.trim().length < 50) {
      return json({ error: "resume_id and meaningful raw_text are required" }, 400);
    }

    // Confirm resume belongs to user (RLS will enforce, but be explicit)
    const { data: resumeRow, error: resumeErr } = await supabase
      .from("resumes")
      .select("id, user_id")
      .eq("id", resume_id)
      .single();
    if (resumeErr || !resumeRow || resumeRow.user_id !== userId) {
      return json({ error: "Resume not found" }, 404);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI key not configured" }, 500);

    const truncated = raw_text.slice(0, 18000);

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
            content: `Analyze this resume and call analyze_resume.\n\n--- RESUME TEXT ---\n${truncated}`,
          },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "analyze_resume" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return json({ error: "Rate limit exceeded. Try again in a moment." }, 429);
      }
      if (aiResp.status === 402) {
        return json({ error: "AI credits exhausted. Add credits in workspace usage." }, 402);
      }
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

    // Persist
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
        model: "google/gemini-2.5-flash",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error", insertErr);
      return json({ error: "Failed to save analysis" }, 500);
    }

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
