// Cover letter generator — produces a structured 5-part cover letter via Lovable AI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an elite cover letter writer who has helped candidates land roles at top tech, finance, and consulting firms. You write letters that sound like a real, confident, specific human — never like generic AI fluff.

HARD BANS — never use any of these openings or phrases:
- "I am writing to apply for…"
- "I am excited to apply…"
- "Please find attached…"
- "I would like to express my interest…"
- "I am a passionate / motivated / hardworking…"
- "To Whom It May Concern"
- Any sentence that starts the letter with "I".

INSTEAD, write a strong hook that opens with the candidate's perspective on the company, the role, or a sharp observation. Example shape:
"When I saw your opening for a Product Analyst, I immediately recognized an opportunity to apply my experience in data-driven decision making to a team that values innovation."

Structure the letter into FIVE parts and return them BOTH as separate fields and assembled into 'full_letter' (greeting + 4–5 paragraphs + sign-off):

1. hook            — Strong opening (does NOT start with "I"). Reference the company/role specifically. 2–3 sentences.
2. alignment       — Map 2–3 of the candidate's most relevant skills directly to what the JD asks for. 2–4 sentences.
3. proof           — One concrete achievement with a real metric from the resume. 2–3 sentences.
4. culture_fit     — A specific, researched-feeling reason the candidate fits THIS company's values, mission, or product. Avoid clichés like "dynamic team". 2–3 sentences.
5. closing         — Confident close. Suggests a next step (a 20-min chat, a question about the role). Not "I look forward to hearing from you." 1–2 sentences.

Tone parameter changes voice but never breaks the rules:
- confident: clear, direct, slightly bold
- warm:     personable, human, conversational
- direct:   short sentences, no fluff
- formal:   polished, executive

Hard length cap: full_letter ≤ 350 words. Each section is real prose, not bullet points.

ALWAYS respond by calling the generate_cover_letter tool.`;

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "generate_cover_letter",
    description: "Return a structured, role-specific cover letter.",
    parameters: {
      type: "object",
      properties: {
        hook: { type: "string", description: "Opening paragraph. Must NOT start with 'I'." },
        alignment: { type: "string", description: "Skills↔JD alignment paragraph." },
        proof: { type: "string", description: "Concrete achievement with metric." },
        culture_fit: { type: "string", description: "Why this candidate fits THIS company." },
        closing: { type: "string", description: "Confident close suggesting a next step." },
        full_letter: {
          type: "string",
          description:
            "Assembled letter: greeting line, then the 5 sections as flowing paragraphs, then sign-off. ≤350 words.",
        },
        notes: {
          type: "string",
          description: "≤180 chars. Plain-English note: why this letter works for THIS role.",
        },
      },
      required: ["hook", "alignment", "proof", "culture_fit", "closing", "full_letter", "notes"],
      additionalProperties: false,
    },
  },
};

const ALLOWED_TONES = new Set(["confident", "warm", "direct", "formal"]);

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
    const {
      company,
      role,
      job_description,
      tone = "confident",
      resume_id,
    } = body ?? {};

    if (
      typeof company !== "string" ||
      company.trim().length < 1 ||
      typeof role !== "string" ||
      role.trim().length < 2
    ) {
      return json({ error: "company and role are required" }, 400);
    }
    const safeTone = ALLOWED_TONES.has(tone) ? tone : "confident";

    // Pull resume text if provided & owned by user
    let resumeText = "";
    if (resume_id) {
      const { data: r } = await supabase
        .from("resumes")
        .select("user_id, raw_text")
        .eq("id", resume_id)
        .single();
      if (r && r.user_id === userId && r.raw_text) {
        resumeText = r.raw_text.slice(0, 12000);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI key not configured" }, 500);

    const jd = (job_description ?? "").toString().slice(0, 6000);

    const userPrompt = `Write a cover letter for:
Company: ${company.trim()}
Role: ${role.trim()}
Tone: ${safeTone}

${jd ? `--- JOB DESCRIPTION ---\n${jd}\n` : "(No JD pasted — infer typical expectations for this role at this company.)"}

${resumeText ? `--- CANDIDATE'S RESUME (use real achievements & metrics from here) ---\n${resumeText}` : "(No resume attached — keep proof generic but plausible, never fabricate specific employers.)"}

Now call generate_cover_letter. Remember: NO banned openings. The hook must NOT start with "I".`;

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
        tool_choice: { type: "function", function: { name: "generate_cover_letter" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429)
        return json({ error: "Rate limit exceeded. Try again in a moment." }, 429);
      if (aiResp.status === 402)
        return json({ error: "AI credits exhausted. Add credits in workspace usage." }, 402);
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return json({ error: "AI generation failed" }, 500);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call", JSON.stringify(aiData).slice(0, 500));
      return json({ error: "AI did not return structured output" }, 500);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args", e);
      return json({ error: "AI returned invalid JSON" }, 500);
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("cover_letters")
      .insert({
        user_id: userId,
        resume_id: resume_id ?? null,
        company: company.trim(),
        role: role.trim(),
        job_description: jd || null,
        tone: safeTone,
        hook: parsed.hook ?? "",
        alignment: parsed.alignment ?? "",
        proof: parsed.proof ?? "",
        culture_fit: parsed.culture_fit ?? "",
        closing: parsed.closing ?? "",
        full_letter: parsed.full_letter ?? "",
        notes: parsed.notes ?? "",
        model: "google/gemini-2.5-flash",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error", insertErr);
      return json({ error: "Failed to save cover letter" }, 500);
    }

    return json({ letter: inserted });
  } catch (e) {
    console.error("generate-cover-letter error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
