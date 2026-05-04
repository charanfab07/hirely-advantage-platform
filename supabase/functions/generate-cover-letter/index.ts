// Cover letter generator — produces a structured, personalized 5-part cover letter via Lovable AI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkEntitlement, incrementUsage } from "../_shared/entitlements.ts";

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

INSTEAD, write a strong hook that opens with the candidate's perspective on the company, the role, or a sharp observation.

Structure the letter into FIVE parts and return them BOTH as separate fields and assembled into 'full_letter' (greeting + 4–5 paragraphs + sign-off):
1. hook            — Strong opening (does NOT start with "I"). 2–3 sentences.
2. alignment       — Map 2–3 of the candidate's most relevant skills directly to what the JD asks for. 2–4 sentences.
3. proof           — One concrete achievement with a real metric from the resume. 2–3 sentences.
4. culture_fit     — A specific reason the candidate fits THIS company's mission/values. Avoid clichés. 2–3 sentences.
5. closing         — Confident close. Suggests a next step. 1–2 sentences.

PERSONALIZATION ENGINE — you will be given: (a) extracted JD keywords, (b) candidate skills from resume, (c) the company mission. You MUST:
- Naturally weave AT LEAST 70% of the provided "must_use_keywords" into the letter using their exact wording (case-insensitive). Don't list them — embed them.
- Reference the company mission specifically in 'culture_fit' (paraphrased, not quoted).
- Only use skills the candidate actually has from their resume.

Tone parameter changes voice but never breaks the rules:
- confident: clear, direct, slightly bold
- warm:     personable, human, conversational
- direct:   short sentences, no fluff
- formal:   polished, executive

Length: ALWAYS follow the exact word target given in the user prompt. Do not impose your own cap. If the target asks for a two-page letter, expand each section with deeper, specific detail — never pad with fluff.

