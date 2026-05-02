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

If a target_role is provided, evaluate job_match.match_percent honestly against typical requirements and frame missing_requirements as "areas to highlight" rather than deficiencies.

DETERMINISTIC SCORING (critical — this is what makes scores trustworthy):
You MUST compute ats_score and overall_score using the explicit rubric below. Do NOT guess. Do NOT vary. The same resume text MUST always produce the same scores.

ats_score (0–100) = sum of these checks, each worth the listed points if PASS, 0 if FAIL:
- Contact block has email AND phone (10)
- Has a clear "Experience" or "Work Experience" section header (10)
- Has an "Education" section header (8)
- Has a "Skills" section header (8)
- ≥80% of experience bullets start with a strong action verb (12)
- ≥50% of experience bullets contain a number, %, or $ metric (15)
- No tables, columns, images, or graphics implied by the text (10)
- Standard fonts/no unicode icons in body text (5)
- Dates in consistent format (e.g. "Jan 2023 – Present") (7)
- Job titles + companies clearly paired with dates (8)
- Keyword density appropriate for target role (7)
Round to nearest integer. Show your check internally; do not output it — just the final number.

overall_score (0–100) = round(0.25*ats_compatibility + 0.30*impact_statements + 0.20*relevance + 0.15*clarity + 0.10*keyword_match).

