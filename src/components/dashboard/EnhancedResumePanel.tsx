import { useEffect, useMemo, useState } from "react";
import { Sparkles, Download, Copy, Check, RefreshCw, FileText, Wand2, AlertTriangle, ShieldCheck } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Enhancement = {
  id: string;
  resume_id: string;
  analysis_id: string | null;
  contact: {
    name?: string;
    location?: string;
    email?: string;
    phone?: string;
    links?: { label: string; url: string }[];
  };
  headline?: string | null;
  summary?: string | null;
  skills: { group: string; items: string[] }[];
  experience: {
    role: string;
    company: string;
    location?: string;
    dates: string;
    bullets: string[];
  }[];
  projects: { name: string; description: string; tech?: string[]; impact?: string }[];
  education: { degree: string; school: string; dates?: string; detail?: string }[];
  achievements: string[];
  changelog: { category: string; title: string; detail: string }[];
  added_keywords: { keyword: string; confidence: "high" | "medium" | "low"; reason: string }[];
  estimated_score_before: number | null;
  estimated_score_after: number | null;
  created_at: string;
};

const ROLE_OPTIONS = [
  "AI/ML Engineer",
  "Data Analyst",
  "Python Developer",
  "Software Developer",
  "Web Developer",
  "Fresher IT role",
];

const CATEGORY_LABEL: Record<string, string> = {
  summary: "Summary",
  metrics_added: "Quantified",
  verbs_strengthened: "Sharper verbs",
  keyword_injection: "Keywords",
  section_added: "New section",
  ats_fix: "ATS fix",
  formatting: "Formatting",
  grammar: "Grammar",
  specificity: "Specificity",
  other: "Other",
};

const CATEGORY_TONE: Record<string, string> = {
  summary: "bg-[hsl(258_45%_58%/0.12)] text-[hsl(258_38%_42%)]",
  metrics_added: "bg-[hsl(150_55%_45%/0.12)] text-[hsl(150_45%_28%)]",
  verbs_strengthened: "bg-[hsl(258_45%_58%/0.12)] text-[hsl(258_38%_42%)]",
  keyword_injection: "bg-[hsl(35_92%_55%/0.14)] text-[hsl(28_70%_38%)]",
  section_added: "bg-[hsl(150_55%_45%/0.12)] text-[hsl(150_45%_28%)]",
  ats_fix: "bg-[hsl(258_45%_58%/0.12)] text-[hsl(258_38%_42%)]",
  formatting: "bg-foreground/[0.06] text-foreground/70",
  grammar: "bg-foreground/[0.06] text-foreground/70",
  specificity: "bg-[hsl(258_45%_58%/0.12)] text-[hsl(258_38%_42%)]",
  other: "bg-foreground/[0.06] text-foreground/70",
};

