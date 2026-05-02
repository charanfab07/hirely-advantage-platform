// Compare two resumes head-to-head. Numeric scores are computed deterministically
// from the resume text (same input → same scores, every time). The LLM only
// generates the qualitative verdict, strengths, weaknesses, differences and
// recommendations — never the numbers.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkEntitlement } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------- Deterministic scoring (mirrors analyze-resume) ----------

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

function computeAtsScore(text: string): number {
  let score = 0;
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(text);
  if (hasEmail && hasPhone) score += 10;
  if (hasSection(text, ["experience", "work experience", "professional experience", "employment"])) score += 10;
  if (hasSection(text, ["education", "academic background"])) score += 8;
  if (hasSection(text, ["skills", "technical skills", "core competencies"])) score += 8;

  const bullets = getBullets(text);
  let action = 0, metric = 0;
  for (const b of bullets) {
    const fw = b.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
    if (ACTION_VERBS.has(fw)) action++;
    if (/(\d+%|\$\s?\d|\d[\d,]*\+?\s*(users|customers|clients|employees|projects|hours|days|weeks|months|years|x|k|m|million|billion))|(\b\d{2,}\b)/i.test(b)) {
      metric++;
    }
  }
  const n = bullets.length;
  if (n >= 3 && action / n >= 0.8) score += 12;
  if (n >= 3 && metric / n >= 0.5) score += 15;

  const tabsOrColumns = /\t{2,}|\s{8,}\S+\s{8,}\S/.test(text);
  if (!tabsOrColumns) score += 10;

  const unicodeIcons = (text.match(/[\u2700-\u27BF\uE000-\uF8FF\uD83C-\uDBFF\uDC00-\uDFFF]/g) || []).length;
  if (unicodeIcons <= 5) score += 5;

  const dateMatches = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}\b|\b\d{1,2}\/\d{4}\b|\b\d{4}\s*[-–—]\s*(present|\d{4})\b/gi) || [];
  if (dateMatches.length >= 2) score += 7;

  const titleCompanyPairs = (text.match(/^.{4,80}(?:,|\sat\s|\s\|\s|\s-\s|\s—\s).{2,60}.*\d{4}/gim) || []).length;
  if (titleCompanyPairs >= 1 || dateMatches.length >= 2) score += 8;

  const lower = text.toLowerCase();
  const techKeywords = ["javascript","typescript","python","java","react","node","sql","aws","docker","kubernetes","git","api","agile","scrum","ci/cd","html","css","figma","mongodb","postgres","graphql","rest","cloud","linux","testing","leadership","management","strategy","analysis","communication","stakeholder","product","design","marketing","sales","finance","data","analytics","machine learning","ai"];
  if (techKeywords.filter((k) => lower.includes(k)).length >= 6) score += 7;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeImpactScore(text: string): number {
  const bullets = getBullets(text);
  if (bullets.length === 0) return 40;
  let action = 0, metric = 0;
  for (const b of bullets) {
    const fw = b.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
    if (ACTION_VERBS.has(fw)) action++;
    if (/(\d+%|\$\s?\d|\b\d{2,}\b)/.test(b)) metric++;
  }
  const n = bullets.length;
  return Math.max(0, Math.min(100, Math.round(((action / n) * 0.5 + (metric / n) * 0.5) * 100)));
}

function computeRelevanceScore(text: string, role: string): number {
  const lower = text.toLowerCase();
  if (!role) {
    let r = 50;
    if (hasSection(text, ["experience", "work experience"])) r += 15;
    if (hasSection(text, ["skills"])) r += 10;
    if (hasSection(text, ["education"])) r += 10;
    if (text.length > 1500) r += 10;
    return Math.min(100, r);
  }
  // Role-aware: count overlapping role tokens.
  const roleTokens = role
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((t) => t.length >= 3 && !["the","and","for","with","you","are","our"].includes(t));
  if (roleTokens.length === 0) return 60;
  const matched = roleTokens.filter((t) => lower.includes(t)).length;
  const ratio = matched / roleTokens.length;
  let r = Math.round(40 + ratio * 50); // 40–90 from token overlap
  if (hasSection(text, ["experience", "work experience"])) r += 5;
  if (hasSection(text, ["skills"])) r += 5;
  return Math.max(0, Math.min(100, r));
}

function computeKeywordMatch(text: string): number {
  const lower = text.toLowerCase();
  const kws = ["javascript","typescript","python","java","react","node","sql","aws","docker","kubernetes","git","api","agile","html","css","figma","mongodb","postgres","graphql","cloud","linux","leadership","management","strategy","analysis","communication","product","design","data","analytics","ai"];
  const matched = kws.filter((k) => lower.includes(k)).length;
  return Math.min(100, Math.round((matched / 12) * 100));
}

function computeClarity(text: string): number {
  const bullets = getBullets(text);
  if (bullets.length === 0) return 55;
  const avgWords = bullets.reduce((s, b) => s + b.split(/\s+/).length, 0) / bullets.length;
  return avgWords < 6 ? 50 : avgWords <= 25 ? 90 : avgWords <= 40 ? 75 : 55;
}

function deterministicScores(text: string, role: string) {
  const ats = computeAtsScore(text);
  const impact = computeImpactScore(text);
  const relevance = computeRelevanceScore(text, role);
  const clarity = computeClarity(text);
  const keyword = computeKeywordMatch(text);
  const overall = Math.round(0.25 * ats + 0.30 * impact + 0.20 * relevance + 0.15 * clarity + 0.10 * keyword);
  // Interview chance correlates strongly with overall; clamp realistic range.
  const interview = Math.max(5, Math.min(95, Math.round(overall * 0.9 + (impact - 50) * 0.1)));
  return {
    ats_score: ats,
    impact_score: impact,
    relevance_score: relevance,
    overall_score: overall,
    interview_chance: interview,
  };
}

