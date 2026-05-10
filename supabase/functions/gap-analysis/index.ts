// Job-specific gap analysis — resume vs job description.
// Returns markdown text from Lovable AI Gateway.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert hiring consultant and resume strategist with 15+ years of experience working at top recruiting firms and as an in-house talent lead at Fortune 500 companies. You have reviewed over 50,000 resumes and understand exactly how recruiters and hiring managers evaluate candidates.

Your task is to perform a precise, job-specific gap analysis between a candidate's resume and a job description.

INPUTS YOU WILL RECEIVE:
- RESUME: The candidate's full resume text
- JOB DESCRIPTION: The full job posting they are targeting

YOUR ANALYSIS MUST INCLUDE:

1. HARD REQUIREMENTS GAPS (Critical — will likely auto-reject)
   - List every must-have requirement from the JD that is completely absent from the resume
   - Format: "❌ MISSING: [requirement] — This appears as a hard requirement in the JD ([quote the exact JD phrase]). Your resume does not mention this anywhere."
   - Only flag things genuinely absent, not things mentioned differently

2. SOFT REQUIREMENTS GAPS (Important — weakens candidacy)
   - List preferred qualifications mentioned in JD that are weak or absent in the resume
   - Format: "⚠️ WEAK: [requirement] — The JD mentions [quote]. Your resume touches on this but insufficiently at [location]."

3. KEYWORD GAPS (ATS risk)
   - List exact keywords and phrases from the JD not present in resume
   - Group by category: Technical Skills / Soft Skills / Tools / Certifications / Industry Terms
   - For each: "🔑 [keyword] — appears [X] times in JD, 0 times in your resume"

4. STRENGTHS MATCH (What's working)
   - List 3–5 things the candidate has that strongly match the JD
   - Be specific: reference both the JD requirement and the resume evidence
   - Format: "✅ STRONG MATCH: [JD requirement] ← [resume evidence]"

5. OVERALL MATCH SCORE
   - Score out of 100 broken into:
     * Hard Requirements Met: X/100
     * Keyword Alignment: X/100
     * Experience Level Match: X/100
     * Overall Fit: X/100
   - One sentence verdict: "You meet X of Y hard requirements. [Honest assessment of interview likelihood]."

6. PRIORITY ACTION LIST
   - Numbered list of the top 5 changes to make, ordered by impact
   - Each action must be specific and actionable, not generic
   - Bad: "Add more keywords"
   - Good: "Add 'stakeholder management' to your Q3 2022 bullet where you coordinated with the design and engineering teams"

TONE RULES:
- Be direct and honest, not encouraging or padded
- Never say "great resume" or use filler praise
- Speak like a trusted friend who is a hiring expert
- If the candidate is a poor fit, say so clearly with specific reasons
- Use plain language, no jargon unless it comes from the JD itself

OUTPUT FORMAT:
Use clear markdown section headers (## for each of the 6 sections). Use the emoji indicators as shown. Be specific — always quote from both the JD and the resume when referencing something. Never give generic advice.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resume_text, job_description, target_role, years_experience } = await req.json();
    if (!resume_text || !job_description) {
      return new Response(JSON.stringify({ error: "resume_text and job_description required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const role = typeof target_role === "string" ? target_role.trim() : "";
    const yoeRaw = typeof years_experience === "number" ? years_experience : Number(years_experience);
    const yoe = Number.isFinite(yoeRaw) ? Math.max(0, Math.min(60, Math.floor(yoeRaw))) : null;

    const contextLines: string[] = [];
    if (role) contextLines.push(`TARGET ROLE: ${role}`);
    if (yoe !== null) contextLines.push(`YEARS OF EXPERIENCE: ${yoe}`);
    const contextBlock = contextLines.length
      ? `CANDIDATE CONTEXT:\n${contextLines.join("\n")}\n\nCalibrate the seniority bar to this target role and years of experience. If the JD seniority does not match the candidate's stated years of experience, call out the level mismatch explicitly in the verdict.\n\n---\n\n`
      : "";

    const userPrompt = `${contextBlock}RESUME:\n${resume_text}\n\n---\n\nJOB DESCRIPTION:\n${job_description}\n\nPerform the full gap analysis as instructed.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit hit. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("Gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const markdown = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ markdown }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gap-analysis error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