ALWAYS respond by calling the generate_cover_letter tool.`;

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "generate_cover_letter",
    description: "Return a structured, personalized cover letter.",
    parameters: {
      type: "object",
      properties: {
        hook: { type: "string" },
        alignment: { type: "string" },
        proof: { type: "string" },
        culture_fit: { type: "string" },
        closing: { type: "string" },
        full_letter: { type: "string", description: "Assembled letter. Match the requested word target exactly." },
        notes: { type: "string", description: "≤180 chars on why this letter works for this role." },
      },
      required: ["hook", "alignment", "proof", "culture_fit", "closing", "full_letter", "notes"],
      additionalProperties: false,
    },
  },
};

const KEYWORD_TOOL = {
  type: "function",
  function: {
    name: "extract_personalization",
    description: "Extract keywords from a job description, skills from a resume, and the candidate's strongest selling points.",
    parameters: {
      type: "object",
      properties: {
        jd_keywords: {
          type: "array",
          description: "10–18 most important hard skills, tools, methodologies, and role-specific terms from the JD. Lowercase, deduped, no generic words like 'team' or 'communication'.",
          items: { type: "string" },
        },
        resume_skills: {
          type: "array",
          description: "10–25 concrete skills/tools the candidate demonstrably has based on resume. Lowercase.",
          items: { type: "string" },
        },
        resume_strengths: {
          type: "array",
          description: "3–5 short bullet phrases describing the candidate's STRONGEST selling points for THIS specific JD — pulled from the resume only, never invented. Each ≤ 90 chars. Examples: 'Led 4-person team shipping React analytics dashboard', 'Cut API latency 38% via Redis caching at Acme'.",
          items: { type: "string" },
        },
      },
      required: ["jd_keywords", "resume_skills", "resume_strengths"],
      additionalProperties: false,
    },
  },
};

const ALLOWED_TONES = new Set(["confident", "warm", "direct", "formal"]);

const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","for","in","on","at","by","with","from","as","is","are","be","this","that","we","you","our","your","their","they","it","its",
]);

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9+#./\- ]+/g, " ").replace(/\s+/g, " ").trim();
}

function fallbackKeywords(text: string, n = 14): string[] {
  const t = normalize(text);
  if (!t) return [];
  const counts = new Map<string, number>();
  for (const w of t.split(" ")) {
    if (w.length < 3 || STOPWORDS.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w);
}

// Common abbreviation ↔ expansion pairs (both directions).
const ABBREVIATIONS: Record<string, string[]> = {
  "js": ["javascript"], "javascript": ["js"],
  "ts": ["typescript"], "typescript": ["ts"],
  "py": ["python"],
  "k8s": ["kubernetes"], "kubernetes": ["k8s"],
  "ml": ["machine learning"], "machine learning": ["ml"],
  "ai": ["artificial intelligence"], "artificial intelligence": ["ai"],
  "nlp": ["natural language processing"],
  "cv": ["computer vision"],
  "ds": ["data science"], "data science": ["ds"],
  "da": ["data analysis", "data analyst"],
  "pm": ["product manager", "product management", "project manager"],
  "ux": ["user experience"], "ui": ["user interface"],
  "qa": ["quality assurance"],
  "ci/cd": ["cicd", "ci cd", "continuous integration", "continuous delivery", "continuous deployment"],
  "cicd": ["ci/cd", "ci cd"],
  "aws": ["amazon web services"],
  "gcp": ["google cloud platform", "google cloud"],
  "kpi": ["kpis", "key performance indicator", "key performance indicators"],
  "sql": ["mysql", "postgresql", "postgres"],
  "postgres": ["postgresql"], "postgresql": ["postgres"],
  "node": ["nodejs", "node.js"], "nodejs": ["node", "node.js"],
  "react": ["reactjs", "react.js"],
  "vue": ["vuejs", "vue.js"],
  "next": ["nextjs", "next.js"],
  "rest": ["restful", "rest api", "rest apis"],
  "api": ["apis"],
  "saas": ["software as a service"],
  "b2b": ["business to business"],
  "b2c": ["business to consumer"],
  "etl": ["extract transform load"],
  "oop": ["object oriented programming", "object-oriented programming"],
  "tdd": ["test driven development", "test-driven development"],
  "ab testing": ["a/b testing", "a b testing", "ab tests"],
  "a/b testing": ["ab testing", "ab tests"],
};

// Lightweight stemmer: collapse common English suffixes so plurals/verb-forms
// share a stem. Not Porter-perfect, but good enough for keyword coverage.
function stem(word: string): string {
  let w = word.toLowerCase();
  if (w.length <= 3) return w;
  const suffixes = [
    "ization","izations","isation","isations",
    "ingly","ation","ations","ments","ness",
    "ities","ying","ies","ied",
    "ment","able","ible",
    "ing","edly","ed",
    "ly","es","s",
  ];
  for (const suf of suffixes) {
    if (w.length - suf.length >= 3 && w.endsWith(suf)) {
      w = w.slice(0, -suf.length);
      break;
    }
  }
  return w;
}

function tokenize(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

function phraseStem(phrase: string): string {
  return tokenize(phrase).map(stem).join(" ");
}

// Variants we'll consider equivalent to a given keyword.
function expandKeyword(kw: string): string[] {
  const base = normalize(kw);
  if (!base) return [];
  const variants = new Set<string>([base]);
  if (ABBREVIATIONS[base]) {
    for (const v of ABBREVIATIONS[base]) variants.add(normalize(v));
  }
  variants.add(base.replace(/[-/.]/g, " "));
  variants.add(base.replace(/[-/. ]/g, ""));
  return [...variants].filter(Boolean);
}

function findMatches(letter: string, keywords: string[]) {
  const letterTokens = tokenize(letter);
  const stemmedLetter = " " + letterTokens.map(stem).join(" ") + " ";
  const rawLetter = " " + letterTokens.join(" ") + " ";

  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of keywords) {
    const variants = expandKeyword(kw);
    let hit = false;
    for (const v of variants) {
      if (!v) continue;
      // Exact phrase (handles abbreviations and short tokens).
      if (rawLetter.includes(" " + v + " ")) { hit = true; break; }
      // Stemmed phrase (handles plurals + verb forms).
      const vStem = phraseStem(v);
      if (vStem && stemmedLetter.includes(" " + vStem + " ")) { hit = true; break; }
    }
    if (hit) matched.push(kw);
    else missing.push(kw);
  }
  return { matched, missing };
}

async function fetchCompanyMission(url: string): Promise<string> {
  try {
    const u = new URL(url);
    const res = await fetch(u.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CoverLetterBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Strip tags, scripts, styles
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    // Prefer meta description if present
    const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);
    const meta = metaMatch?.[1] ?? "";
    return (meta + " " + text).slice(0, 4000);
  } catch (e) {
    console.warn("fetchCompanyMission failed", e);
    return "";
  }
}

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

    const gate = await checkEntitlement(userId, "cover_letters");
    if (!gate.ok) return json({ error: gate.error, plan: gate.plan, upgrade_required: true, code: "OVER_QUOTA", feature: "cover_letters" }, gate.status);

    const body = await req.json();
    const {
      company,
      role,
      job_description,
      tone = "confident",
      resume_id,
      company_url,
      hiring_manager,
      strongest_achievement,
      length = "medium",
      experience_level = "junior",
      letter_style = "modern",
      include_salary = false,
      salary_expectation,
      mention_relocation = false,
      relocation_preference,
      avoid_generic = true,
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
    const ALLOWED_LENGTHS = new Set(["short", "medium", "detailed", "one_page", "two_page", "three_page"]);
    const ALLOWED_LEVELS = new Set(["fresher", "intern", "junior", "experienced"]);
    const ALLOWED_STYLES = new Set(["modern", "formal", "startup", "corporate"]);
    const ALLOWED_RELOC = new Set(["remote", "hybrid", "onsite", "relocate"]);
    const safeLength = ALLOWED_LENGTHS.has(length) ? length : "medium";
    const safeLevel = ALLOWED_LEVELS.has(experience_level) ? experience_level : "junior";
    const safeStyle = ALLOWED_STYLES.has(letter_style) ? letter_style : "modern";
    const safeReloc = ALLOWED_RELOC.has(relocation_preference) ? relocation_preference : null;
    const safeHiringManager = typeof hiring_manager === "string" ? hiring_manager.trim().slice(0, 120) : "";
    const safeAchievement = typeof strongest_achievement === "string" ? strongest_achievement.trim().slice(0, 600) : "";
    const safeSalary = typeof salary_expectation === "string" ? salary_expectation.trim().slice(0, 80) : "";

    // Page-aware targets. A standard cover letter page (Times/Georgia 11pt,
    // 1.4–1.6 line height, 1" margins) holds ~330–380 words. Two pages ≈ 700–780.
    const wordTargets: Record<string, string> = {
      short: "≤170 words",
      medium: "200–270 words",
      detailed: "300–360 words",
      one_page: "300–370 words (must fit on a SINGLE printed page — never overflow)",
      two_page: "640–780 words (must fill ~TWO printed pages — write 6–8 substantive paragraphs)",
      three_page: "980–1150 words (must fill ~THREE printed pages — write 9–11 substantive paragraphs with deep specifics)",
    };

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

    // ---- Personalization step 1: company mission from URL (best-effort) ----
    let companyMission = "";
    let safeCompanyUrl: string | null = null;
    if (typeof company_url === "string" && company_url.trim()) {
      const raw = company_url.trim();
      const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      try {
        new URL(withProto);
        safeCompanyUrl = withProto;
        companyMission = await fetchCompanyMission(withProto);
      } catch {
        safeCompanyUrl = null;
      }
    }

    // ---- Personalization step 2: extract JD keywords + resume skills via AI ----
    let jdKeywords: string[] = [];
    let resumeSkills: string[] = [];
    if (jd || resumeText) {
      try {
        const kwResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content:
                  "Extract job keywords and resume skills. Be precise — only concrete tools, technologies, methodologies, and role-specific terms. Skip soft generics. Always lowercase. Always call the tool.",
              },
              {
                role: "user",
                content: `JOB DESCRIPTION:\n${jd || "(none provided)"}\n\nRESUME:\n${resumeText || "(none provided)"}`,
              },
            ],
            tools: [KEYWORD_TOOL],
            tool_choice: { type: "function", function: { name: "extract_personalization" } },
          }),
        });
        if (kwResp.ok) {
          const kwData = await kwResp.json();
          const kwArgs = kwData?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
          if (kwArgs) {
            const parsed = JSON.parse(kwArgs);
            jdKeywords = Array.isArray(parsed.jd_keywords)
              ? parsed.jd_keywords.map((s: string) => s.toLowerCase().trim()).filter(Boolean).slice(0, 18)
              : [];
            resumeSkills = Array.isArray(parsed.resume_skills)
              ? parsed.resume_skills.map((s: string) => s.toLowerCase().trim()).filter(Boolean).slice(0, 25)
              : [];
          }
        }
      } catch (e) {
        console.warn("Keyword extraction failed, falling back", e);
      }
    }
    if (!jdKeywords.length && jd) jdKeywords = fallbackKeywords(jd, 12);
    if (!resumeSkills.length && resumeText) resumeSkills = fallbackKeywords(resumeText, 18);

    // Keywords the candidate genuinely has (intersection) — these are MUST-USE
    const skillSet = new Set(resumeSkills.map((s) => s.toLowerCase()));
    const mustUse = jdKeywords.filter((k) => skillSet.has(k.toLowerCase())).slice(0, 10);

    // ---- Personalization step 3: generate the letter with all context ----
    const relocLine = mention_relocation && safeReloc
      ? (safeReloc === "relocate"
          ? "Mention candidate is open to relocating for this role."
          : `Mention candidate's work-location preference: ${safeReloc}.`)
      : "Do NOT mention relocation or remote/onsite preferences.";

    const salaryLine = include_salary && safeSalary
      ? `Mention salary expectation gracefully (not as the focus): ${safeSalary}.`
      : include_salary
        ? "Mention that the candidate is open to discussing compensation, briefly and gracefully."
        : "Do NOT mention salary or compensation.";

    const styleGuide: Record<string, string> = {
      modern: "Voice: Modern — clean, current, conversational but sharp. Avoid stuffy phrases.",
      formal: "Voice: Formal — polished, traditional, respectful. Slightly more structured sentences.",
      startup: "Voice: Startup — scrappy, punchy, outcome-obsessed. Short sentences. Energy without hype.",
      corporate: "Voice: Corporate — buttoned-up, measured, professional. Avoid slang.",
    };

    const levelGuide: Record<string, string> = {
      fresher: "Candidate is a FRESHER (no full-time experience yet). Lean on coursework, projects, internships, and learning velocity. Never invent jobs.",
      intern: "Candidate is targeting an INTERNSHIP. Emphasize curiosity, projects, and ability to ship. Keep tone humble and eager but confident.",
      junior: "Candidate is JUNIOR (0–2 years). Highlight growth trajectory and the most concrete recent wins.",
      experienced: "Candidate is EXPERIENCED (3+ years). Lead with seniority, scope, and measurable business impact.",
    };

    const userPrompt = `Write a cover letter for:
Company: ${company.trim()}
Role: ${role.trim()}
Tone: ${safeTone}
Letter style: ${safeStyle}
Length target: ${wordTargets[safeLength]} (this is a HARD cap — do not exceed)
Experience level: ${safeLevel}
${safeHiringManager ? `Hiring manager: ${safeHiringManager} (address them by name in the greeting, e.g. "Dear ${safeHiringManager},")` : "No hiring manager name provided — open with a strong hook, no \"To Whom It May Concern\"."}

${styleGuide[safeStyle]}
${levelGuide[safeLevel]}
${salaryLine}
${relocLine}

${safeAchievement ? `--- CANDIDATE'S STRONGEST ACHIEVEMENT (use this as the basis for the 'proof' paragraph, polish wording but keep numbers exact) ---\n${safeAchievement}\n` : ""}