export const EnhancedResumePanel = ({
  className,
  resumeId,
  analysisId,
}: {
  className?: string;
  resumeId: string | null;
  analysisId: string | null;
}) => {
  const [enhancement, setEnhancement] = useState<Enhancement | null>(null);
  const [originalText, setOriginalText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [customRole, setCustomRole] = useState("");

  // Load latest enhancement + original resume text in parallel
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!resumeId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const [enhRes, resumeRes] = await Promise.all([
        supabase
          .from("resume_enhancements")
          .select("*")
          .eq("resume_id", resumeId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase.from("resumes").select("raw_text").eq("id", resumeId).single(),
      ]);
      if (cancelled) return;
      setEnhancement(((enhRes.data ?? [])[0] as unknown as Enhancement) ?? null);
      setOriginalText(((resumeRes.data as any)?.raw_text as string) ?? "");
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [resumeId]);


  const handleGenerate = async (roleOverride?: string) => {
    if (!resumeId) {
      toast.error("Upload a resume first");
      return;
    }
    const role = (roleOverride ?? (selectedRole === "__custom__" ? customRole : selectedRole) ?? "").trim();
    // Require role only on first generation. Regenerate (when an enhancement already exists)
    // can reuse the previously analyzed role server-side.
    if (!role && !enhancement) {
      toast.error("Pick the role you're applying for first");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-resume", {
        body: { resume_id: resumeId, analysis_id: analysisId ?? null, target_role: role },
      });
      if (error) {
        const msg = (error as any)?.message ?? "Failed to generate";
        if (msg.includes("Rate limit")) toast.error("Too many requests — try again in a moment");
        else if (msg.includes("credits")) toast.error("AI credits exhausted");
        else toast.error(msg);
        return;
      }
      if ((data as any)?.error) {
        toast.error((data as any).error);
        return;
      }
      setEnhancement((data as any)?.enhancement ?? null);
      toast.success("Your enhanced resume is ready");
    } catch (e) {
      toast.error("Couldn't generate enhanced resume");
    } finally {
      setGenerating(false);
    }
  };

  const plainText = useMemo(() => (enhancement ? toPlainText(enhancement) : ""), [enhancement]);
  const markdown = useMemo(() => (enhancement ? toMarkdown(enhancement) : ""), [enhancement]);

  const handleCopy = async () => {
    if (!plainText) return;
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadFile = (content: string, ext: "txt" | "md") => {
    const blob = new Blob([content], { type: ext === "md" ? "text/markdown" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const name = enhancement?.contact?.name?.replace(/\s+/g, "_") ?? "resume";
    a.href = url;
    a.download = `${name}_enhanced.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!resumeId) {
    return (
      <SectionCard className={className}>
        <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
          Enhanced resume
        </p>
        <p className="mt-2 text-[14px] text-foreground/70 tracking-tight max-w-xl">
          Upload your resume first — we'll then rewrite it into a recruiter-ready version
          that fixes every issue we surfaced.
        </p>
      </SectionCard>
    );
  }

  if (loading) {
    return (
      <SectionCard className={className}>
        <p className="text-[12.5px] text-foreground/55">Loading…</p>
      </SectionCard>
    );
  }

  // No enhancement yet — generation hero with role selector
  if (!enhancement) {
    const isCustom = selectedRole === "__custom__";
    const canGenerate =
      !!selectedRole && (!isCustom || customRole.trim().length >= 2);
    return (
      <SectionCard className={cn("relative overflow-hidden", className)} tone="dark">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 60% at 80% 0%, hsl(258 60% 60% / 0.45), transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10.5px] tracking-[0.18em] uppercase font-medium">
            <Sparkles className="w-3 h-3" />
            One-click rewrite
          </div>
          <h2 className="mt-4 text-[28px] sm:text-[34px] leading-[1.05] font-semibold tracking-[-0.03em] max-w-xl">
            Get the perfect version of your resume.
          </h2>
          <p className="mt-3 text-[13.5px] leading-[1.55] text-white/70 max-w-lg tracking-tight">
            ATS scoring depends on the role you're targeting. Pick the role you're applying for —
            we'll then rewrite every weak bullet, fix every ATS issue, and tailor keywords specifically
            for that role.
          </p>

          <div className="mt-6">
            <p className="text-[10.5px] tracking-[0.18em] uppercase text-white/55 font-medium">
              Which role are you applying for?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => {
                const active = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      "px-3.5 py-2 rounded-full text-[12.5px] tracking-tight border transition-colors",
                      active
                        ? "bg-white text-foreground border-white"
                        : "bg-white/5 text-white/85 border-white/15 hover:bg-white/10",
                    )}
                  >
                    {role}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setSelectedRole("__custom__")}
                className={cn(
                  "px-3.5 py-2 rounded-full text-[12.5px] tracking-tight border transition-colors",
                  isCustom
                    ? "bg-white text-foreground border-white"
                    : "bg-white/5 text-white/85 border-white/15 hover:bg-white/10",
                )}
              >
                Other…
              </button>
            </div>
            {isCustom && (
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value.slice(0, 80))}
                placeholder="e.g. Backend Engineer, Product Designer…"
                className="mt-3 w-full max-w-md px-3.5 py-2 rounded-lg bg-white/10 border border-white/15 text-[13px] text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors"
              />
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={generating || !canGenerate}
              className="px-5 py-2.5 rounded-full bg-white text-foreground text-[13px] font-medium tracking-tight hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Rewriting your resume…
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  Generate my perfect resume
                </>
              )}
            </button>
            <span className="text-[11.5px] text-white/50 tracking-tight">
              {canGenerate
                ? "Takes ~15 seconds. We never invent jobs or credentials."
                : "Pick a target role to continue."}
            </span>
          </div>
        </div>
      </SectionCard>
    );
  }

  const before = enhancement.estimated_score_before ?? 0;
  const after = enhancement.estimated_score_after ?? 0;
  const lift = Math.max(0, after - before);

  return (
    <div className={cn("space-y-4", className)}>
      {/* HERO with score lift + actions */}
      <SectionCard tone="dark" className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 60% at 80% 0%, hsl(258 60% 60% / 0.45), transparent 60%)",
          }}
        />
        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-end">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10.5px] tracking-[0.18em] uppercase font-medium">
              <Sparkles className="w-3 h-3" />
              Your enhanced resume
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <p className="text-[44px] leading-none font-semibold tracking-[-0.04em] tabular-nums">
                {before}
                <span className="text-white/40 mx-2 text-[24px]">→</span>
                {after}
              </p>
              {lift > 0 && (
                <span className="text-[12px] tracking-tight px-2 py-0.5 rounded-full bg-[hsl(150_55%_55%/0.18)] text-[hsl(150_70%_75%)]">
                  +{lift} pts
                </span>
              )}
            </div>
            <p className="mt-3 text-[13px] text-white/65 tracking-tight max-w-xl">
              {enhancement.changelog.length} change{enhancement.changelog.length === 1 ? "" : "s"} applied across your summary, bullets,
              skills, and structure.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[12px] flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy text"}
            </button>
            <button
              type="button"
              onClick={() => downloadFile(plainText, "txt")}
              className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[12px] flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              .txt
            </button>
            <button
              type="button"
              onClick={() => downloadFile(markdown, "md")}
              className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[12px] flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              .md
            </button>
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={generating}
              className="px-3.5 py-2 rounded-full bg-white text-foreground text-[12px] font-medium hover:bg-white/90 transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
              {generating ? "Rewriting…" : "Regenerate"}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* NEEDS VERIFICATION — flag AI-added quantified claims */}
      <NeedsVerificationPanel enhancement={enhancement} originalText={originalText} />

      {/* ORIGINAL vs ENHANCED — section-by-section comparison */}
      <ComparisonTable enhancement={enhancement} />

      {/* CHANGELOG */}
      {enhancement.changelog.length > 0 && (
        <SectionCard>
          <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
            What we changed · {enhancement.changelog.length}
          </p>
          <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {enhancement.changelog.map((c, i) => (
              <li key={i} className="rounded-xl bg-foreground/[0.025] border border-foreground/[0.05] p-3.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full tracking-tight",
                      CATEGORY_TONE[c.category] ?? CATEGORY_TONE.other,
                    )}
                  >
                    {CATEGORY_LABEL[c.category] ?? c.category}
                  </span>
                  <p className="text-[13px] font-medium tracking-tight text-foreground truncate">
                    {c.title}
                  </p>
                </div>
                <p className="mt-1.5 text-[12.5px] text-foreground/65 leading-snug tracking-tight">
                  {c.detail}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* ADDED KEYWORDS */}
      {enhancement.added_keywords.length > 0 && (
        <SectionCard>
          <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
            Keywords injected · {enhancement.added_keywords.length}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {enhancement.added_keywords.map((k, i) => (
              <span
                key={i}
                title={k.reason}
                className={cn(
                  "text-[12px] px-2.5 py-1 rounded-full tracking-tight border",
                  k.confidence === "high" &&
                    "bg-[hsl(150_55%_45%/0.10)] text-[hsl(150_45%_28%)] border-[hsl(150_55%_45%/0.18)]",
                  k.confidence === "medium" &&
                    "bg-[hsl(258_45%_58%/0.10)] text-[hsl(258_38%_42%)] border-[hsl(258_45%_58%/0.18)]",
                  k.confidence === "low" &&
                    "bg-[hsl(35_92%_55%/0.12)] text-[hsl(28_70%_38%)] border-[hsl(35_92%_55%/0.20)]",
                )}
              >
                {k.keyword}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] text-foreground/45 tracking-tight">
            Green = strongly supported by your resume. Amber = plausible but verify before claiming.
          </p>
        </SectionCard>
      )}

      {/* THE RESUME — document preview */}
      <SectionCard className="!p-0 overflow-hidden">
        <div className="px-7 sm:px-10 py-9 bg-white text-[#0E0B1F] font-serif">
          {/* header */}
          <div className="text-center">
            <h1 className="text-[26px] font-semibold tracking-[-0.02em]">
              {enhancement.contact?.name ?? "Your name"}
            </h1>
            {enhancement.headline && (
              <p className="mt-1 text-[14px] text-[#0E0B1F]/70 tracking-tight">
                {enhancement.headline}
              </p>
            )}
            <p className="mt-1.5 text-[11.5px] text-[#0E0B1F]/55 tracking-tight">
              {[
                enhancement.contact?.location,
                enhancement.contact?.email,
                enhancement.contact?.phone,
                ...(enhancement.contact?.links ?? []).map((l) => l.label),
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </p>
          </div>

          {/* summary */}
          {enhancement.summary && (
            <Section title="Summary">
              <p className="text-[13px] leading-[1.55] text-[#0E0B1F]/85">{enhancement.summary}</p>
            </Section>
          )}

          {/* skills */}
          {enhancement.skills.length > 0 && (
            <Section title="Skills">
              <ul className="space-y-1">
                {enhancement.skills.map((s, i) => (
                  <li key={i} className="text-[13px] text-[#0E0B1F]/85">
                    <span className="font-semibold">{s.group}:</span> {s.items.join(", ")}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* experience */}
          {enhancement.experience.length > 0 && (
            <Section title="Experience">
              <ul className="space-y-4">
                {enhancement.experience.map((e, i) => (
                  <li key={i}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13.5px] font-semibold">
                        {e.role}{" "}
                        <span className="font-normal text-[#0E0B1F]/65">— {e.company}</span>
                      </p>
                      <p className="text-[11.5px] text-[#0E0B1F]/55 shrink-0">{e.dates}</p>
                    </div>
                    {e.location && (
                      <p className="text-[11.5px] text-[#0E0B1F]/55">{e.location}</p>
                    )}
                    <ul className="mt-1.5 space-y-1">
                      {e.bullets.map((b, j) => (
                        <li
                          key={j}
                          className="text-[12.5px] leading-[1.5] text-[#0E0B1F]/85 pl-3 relative"
                        >
                          <span className="absolute left-0 top-[9px] w-1 h-1 rounded-full bg-[#0E0B1F]/60" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* projects */}
          {enhancement.projects.length > 0 && (
            <Section title="Projects">
              <ul className="space-y-2.5">
                {enhancement.projects.map((p, i) => (
                  <li key={i}>
                    <p className="text-[13px] font-semibold">
                      {p.name}
                      {p.tech?.length ? (
                        <span className="ml-2 font-normal text-[11.5px] text-[#0E0B1F]/55">
                          {p.tech.join(", ")}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[12.5px] leading-[1.5] text-[#0E0B1F]/85">
                      {p.description}
                      {p.impact ? <span className="text-[#0E0B1F]/65"> — {p.impact}</span> : null}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* education */}
          {enhancement.education.length > 0 && (
            <Section title="Education">
              <ul className="space-y-2">
                {enhancement.education.map((e, i) => (
                  <li key={i}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13px] font-semibold">{e.degree}</p>
                      {e.dates && (
                        <p className="text-[11.5px] text-[#0E0B1F]/55 shrink-0">{e.dates}</p>
                      )}
                    </div>
                    <p className="text-[12.5px] text-[#0E0B1F]/70">{e.school}</p>
                    {e.detail && (
                      <p className="text-[11.5px] text-[#0E0B1F]/55">{e.detail}</p>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* achievements */}
          {enhancement.achievements.length > 0 && (
            <Section title="Achievements">
              <ul className="space-y-1">
                {enhancement.achievements.map((a, i) => (
                  <li
                    key={i}
                    className="text-[12.5px] leading-[1.5] text-[#0E0B1F]/85 pl-3 relative"
                  >
                    <span className="absolute left-0 top-[9px] w-1 h-1 rounded-full bg-[#0E0B1F]/60" />
                    {a}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-6">
    <h2 className="text-[10.5px] tracking-[0.22em] uppercase font-semibold text-[#0E0B1F]/55 border-b border-[#0E0B1F]/15 pb-1.5 mb-2.5">
      {title}
    </h2>
    {children}
  </section>
);

// --------- Serializers ---------

function toPlainText(e: Enhancement): string {
  const lines: string[] = [];
  const c = e.contact ?? {};
  if (c.name) lines.push(c.name.toUpperCase());
  if (e.headline) lines.push(e.headline);
  const meta = [c.location, c.email, c.phone, ...(c.links ?? []).map((l) => `${l.label}: ${l.url}`)]
    .filter(Boolean)
    .join("  |  ");
  if (meta) lines.push(meta);
  lines.push("");

  if (e.summary) {
    lines.push("SUMMARY");
    lines.push(e.summary);
    lines.push("");
  }

  if (e.skills?.length) {
    lines.push("SKILLS");
    e.skills.forEach((s) => lines.push(`${s.group}: ${s.items.join(", ")}`));
    lines.push("");
  }

  if (e.experience?.length) {
    lines.push("EXPERIENCE");
    e.experience.forEach((x) => {
      lines.push(`${x.role} — ${x.company}${x.location ? `, ${x.location}` : ""} (${x.dates})`);
      x.bullets.forEach((b) => lines.push(`  • ${b}`));
      lines.push("");
    });
  }

  if (e.projects?.length) {
    lines.push("PROJECTS");
    e.projects.forEach((p) => {
      lines.push(`${p.name}${p.tech?.length ? ` — ${p.tech.join(", ")}` : ""}`);
      lines.push(`  ${p.description}${p.impact ? ` Impact: ${p.impact}` : ""}`);
    });
    lines.push("");
  }

  if (e.education?.length) {
    lines.push("EDUCATION");
    e.education.forEach((ed) => {
      lines.push(`${ed.degree} — ${ed.school}${ed.dates ? ` (${ed.dates})` : ""}`);
      if (ed.detail) lines.push(`  ${ed.detail}`);
    });
    lines.push("");
  }

  if (e.achievements?.length) {
    lines.push("ACHIEVEMENTS");
    e.achievements.forEach((a) => lines.push(`  • ${a}`));
  }

  return lines.join("\n").trim();
}

function toMarkdown(e: Enhancement): string {
  const lines: string[] = [];
  const c = e.contact ?? {};
  if (c.name) lines.push(`# ${c.name}`);
  if (e.headline) lines.push(`*${e.headline}*`);
  const meta = [c.location, c.email, c.phone, ...(c.links ?? []).map((l) => `[${l.label}](${l.url})`)]
    .filter(Boolean)
    .join(" · ");
  if (meta) lines.push(meta);
  lines.push("");

  if (e.summary) {
    lines.push("## Summary");
    lines.push(e.summary);
    lines.push("");
  }
  if (e.skills?.length) {
    lines.push("## Skills");
    e.skills.forEach((s) => lines.push(`- **${s.group}:** ${s.items.join(", ")}`));
    lines.push("");
  }
  if (e.experience?.length) {
    lines.push("## Experience");
    e.experience.forEach((x) => {
      lines.push(`### ${x.role} — ${x.company}`);
      lines.push(`*${x.dates}${x.location ? ` · ${x.location}` : ""}*`);
      x.bullets.forEach((b) => lines.push(`- ${b}`));
      lines.push("");
    });
  }
  if (e.projects?.length) {
    lines.push("## Projects");
    e.projects.forEach((p) => {
      lines.push(`**${p.name}**${p.tech?.length ? ` — ${p.tech.join(", ")}` : ""}`);
      lines.push(`${p.description}${p.impact ? ` _${p.impact}_` : ""}`);
      lines.push("");
    });
  }
  if (e.education?.length) {
    lines.push("## Education");
    e.education.forEach((ed) => {
      lines.push(`**${ed.degree}** — ${ed.school}${ed.dates ? ` *(${ed.dates})*` : ""}`);
      if (ed.detail) lines.push(`  ${ed.detail}`);
    });
    lines.push("");
  }
  if (e.achievements?.length) {
    lines.push("## Achievements");
    e.achievements.forEach((a) => lines.push(`- ${a}`));
  }
  return lines.join("\n").trim();
}

// Maps a changelog category to the resume section it most affects.
const SECTION_FOR_CATEGORY: Record<string, "summary" | "skills" | "experience" | "projects" | "achievements" | "other"> = {
  summary: "summary",
  keyword_injection: "skills",
  metrics_added: "experience",
  verbs_strengthened: "experience",
  specificity: "experience",
  section_added: "achievements",
  ats_fix: "other",
  formatting: "other",
  grammar: "summary",
  other: "other",
};

const COMPARISON_ROWS: {
  key: "summary" | "skills" | "experience" | "projects" | "achievements";
  label: string;
  fallbackProblem: string;
  fallbackImprovement: (e: Enhancement) => string;
}[] = [
  {
    key: "summary",
    label: "Summary",
    fallbackProblem: "Generic wording with grammar and clarity issues.",
    fallbackImprovement: (e) =>
      e.summary
        ? `Rewritten as a role-specific opener: "${truncate(e.summary, 140)}"`
        : "Rewritten as a sharp, role-specific opener with one quantified headline.",
  },
  {
    key: "skills",
    label: "Skills",
    fallbackProblem: "Too basic — flat list, missing role-critical keywords.",
    fallbackImprovement: (e) => {
      const groups = e.skills?.length ?? 0;
      const total = e.skills?.reduce((n, s) => n + (s.items?.length ?? 0), 0) ?? 0;
      const added = e.added_keywords?.length ?? 0;
      return `Reorganized into ${groups} categorized clusters (${total} skills)${
        added ? ` and injected ${added} ATS-aligned keywords.` : "."
      }`;
    },
  },
  {
    key: "experience",
    label: "Experience",
    fallbackProblem: "Vague duties, weak verbs, no measurable impact.",
    fallbackImprovement: (e) => {
      const bullets = e.experience?.reduce((n, x) => n + (x.bullets?.length ?? 0), 0) ?? 0;
      return `Rewrote ${bullets} bullet${bullets === 1 ? "" : "s"} with strong action verbs and quantified outcomes.`;
    },
  },
  {
    key: "projects",
    label: "Projects",
    fallbackProblem: "Weak explanation — what you built was unclear.",
    fallbackImprovement: (e) => {
      const count = e.projects?.length ?? 0;
      if (!count) return "Added impact-focused descriptions with tech stack and outcomes.";
      return `Rewrote ${count} project${count === 1 ? "" : "s"} with impact-focused wording, tech stack, and outcomes.`;
    },
  },
  {
    key: "achievements",
    label: "Achievements",
    fallbackProblem: "Unclear or missing — recruiters skipped this section.",
    fallbackImprovement: (e) => {
      const count = e.achievements?.length ?? 0;
      if (!count) return "Surfaced concrete, measurable wins worth highlighting.";
      return `Highlighted ${count} measurable achievement${count === 1 ? "" : "s"} with specifics.`;
    },
  },
];

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1).trim()}…` : s;
}

const ComparisonTable = ({ enhancement }: { enhancement: Enhancement }) => {
  // Index changelog entries by section
  const bySection = new Map<string, { title: string; detail: string }[]>();
  enhancement.changelog.forEach((c) => {
    const sec = SECTION_FOR_CATEGORY[c.category] ?? "other";
    if (!bySection.has(sec)) bySection.set(sec, []);
    bySection.get(sec)!.push({ title: c.title, detail: c.detail });
  });

  return (
    <SectionCard>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
            Original vs Enhanced
          </p>
          <p className="mt-1.5 text-[14px] text-foreground/75 tracking-tight max-w-xl">
            Section-by-section breakdown of what was holding your resume back — and how we fixed it.
          </p>
        </div>
      </div>

      {/* Header row */}
      <div className="mt-5 hidden md:grid grid-cols-[120px_1fr_1fr] gap-3 px-3 pb-2 border-b border-foreground/[0.06]">
        <span className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/40 font-medium">Section</span>
        <span className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/40 font-medium">
          Original problem
        </span>
        <span className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/40 font-medium">
          AI improvement
        </span>
      </div>

      <ul className="mt-2 divide-y divide-foreground/[0.05]">
        {COMPARISON_ROWS.map((row) => {
          const changes = bySection.get(row.key) ?? [];
          const problem = changes[0]?.title ?? row.fallbackProblem;
          const improvement = row.fallbackImprovement(enhancement);
          return (
            <li
              key={row.key}
              className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr] gap-x-3 gap-y-2 px-3 py-3.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold tracking-tight text-foreground">{row.label}</span>
                {changes.length > 1 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/[0.06] text-foreground/55 tracking-tight">
                    {changes.length} fixes
                  </span>
                )}
              </div>
              <div className="flex items-start gap-2">
                <span className="md:hidden text-[10px] tracking-[0.18em] uppercase text-foreground/40 font-medium pt-0.5 shrink-0">
                  Before
                </span>
                <p className="text-[12.5px] leading-[1.55] text-foreground/65 tracking-tight">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(0_70%_55%/0.55)] mr-2 align-middle" />
                  {problem}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="md:hidden text-[10px] tracking-[0.18em] uppercase text-foreground/40 font-medium pt-0.5 shrink-0">
                  After
                </span>
                <p className="text-[12.5px] leading-[1.55] text-foreground tracking-tight">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(150_55%_45%)] mr-2 align-middle" />
                  {improvement}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
};

