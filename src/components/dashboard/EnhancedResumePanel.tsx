import { useEffect, useMemo, useState } from "react";
import { Sparkles, RefreshCw, Wand2, Pencil, Maximize2, Minimize2 } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { ResumeEditor, type EditableResume } from "./ResumeEditor";
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
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [customRole, setCustomRole] = useState("");
  

  // Load latest enhancement for this resume
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!resumeId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("resume_enhancements")
        .select("*")
        .eq("resume_id", resumeId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (cancelled) return;
      setEnhancement(((data ?? [])[0] as unknown as Enhancement) ?? null);
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

  return (
    <EnhancedResumeView
      enhancement={enhancement}
      className={className}
      pages={pages}
      onPagesChange={setPages}
      onRegenerate={() => handleGenerate()}
      regenerating={generating}
    />
  );
};

// Adapter: Enhancement (DB shape) → EditableResume (editor shape)
const toEditable = (e: Enhancement): EditableResume => ({
  contact: {
    name: e.contact?.name ?? "",
    location: e.contact?.location ?? "",
    email: e.contact?.email ?? "",
    phone: e.contact?.phone ?? "",
    links: (e.contact?.links ?? []).map((l) => ({ label: l.label ?? "", url: l.url ?? "" })),
  },
  headline: e.headline ?? "",
  summary: e.summary ?? "",
  skills: (e.skills ?? []).map((s) => ({ group: s.group, items: s.items ?? [] })),
  experience: (e.experience ?? []).map((x) => ({
    role: x.role ?? "",
    company: x.company ?? "",
    location: x.location ?? "",
    dates: x.dates ?? "",
    bullets: x.bullets ?? [],
  })),
  projects: (e.projects ?? []).map((p) => ({
    name: p.name ?? "",
    description: p.description ?? "",
    tech: p.tech ?? [],
    impact: p.impact ?? "",
  })),
  education: (e.education ?? []).map((ed) => ({
    degree: ed.degree ?? "",
    school: ed.school ?? "",
    dates: ed.dates ?? "",
    detail: ed.detail ?? "",
  })),
  achievements: e.achievements ?? [],
});

const EnhancedResumeView = ({
  enhancement,
  className,
  pages,
  onPagesChange,
  onRegenerate,
  regenerating,
}: {
  enhancement: Enhancement;
  className?: string;
  pages: 1 | 2 | 3;
  onPagesChange: (n: 1 | 2 | 3) => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const editable = useMemo(() => toEditable(enhancement), [enhancement]);

  // Esc closes fullscreen + lock body scroll
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  if (editing) {
    return (
      <div className={cn("space-y-4", className)}>
        <ResumeEditor initial={editable} onClose={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <SectionCard className="!p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
              Enhanced resume
            </p>
            <p className="mt-1 text-[12.5px] text-foreground/55 tracking-tight">
              Tap edit to refine, change length to regenerate, or open full screen.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {/* Page-length selector */}
            <div className="inline-flex items-center rounded-lg border border-foreground/[0.1] bg-foreground/[0.03] p-0.5">
              {([1, 2, 3] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => onPagesChange(n)}
                  disabled={regenerating}
                  className={cn(
                    "px-2.5 py-1 text-[11.5px] font-medium tracking-tight rounded-md transition-colors",
                    pages === n
                      ? "bg-foreground text-background"
                      : "text-foreground/65 hover:text-foreground",
                  )}
                  title={`${n} page${n > 1 ? "s" : ""}`}
                >
                  {n}p
                </button>
              ))}
            </div>
            <button
              onClick={onRegenerate}
              disabled={regenerating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1.5 text-[12px] font-medium tracking-tight text-foreground/80 hover:bg-foreground/[0.06] transition-colors disabled:opacity-50"
              title="Regenerate at the selected length"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", regenerating && "animate-spin")} />
              {regenerating ? "Rewriting…" : "Regenerate"}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1.5 text-[12px] font-medium tracking-tight text-foreground/80 hover:bg-foreground/[0.06] transition-colors"
              title="Edit resume"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={() => setFullscreen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1.5 text-[12px] font-medium tracking-tight text-foreground/80 hover:bg-foreground/[0.06] transition-colors"
              title="Open full screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Full screen
            </button>
          </div>
        </div>

        <div className="border-t border-foreground/[0.06]">
          <ResumeDocument enhancement={enhancement} />
        </div>
      </SectionCard>

      {/* Fullscreen preview */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-2.5 border-b border-foreground/[0.08] bg-background/80">
            <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/55 font-medium">
              Enhanced resume — full screen
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setFullscreen(false);
                  setEditing(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1.5 text-[12px] font-medium tracking-tight text-foreground/80 hover:bg-foreground/[0.06] transition-colors"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => setFullscreen(false)}
                className="inline-flex items-center gap-1.5 rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1.5 text-[12px] font-medium tracking-tight text-foreground/80 hover:bg-foreground/[0.06] transition-colors"
                title="Exit full screen (Esc)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                Exit
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto py-8 px-4">
            <div className="mx-auto max-w-[820px] bg-white rounded-lg shadow-sm overflow-hidden">
              <ResumeDocument enhancement={enhancement} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ResumeDocument = ({ enhancement }: { enhancement: Enhancement }) => (
  <div className="px-7 sm:px-10 py-9 bg-white text-[#0E0B1F] font-serif">
    {/* header */}
    <div className="text-center">
      <h1 className="text-[26px] font-semibold tracking-[-0.02em]">
        {enhancement.contact?.name ?? "Your name"}
      </h1>
      {enhancement.headline && (
        <p className="mt-1 text-[14px] text-[#0E0B1F]/70 tracking-tight">{enhancement.headline}</p>
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

    {enhancement.summary && (
      <Section title="Summary">
        <p className="text-[13px] leading-[1.55] text-[#0E0B1F]/85">{enhancement.summary}</p>
      </Section>
    )}

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

    {enhancement.experience.length > 0 && (
      <Section title="Experience">
        <ul className="space-y-4">
          {enhancement.experience.map((e, i) => (
            <li key={i}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13.5px] font-semibold">
                  {e.role} <span className="font-normal text-[#0E0B1F]/65">— {e.company}</span>
                </p>
                <p className="text-[11.5px] text-[#0E0B1F]/55 shrink-0">{e.dates}</p>
              </div>
              {e.location && <p className="text-[11.5px] text-[#0E0B1F]/55">{e.location}</p>}
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

    {enhancement.education.length > 0 && (
      <Section title="Education">
        <ul className="space-y-2">
          {enhancement.education.map((e, i) => (
            <li key={i}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-semibold">{e.degree}</p>
                {e.dates && <p className="text-[11.5px] text-[#0E0B1F]/55 shrink-0">{e.dates}</p>}
              </div>
              <p className="text-[12.5px] text-[#0E0B1F]/70">{e.school}</p>
              {e.detail && <p className="text-[11.5px] text-[#0E0B1F]/55">{e.detail}</p>}
            </li>
          ))}
        </ul>
      </Section>
    )}

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
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-6">
    <h2 className="text-[10.5px] tracking-[0.22em] uppercase font-semibold text-[#0E0B1F]/55 border-b border-[#0E0B1F]/15 pb-1.5 mb-2.5">
      {title}
    </h2>
    {children}
  </section>
);