${jd ? `--- JOB DESCRIPTION ---\n${jd}\n` : "(No JD pasted — infer typical expectations.)"}

${companyMission ? `--- COMPANY MISSION / CONTEXT (from ${safeCompanyUrl}) ---\n${companyMission}\n` : ""}

${resumeText ? `--- CANDIDATE'S RESUME ---\n${resumeText}` : "(No resume — keep proof generic, never fabricate employers.)"}

--- PERSONALIZATION HINTS ---
JD keywords: ${jdKeywords.join(", ") || "(none)"}
Candidate's real skills: ${resumeSkills.join(", ") || "(none)"}
must_use_keywords (use ≥70%, exact wording, naturally embedded): ${mustUse.join(", ") || "(none)"}

Now call generate_cover_letter. The hook must NOT start with "I". Respect the length target strictly.`;

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
        return json({ error: "AI credits exhausted. Add credits in workspace usage.", code: "AI_CREDITS_EXHAUSTED" }, 503);
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

    // ---- Personalization step 4: compute keyword coverage of the final letter ----
    const fullLetter: string = parsed.full_letter ?? "";
    const { matched, missing } = jdKeywords.length
      ? findMatches(fullLetter, jdKeywords)
      : { matched: [] as string[], missing: [] as string[] };
    const matchScore = jdKeywords.length
      ? Math.round((matched.length / jdKeywords.length) * 100)
      : null;

    const { data: inserted, error: insertErr } = await supabase
      .from("cover_letters")
      .insert({
        user_id: userId,
        resume_id: resume_id ?? null,
        company: company.trim(),
        role: role.trim(),
        company_url: safeCompanyUrl,
        company_mission: companyMission ? companyMission.slice(0, 2000) : null,
        job_description: jd || null,
        tone: safeTone,
        hook: parsed.hook ?? "",
        alignment: parsed.alignment ?? "",
        proof: parsed.proof ?? "",
        culture_fit: parsed.culture_fit ?? "",
        closing: parsed.closing ?? "",
        full_letter: fullLetter,
        notes: parsed.notes ?? "",
        jd_keywords: jdKeywords,
        resume_skills: resumeSkills,
        matched_keywords: matched,
        missing_keywords: missing,
        match_score: matchScore,
        model: "google/gemini-2.5-flash",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error", insertErr);
      return json({ error: "Failed to save cover letter" }, 500);
    }

    await incrementUsage(userId, "cover_letters");
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