// ---------- Qualitative LLM call ----------

const SYSTEM_PROMPT = `You are a senior tech recruiter comparing two resumes for the SAME target role.

You will receive both resumes AND the precomputed deterministic scores for each. You MUST treat those scores as fixed ground truth — never invent or change them. Your job is to produce the qualitative comparison only: who wins (based on the given overall_score and interview_chance), why, what each side does well or poorly, the key parallel differences, and what the weaker side should fix.

Tone: warm, specific, confidence-building. Quote actual phrases from the resumes when justifying claims. Never invent facts.

Always respond by calling the compare_resumes_qualitative tool. Never reply with prose.`;

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "compare_resumes_qualitative",
    description: "Qualitative comparison only — numbers are NOT included.",
    parameters: {
      type: "object",
      properties: {
        winner: { type: "string", enum: ["a", "b", "tie"] },
        verdict: { type: "string", description: "2-3 sentences explaining why the winner is stronger. ≤420 chars." },
        resume_a: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
          },
          required: ["strengths", "weaknesses"],
          additionalProperties: false,
        },
        resume_b: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
          },
          required: ["strengths", "weaknesses"],
          additionalProperties: false,
        },
        key_differences: {
          type: "array",
          items: {
            type: "object",
            properties: {
              dimension: { type: "string" },
              resume_a: { type: "string" },
              resume_b: { type: "string" },
            },
            required: ["dimension", "resume_a", "resume_b"],
            additionalProperties: false,
          },
        },
        recommendations_for_loser: { type: "array", items: { type: "string" } },
      },
      required: ["winner", "verdict", "resume_a", "resume_b", "key_differences", "recommendations_for_loser"],
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
    if (!resume_a_id || !resume_b_id) return json({ error: "Two resume IDs are required" }, 400);
    if (resume_a_id === resume_b_id) return json({ error: "Pick two different resumes to compare" }, 400);

    const role = (typeof target_role === "string" ? target_role : "").trim().slice(0, 80);

    const gate = await checkEntitlement(userId, "compare_versions");
    if (!gate.ok) return json({ error: gate.error, plan: gate.plan, upgrade_required: true }, gate.status);

    const { data: rows, error: rErr } = await supabase
      .from("resumes")
      .select("id, user_id, file_name, raw_text")
      .in("id", [resume_a_id, resume_b_id]);
    if (rErr || !rows || rows.length !== 2) return json({ error: "Resumes not found" }, 404);
    if (rows.some((r) => r.user_id !== userId)) return json({ error: "Forbidden" }, 403);

    const a = rows.find((r) => r.id === resume_a_id)!;
    const b = rows.find((r) => r.id === resume_b_id)!;
    if (!a.raw_text || !b.raw_text) return json({ error: "One of the resumes has no extracted text" }, 400);

    // ---- Deterministic numbers — same resume always gets same numbers ----
    const aScores = deterministicScores(a.raw_text as string, role);
    const bScores = deterministicScores(b.raw_text as string, role);

    let winner: "a" | "b" | "tie" = "tie";
    if (aScores.overall_score > bScores.overall_score + 1) winner = "a";
    else if (bScores.overall_score > aScores.overall_score + 1) winner = "b";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI key not configured" }, 500);

    const userPrompt = `Compare these two resumes${role ? ` for the role: "${role}"` : ""}.

PRECOMPUTED SCORES (use as-is, do not change):
Resume A — ${a.file_name}:
  ats=${aScores.ats_score}, impact=${aScores.impact_score}, relevance=${aScores.relevance_score}, overall=${aScores.overall_score}, interview_chance=${aScores.interview_chance}

Resume B — ${b.file_name}:
  ats=${bScores.ats_score}, impact=${bScores.impact_score}, relevance=${bScores.relevance_score}, overall=${bScores.overall_score}, interview_chance=${bScores.interview_chance}

Predetermined winner (based on overall_score): ${winner.toUpperCase()}

--- RESUME A ---
${(a.raw_text as string).slice(0, 12000)}

--- RESUME B ---
${(b.raw_text as string).slice(0, 12000)}

Now call compare_resumes_qualitative. Use the predetermined winner exactly. Provide qualitative strengths, weaknesses, key differences, and recommendations for the weaker side.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0,
        top_p: 0.1,
        seed: 7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "compare_resumes_qualitative" } },
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
    if (!call?.function?.arguments) return json({ error: "AI did not return structured comparison" }, 500);
    let parsed: any;
    try {
      parsed = JSON.parse(call.function.arguments);
    } catch {
      return json({ error: "Could not parse AI response" }, 500);
    }

    // Force the deterministic numbers and winner regardless of what the LLM returned.
    return json({
      comparison: {
        winner,
        verdict: parsed.verdict ?? "",
        resume_a: {
          label: a.file_name,
          ...aScores,
          strengths: Array.isArray(parsed.resume_a?.strengths) ? parsed.resume_a.strengths : [],
          weaknesses: Array.isArray(parsed.resume_a?.weaknesses) ? parsed.resume_a.weaknesses : [],
        },
        resume_b: {
          label: b.file_name,
          ...bScores,
          strengths: Array.isArray(parsed.resume_b?.strengths) ? parsed.resume_b.strengths : [],
          weaknesses: Array.isArray(parsed.resume_b?.weaknesses) ? parsed.resume_b.weaknesses : [],
        },
        key_differences: Array.isArray(parsed.key_differences) ? parsed.key_differences : [],
        recommendations_for_loser: Array.isArray(parsed.recommendations_for_loser) ? parsed.recommendations_for_loser : [],
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