Sub-scores in score_breakdown must be computed first, then overall_score derived from them. This guarantees consistency across runs.`;

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

// ============================================================
// DETERMINISTIC SCORING — computed from raw text, not the LLM.
// Same resume text → identical scores, every single time.
// ============================================================

const ACTION_VERBS = new Set([
  "led","built","designed","developed","launched","shipped","created","architected",
  "implemented","managed","drove","delivered","optimized","reduced","increased","improved",
  "scaled","automated","engineered","analyzed","researched","negotiated","mentored","owned",
  "spearheaded","established","streamlined","accelerated","transformed","refactored","migrated",
  "deployed","integrated","produced","generated","achieved","executed","coordinated","supervised",
  "founded","initiated","authored","published","presented","trained","resolved","reorganized",
  "upgraded","redesigned","standardized","consolidated","forecasted","modeled","piloted",
  "orchestrated","championed","prototyped","facilitated","oversaw","directed","wrote","tested",
  "validated","secured","saved","cut","grew","boosted","earned","unified","reviewed",
]);

function getBullets(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .map((l) => l.replace(/^[-•·●▪◦▫■□◆◇►▶✓✔*+→·]+\s*/, ""))
    .filter((l) => l.length >= 15 && l.length <= 400 && /[a-zA-Z]/.test(l))
    .filter((l) => !/^(experience|education|skills|projects|summary|objective|certifications|awards|contact|profile)\s*:?\s*$/i.test(l));
}

function hasSection(text: string, names: string[]): boolean {
  const re = new RegExp(`(^|\\n)\\s*(${names.join("|")})\\s*:?\\s*(\\n|$)`, "i");
  return re.test(text);
}

function computeAtsScore(text: string): { score: number; breakdown: Record<string, number> } {
  const lower = text.toLowerCase();
  const checks: Record<string, { pass: boolean; pts: number }> = {};

  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(text);
  checks.contact = { pass: hasEmail && hasPhone, pts: 10 };

  checks.experience_section = { pass: hasSection(text, ["experience", "work experience", "professional experience", "employment"]), pts: 10 };
  checks.education_section = { pass: hasSection(text, ["education", "academic background"]), pts: 8 };
  checks.skills_section = { pass: hasSection(text, ["skills", "technical skills", "core competencies"]), pts: 8 };

  const bullets = getBullets(text);
  const bulletCount = bullets.length;

  let actionVerbBullets = 0;
  let metricBullets = 0;
  for (const b of bullets) {
    const firstWord = b.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
    if (ACTION_VERBS.has(firstWord)) actionVerbBullets++;
    if (/(\d+%|\$\s?\d|\d[\d,]*\+?\s*(users|customers|clients|employees|projects|hours|days|weeks|months|years|x|k|m|million|billion))|(\b\d{2,}\b)/i.test(b)) {
      metricBullets++;
    }
  }
  const actionRatio = bulletCount > 0 ? actionVerbBullets / bulletCount : 0;
  const metricRatio = bulletCount > 0 ? metricBullets / bulletCount : 0;
  checks.action_verbs = { pass: bulletCount >= 3 && actionRatio >= 0.8, pts: 12 };
  checks.metrics = { pass: bulletCount >= 3 && metricRatio >= 0.5, pts: 15 };

  // Formatting heuristics
  const hasTabsOrColumns = /\t{2,}|\s{8,}\S+\s{8,}\S/.test(text);
  checks.formatting = { pass: !hasTabsOrColumns, pts: 10 };

  const unicodeIcons = (text.match(/[\u2700-\u27BF\uE000-\uF8FF\uD83C-\uDBFF\uDC00-\uDFFF]/g) || []).length;
  checks.standard_fonts = { pass: unicodeIcons <= 5, pts: 5 };

  // Date consistency
  const dateMatches = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}\b|\b\d{1,2}\/\d{4}\b|\b\d{4}\s*[-–—]\s*(present|\d{4})\b/gi) || [];
  checks.date_format = { pass: dateMatches.length >= 2, pts: 7 };

  // Title/company pairing — look for lines with capitalized words near a date
  const titleCompanyPairs = (text.match(/^.{4,80}(?:,|\sat\s|\s\|\s|\s-\s|\s—\s).{2,60}.*\d{4}/gim) || []).length;
  checks.title_company = { pass: titleCompanyPairs >= 1 || dateMatches.length >= 2, pts: 8 };

  // Keyword density: look for at least 8 distinct domain-ish keywords
  const techKeywords = ["javascript","typescript","python","java","react","node","sql","aws","docker","kubernetes","git","api","agile","scrum","ci/cd","html","css","figma","mongodb","postgres","graphql","rest","cloud","linux","testing","leadership","management","strategy","analysis","communication","stakeholder","product","design","marketing","sales","finance","data","analytics","machine learning","ai"];
  const matchedKw = techKeywords.filter((k) => lower.includes(k)).length;
  checks.keyword_density = { pass: matchedKw >= 6, pts: 7 };

  let score = 0;
  const breakdown: Record<string, number> = {};
  for (const [k, v] of Object.entries(checks)) {
    const earned = v.pass ? v.pts : 0;
    score += earned;
    breakdown[k] = earned;
  }
  return { score: Math.max(0, Math.min(100, Math.round(score))), breakdown };
}

function computeSubScores(text: string, atsScore: number): {
  ats_compatibility: number;
  impact_statements: number;
  relevance: number;
  clarity: number;
  keyword_match: number;
} {
  const bullets = getBullets(text);
  const bulletCount = bullets.length || 1;
  const lower = text.toLowerCase();

  let action = 0, metric = 0;
  for (const b of bullets) {
    const fw = b.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
    if (ACTION_VERBS.has(fw)) action++;
    if (/(\d+%|\$\s?\d|\b\d{2,}\b)/.test(b)) metric++;
  }
  const impact = Math.round(((action / bulletCount) * 0.5 + (metric / bulletCount) * 0.5) * 100);

  // Clarity: avg bullet length sweet spot 10–25 words
  const avgWords = bullets.reduce((s, b) => s + b.split(/\s+/).length, 0) / bulletCount;
  const clarity = Math.round(
    avgWords < 6 ? 50 :
    avgWords <= 25 ? 90 :
    avgWords <= 40 ? 75 : 55
  );

  // Keyword match: distinct tech/domain terms present
  const kws = ["javascript","typescript","python","java","react","node","sql","aws","docker","kubernetes","git","api","agile","html","css","figma","mongodb","postgres","graphql","cloud","linux","leadership","management","strategy","analysis","communication","product","design","data","analytics","ai"];
  const matched = kws.filter((k) => lower.includes(k)).length;
  const keyword_match = Math.min(100, Math.round((matched / 12) * 100));

  // Relevance: heuristic — if has experience + skills + education sections + decent length
  let relevance = 50;
  if (hasSection(text, ["experience", "work experience"])) relevance += 15;
  if (hasSection(text, ["skills"])) relevance += 10;
  if (hasSection(text, ["education"])) relevance += 10;
  if (text.length > 1500) relevance += 10;
  relevance = Math.min(100, relevance);

  return {
    ats_compatibility: atsScore,
    impact_statements: Math.max(0, Math.min(100, impact)),
    relevance,
    clarity,
    keyword_match,
  };
}

function computeOverallScore(sub: ReturnType<typeof computeSubScores>): number {
  return Math.round(
    0.25 * sub.ats_compatibility +
    0.30 * sub.impact_statements +
    0.20 * sub.relevance +
    0.15 * sub.clarity +
    0.10 * sub.keyword_match
  );
}

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

    // Return cached analysis if one already exists for this resume + target_role.
    // Guarantees the same resume always shows the same scores.
    const normalizedTarget = (target_role ?? "").trim().toLowerCase() || null;
    const cachedQuery = supabase
      .from("resume_analyses")
      .select("*")
      .eq("resume_id", resume_id)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);
    const { data: cachedRows } = await (normalizedTarget
      ? cachedQuery.eq("target_role", target_role)
      : cachedQuery.is("target_role", null));
    if (cachedRows && cachedRows.length > 0) {
      return json({ analysis: cachedRows[0], cached: true });
    }

    const gate = await checkEntitlement(userId, "analyses");
    if (!gate.ok) return json({ error: gate.error, plan: gate.plan, upgrade_required: true, code: "OVER_QUOTA", feature: "analyses" }, gate.status);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI key not configured" }, 500);

    // ---- DETERMINISTIC SCORES (computed from raw text, identical every run) ----
    const atsResult = computeAtsScore(raw_text);
    const subScores = computeSubScores(raw_text, atsResult.score);
    const overallScore = computeOverallScore(subScores);

    const truncated = raw_text.slice(0, 9000);
    const targetLine = target_role
      ? `Target role: ${String(target_role).slice(0, 120)}`
      : `Target role: (infer from resume — likely the candidate's most recent / highest title).`;

    // Hard timeout on the AI call so the UI never hangs. Gemini Flash Lite
    // typically returns in ~5–10s; we abort at 28s and surface a clear error.
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 28000);

    let aiResp: Response;
    try {
      aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: ac.signal,
        body: JSON.stringify({
          // Flash Lite: fastest in the Gemini 2.5 family. Deterministic
          // settings keep results identical across runs.
          model: "google/gemini-2.5-flash-lite",
          temperature: 0,
          top_p: 0.1,
          seed: 7,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Analyze this resume and call analyze_resume. Apply the deterministic scoring rubric exactly — same input must yield same scores.\n\n${targetLine}\n\n--- RESUME TEXT ---\n${truncated}`,
            },
          ],
          tools: [TOOL_SCHEMA],
          tool_choice: { type: "function", function: { name: "analyze_resume" } },
        }),
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if ((err as { name?: string })?.name === "AbortError") {
        return json({ error: "Analysis took too long. Please try again." }, 504);
      }
      throw err;
    }
    clearTimeout(timeoutId);

    if (!aiResp.ok) {
      if (aiResp.status === 429) return json({ error: "Rate limit exceeded. Try again in a moment." }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits exhausted. Add credits in workspace usage.", code: "AI_CREDITS_EXHAUSTED" }, 503);
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
        overall_score: overallScore,
        ats_score: atsResult.score,
        summary: parsed.summary ?? "",
        extracted: parsed.extracted ?? {},
        issues: parsed.issues ?? {},
        insights: parsed.insights ?? {},
        quick_wins: parsed.quick_wins ?? [],
        strengths: parsed.strengths ?? [],
        weaknesses: parsed.weaknesses ?? [],
        bullet_rewrites: parsed.bullet_rewrites ?? [],
        score_breakdown: subScores,
        job_match: parsed.job_match ?? {},
        target_role: target_role ?? null,
        model: "google/gemini-2.5-flash-lite",
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
