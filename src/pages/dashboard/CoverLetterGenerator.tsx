import { useEffect, useMemo, useState } from "react";
import { Sparkles, Loader2, Copy, Check, Trash2, FileText, Target, Globe, FileCheck2, Award, Zap } from "lucide-react";
import { toast } from "sonner";
import { SegmentedTabs } from "@/components/dashboard/SegmentedTabs";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Tone = "confident" | "warm" | "direct" | "formal";
type Length = "short" | "medium" | "detailed";
type ExperienceLevel = "fresher" | "intern" | "junior" | "experienced";
type LetterStyle = "modern" | "formal" | "startup" | "corporate";

const LENGTHS: { value: Length; label: string; hint: string }[] = [
  { value: "short", label: "Short", hint: "~150 words" },
  { value: "medium", label: "Medium", hint: "~250 words" },
  { value: "detailed", label: "Detailed", hint: "~350 words" },
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "fresher", label: "Fresher" },
  { value: "intern", label: "Intern" },
  { value: "junior", label: "Junior" },
  { value: "experienced", label: "Experienced" },
];

const LETTER_STYLES: { value: LetterStyle; label: string; hint: string }[] = [
  { value: "modern", label: "Modern", hint: "Clean & current" },
  { value: "formal", label: "Formal", hint: "Traditional polish" },
  { value: "startup", label: "Startup", hint: "Scrappy & punchy" },
  { value: "corporate", label: "Corporate", hint: "Buttoned-up" },
];

type Letter = {
  id: string;
  resume_id: string | null;
  company: string;
  role: string;
  company_url: string | null;
  company_mission: string | null;
  job_description: string | null;
  tone: Tone;
  hook: string | null;
  alignment: string | null;
  proof: string | null;
  culture_fit: string | null;
  closing: string | null;
  full_letter: string;
  notes: string | null;
  jd_keywords: string[] | null;
  matched_keywords: string[] | null;
  missing_keywords: string[] | null;
  resume_skills: string[] | null;
  match_score: number | null;
  created_at: string;
};

const TONES: { value: Tone; label: string; hint: string }[] = [
  { value: "confident", label: "Confident", hint: "Clear, direct, slightly bold" },
  { value: "warm", label: "Warm", hint: "Personable and conversational" },
  { value: "direct", label: "Direct", hint: "Short sentences, no fluff" },
  { value: "formal", label: "Formal", hint: "Polished, executive tone" },
];

const SECTION_DEFS: { key: keyof Pick<Letter, "hook" | "alignment" | "proof" | "culture_fit" | "closing">; label: string; helper: string }[] = [
  { key: "hook", label: "Hook", helper: "Strong opening — never starts with 'I'." },
  { key: "alignment", label: "Skill alignment", helper: "Skills mapped to the JD." },
  { key: "proof", label: "Achievement proof", helper: "One concrete result with a metric." },
  { key: "culture_fit", label: "Culture fit", helper: "Why this candidate fits THIS company." },
  { key: "closing", label: "Confident closing", helper: "Suggests a next step." },
];

const CoverLetterGenerator = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("compose");
  const [letters, setLetters] = useState<Letter[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [resumeMeta, setResumeMeta] = useState<{
    name: string | null;
    fileName: string | null;
    strengths: string[];
    bestAchievement: string | null;
  }>({ name: null, fileName: null, strengths: [], bestAchievement: null });

  // form
  const [company, setCompany] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [role, setRole] = useState("");
  const [tone, setTone] = useState<Tone>("confident");
  const [jd, setJd] = useState("");
  const [hiringManager, setHiringManager] = useState("");
  const [strongestAchievement, setStrongestAchievement] = useState("");
  const [length, setLength] = useState<Length>("medium");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("junior");
  const [letterStyle, setLetterStyle] = useState<LetterStyle>("modern");
  const [includeSalary, setIncludeSalary] = useState(false);
  const [salaryExpectation, setSalaryExpectation] = useState("");
  const [mentionRelocation, setMentionRelocation] = useState(false);
  const [relocationPreference, setRelocationPreference] = useState<"remote" | "relocate" | "hybrid" | "onsite">("remote");

  const tabs = [
    { value: "compose", label: "Compose" },
    { value: "history", label: "History", count: letters.length || undefined },
  ];

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: l }, { data: r }, { data: profile }] = await Promise.all([
        supabase
          .from("cover_letters")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("resumes")
          .select("id, file_name")
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      setLetters((l ?? []) as unknown as Letter[]);
      if (l?.[0]) setActiveId(l[0].id);
      if (r?.[0]) {
        setResumeId(r[0].id);
        setHasResume(true);

        // Fetch latest analysis for this resume to extract strengths + best achievement
        const { data: analysis } = await supabase
          .from("resume_analyses")
          .select("strengths, bullet_rewrites, extracted")
          .eq("resume_id", r[0].id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const strengthsRaw = (analysis?.strengths ?? []) as unknown[];
        const strengths = strengthsRaw
          .map((s) => (typeof s === "string" ? s : (s as { text?: string; title?: string; label?: string })?.text ?? (s as { title?: string }).title ?? (s as { label?: string }).label))
          .filter((s): s is string => typeof s === "string" && s.length > 0)
          .slice(0, 5);

        // Best achievement: prefer first bullet_rewrite "after", else first strength, else null
        const rewrites = (analysis?.bullet_rewrites ?? []) as Array<{ after?: string; rewrite?: string; text?: string }>;
        const bestAchievement =
          rewrites.find((b) => b?.after)?.after ??
          rewrites.find((b) => b?.rewrite)?.rewrite ??
          rewrites.find((b) => b?.text)?.text ??
          strengths[0] ??
          null;

        const extracted = (analysis?.extracted ?? {}) as { name?: string; full_name?: string; contact?: { name?: string } };
        const extractedName = extracted.name ?? extracted.full_name ?? extracted.contact?.name ?? null;

        setResumeMeta({
          name: profile?.display_name ?? extractedName ?? null,
          fileName: r[0].file_name ?? null,
          strengths,
          bestAchievement,
        });
      }
    })();
  }, [user?.id]);

  const active = useMemo(
    () => letters.find((l) => l.id === activeId) ?? letters[0],
    [letters, activeId],
  );

  const refresh = async () => {
    const { data } = await supabase
      .from("cover_letters")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setLetters((data ?? []) as unknown as Letter[]);
  };

  const generate = async () => {
    if (!company.trim() || role.trim().length < 2) {
      toast.error("Add a company and role first.");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-cover-letter", {
        body: {
          company: company.trim(),
          company_url: companyUrl.trim() || undefined,
          role: role.trim(),
          tone,
          job_description: jd.trim() || undefined,
          resume_id: resumeId ?? undefined,
          hiring_manager: hiringManager.trim() || undefined,
          strongest_achievement: strongestAchievement.trim() || undefined,
          length,
          experience_level: experienceLevel,
          letter_style: letterStyle,
          include_salary: includeSalary,
          salary_expectation: includeSalary ? salaryExpectation.trim() || undefined : undefined,
          mention_relocation: mentionRelocation,
          relocation_preference: mentionRelocation ? relocationPreference : undefined,
        },
      });
      if (error) throw new Error(error.message || "Generation failed");
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      const id = (data as { letter?: Letter })?.letter?.id;
      if (id) setActiveId(id);
      await refresh();
      toast.success("Cover letter ready.");
      setTab("compose");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("cover_letters").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete");
      return;
    }
    if (activeId === id) setActiveId(null);
    refresh();
  };

  const copy = async (text: string, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <p className="text-[10.5px] tracking-[0.22em] uppercase text-foreground/40 font-medium">
        Cover Letter Generator
      </p>
      <h1 className="mt-2 text-[36px] sm:text-[44px] leading-[1.04] font-semibold tracking-[-0.035em] text-foreground">
        One letter, perfectly{" "}
        <span
          style={{
            background: "linear-gradient(120deg,#0E0B1F,#6D54B3,#0E0B1F)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          tuned
        </span>
        .
      </h1>
      <p className="mt-3 text-[14px] text-foreground/60 tracking-tight max-w-2xl">
        No "I am writing to apply for…". Every letter is structured into a hook, skill alignment,
        a real achievement, culture fit, and a confident close.
      </p>

      <div className="mt-6">
        <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />
      </div>

      {tab === "compose" && (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Composer */}
          <SectionCard className="lg:col-span-5 p-0 overflow-hidden">
            <div className="px-5 sm:px-6 pt-5 pb-4">
              <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                Compose
              </p>
              <p className="mt-1 text-[12.5px] text-foreground/55 tracking-tight">
                {hasResume
                  ? "Using your latest uploaded resume for real achievements."
                  : "Tip: upload a resume first for proof statements with real metrics."}
              </p>
            </div>

            <div className="border-t border-foreground/[0.06] px-5 sm:px-6 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Company"
                  value={company}
                  onChange={setCompany}
                  placeholder="Linear"
                  disabled={generating}
                />
                <Field
                  label="Role"
                  value={role}
                  onChange={setRole}
                  placeholder="Senior PM"
                  disabled={generating}
                />
              </div>

              <Field
                label="Company URL (optional)"
                value={companyUrl}
                onChange={setCompanyUrl}
                placeholder="linear.app"
                disabled={generating}
              />
              <p className="-mt-2 text-[11px] text-foreground/45 tracking-tight flex items-center gap-1">
                <Globe className="w-3 h-3" />
                We'll pull the company mission for sharper culture-fit matching.
              </p>

              <div>
                <label className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                  Tone
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      disabled={generating}
                      onClick={() => setTone(t.value)}
                      className={cn(
                        "rounded-lg px-2.5 py-2 text-left transition-colors border",
                        tone === t.value
                          ? "bg-foreground text-background border-foreground"
                          : "bg-foreground/[0.03] border-foreground/[0.06] hover:bg-foreground/[0.06]",
                      )}
                    >
                      <p className="text-[12.5px] font-medium tracking-tight">{t.label}</p>
                      <p
                        className={cn(
                          "text-[11px] tracking-tight",
                          tone === t.value ? "text-background/60" : "text-foreground/50",
                        )}
                      >
                        {t.hint}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <Field
                label="Hiring manager (optional)"
                value={hiringManager}
                onChange={setHiringManager}
                placeholder="e.g. Priya Shah"
                disabled={generating}
              />

              <div>
                <label className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                  Your strongest achievement (optional)
                </label>
                <textarea
                  value={strongestAchievement}
                  onChange={(e) => setStrongestAchievement(e.target.value)}
                  rows={2}
                  disabled={generating}
                  placeholder="e.g. Led a launch that grew weekly active users 38% in 6 weeks."
                  className="mt-1.5 w-full bg-foreground/[0.03] border border-foreground/[0.06] rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-foreground/35 outline-none focus:border-foreground/20 transition-colors resize-none"
                />
                <p className="mt-1 text-[11px] text-foreground/45 tracking-tight">
                  We'll feature this as the proof paragraph if it's strong.
                </p>
              </div>

              <div>
                <label className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                  Length
                </label>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  {LENGTHS.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      disabled={generating}
                      onClick={() => setLength(l.value)}
                      className={cn(
                        "rounded-lg px-2.5 py-2 text-left transition-colors border",
                        length === l.value
                          ? "bg-foreground text-background border-foreground"
                          : "bg-foreground/[0.03] border-foreground/[0.06] hover:bg-foreground/[0.06]",
                      )}
                    >
                      <p className="text-[12.5px] font-medium tracking-tight">{l.label}</p>
                      <p
                        className={cn(
                          "text-[11px] tracking-tight",
                          length === l.value ? "text-background/60" : "text-foreground/50",
                        )}
                      >
                        {l.hint}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                  Experience level
                </label>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                  {EXPERIENCE_LEVELS.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      disabled={generating}
                      onClick={() => setExperienceLevel(l.value)}
                      className={cn(
                        "rounded-lg px-2 py-2 text-center transition-colors border text-[12px] font-medium tracking-tight",
                        experienceLevel === l.value
                          ? "bg-foreground text-background border-foreground"
                          : "bg-foreground/[0.03] border-foreground/[0.06] hover:bg-foreground/[0.06] text-foreground/75",
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                  Letter style
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {LETTER_STYLES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      disabled={generating}
                      onClick={() => setLetterStyle(s.value)}
                      className={cn(
                        "rounded-lg px-2.5 py-2 text-left transition-colors border",
                        letterStyle === s.value
                          ? "bg-foreground text-background border-foreground"
                          : "bg-foreground/[0.03] border-foreground/[0.06] hover:bg-foreground/[0.06]",
                      )}
                    >
                      <p className="text-[12.5px] font-medium tracking-tight">{s.label}</p>
                      <p
                        className={cn(
                          "text-[11px] tracking-tight",
                          letterStyle === s.value ? "text-background/60" : "text-foreground/50",
                        )}
                      >
                        {s.hint}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-foreground/[0.06] bg-foreground/[0.02] p-3 space-y-3">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-[12.5px] font-medium tracking-tight text-foreground">
                    Include salary expectation
                  </span>
                  <input
                    type="checkbox"
                    checked={includeSalary}
                    onChange={(e) => setIncludeSalary(e.target.checked)}
                    disabled={generating}
                    className="h-4 w-4 accent-foreground"
                  />
                </label>
                {includeSalary && (
                  <input
                    type="text"
                    value={salaryExpectation}
                    onChange={(e) => setSalaryExpectation(e.target.value)}
                    disabled={generating}
                    placeholder="e.g. ₹18–22 LPA or $120k–$140k"
                    className="w-full bg-background border border-foreground/[0.08] rounded-md px-3 py-2 text-[13px] text-foreground placeholder:text-foreground/35 outline-none focus:border-foreground/20 transition-colors"
                  />
                )}

                <div className="border-t border-foreground/[0.06]" />

                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-[12.5px] font-medium tracking-tight text-foreground">
                    Mention relocation / remote preference
                  </span>
                  <input
                    type="checkbox"
                    checked={mentionRelocation}
                    onChange={(e) => setMentionRelocation(e.target.checked)}
                    disabled={generating}
                    className="h-4 w-4 accent-foreground"
                  />
                </label>
                {mentionRelocation && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["remote", "hybrid", "onsite", "relocate"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        disabled={generating}
                        onClick={() => setRelocationPreference(p)}
                        className={cn(
                          "rounded-md px-2 py-1.5 text-center transition-colors border text-[11.5px] font-medium tracking-tight capitalize",
                          relocationPreference === p
                            ? "bg-foreground text-background border-foreground"
                            : "bg-background border-foreground/[0.08] hover:bg-foreground/[0.06] text-foreground/75",
                        )}
                      >
                        {p === "relocate" ? "Open to relocate" : p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                  Job description (optional)
                </label>
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  rows={5}
                  disabled={generating}
                  placeholder="Paste the JD for sharper alignment + culture fit."
                  className="mt-1.5 w-full bg-foreground/[0.03] border border-foreground/[0.06] rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-foreground/35 outline-none focus:border-foreground/20 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="border-t border-foreground/[0.06] px-5 sm:px-6 py-3 flex items-center justify-end">
              <button
                type="button"
                onClick={generate}
                disabled={generating}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-medium tracking-tight transition-opacity",
                  "bg-foreground text-background hover:opacity-90 disabled:opacity-50",
                )}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Writing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate letter
                  </>
                )}
              </button>
            </div>
          </SectionCard>

          {/* Result */}
          <div className="lg:col-span-7 space-y-4">
            {active ? (
              <>
                <SectionCard>
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                        {active.company} · {active.role}
                      </p>
                      <p className="mt-1 text-[11px] text-foreground/45 tracking-tight">
                        {TONES.find((t) => t.value === active.tone)?.label ?? active.tone} tone ·{" "}
                        {new Date(active.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyBtn onClick={() => copy(active.full_letter, "Letter copied")} label="Copy letter" />
                      <button
                        type="button"
                        onClick={() => remove(active.id)}
                        className="text-foreground/40 hover:text-foreground/80 transition-colors"
                        aria-label="Delete letter"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {active.notes && (
                    <p className="mt-3 text-[12.5px] text-foreground/65 tracking-tight leading-snug">
                      {active.notes}
                    </p>
                  )}
                  <HighlightedLetter
                    text={active.full_letter}
                    keywords={active.matched_keywords ?? []}
                  />
                </SectionCard>

                <PersonalizationCard letter={active} />

                <SectionCard className="p-0 overflow-hidden">
                  <div className="px-5 sm:px-6 pt-5 pb-3">
                    <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                      Section breakdown
                    </p>
                    <p className="text-[12.5px] text-foreground/55 tracking-tight mt-1">
                      The five parts that make this letter work.
                    </p>
                  </div>
                  <ul className="border-t border-foreground/[0.06] divide-y divide-foreground/[0.06]">
                    {SECTION_DEFS.map((s, i) => {
                      const text = (active[s.key] as string | null) ?? "";
                      if (!text) return null;
                      return (
                        <li key={s.key} className="px-5 sm:px-6 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[11px] font-medium text-foreground/55 tracking-tight">
                              <span className="text-foreground/35 tabular-nums mr-1.5">
                                0{i + 1}
                              </span>
                              {s.label}
                            </p>
                            <CopyBtn onClick={() => copy(text, `${s.label} copied`)} />
                          </div>
                          <p className="mt-1 text-[11px] text-foreground/45 tracking-tight">
                            {s.helper}
                          </p>
                          <p className="mt-2 text-[13.5px] leading-[1.55] text-foreground tracking-tight">
                            {text}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </SectionCard>
              </>
            ) : (
              <LivePreviewSkeleton
                company={company}
                role={role}
                tone={tone}
                hasJd={jd.trim().length > 0}
                hasResume={hasResume}
              />
            )}
          </div>
        </div>
      )}

      {tab === "history" && (
        <SectionCard className="mt-5 p-0 overflow-hidden">
          <ul className="divide-y divide-foreground/[0.06]">
            {letters.map((l) => (
              <li key={l.id} className="px-5 py-4 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium tracking-tight">
                    {l.company} <span className="text-foreground/55 font-normal">· {l.role}</span>
                  </p>
                  <p className="text-[11.5px] text-foreground/50 tracking-tight">
                    {TONES.find((t) => t.value === l.tone)?.label ?? l.tone} ·{" "}
                    {new Date(l.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(l.id);
                    setTab("compose");
                  }}
                  className="text-[12px] px-3 py-1.5 rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] text-foreground/75 tracking-tight transition-colors"
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => remove(l.id)}
                  className="text-foreground/40 hover:text-foreground/80 transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
            {!letters.length && (
              <li className="px-5 py-6 text-[13px] text-foreground/55">
                No letters yet. Generate one in the Compose tab.
              </li>
            )}
          </ul>
        </SectionCard>
      )}
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => (
  <div>
    <label className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="mt-1.5 w-full bg-foreground/[0.03] border border-foreground/[0.06] rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-foreground/35 outline-none focus:border-foreground/20 transition-colors"
    />
  </div>
);

const CopyBtn = ({ onClick, label = "Copy" }: { onClick: () => void; label?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        onClick();
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] text-foreground/70 text-[11px] tracking-tight transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : label}
    </button>
  );
};

// Looser matcher used only for visual highlighting in the rendered letter.
// Matches the keyword + simple plural/verb variants (s, es, ed, ing, ies/y, etc.)
// so the highlights line up with the smarter backend match.
const HighlightedLetter = ({ text, keywords }: { text: string; keywords: string[] }) => {
  if (!text) return null;
  if (!keywords.length) {
    return (
      <pre className="mt-4 whitespace-pre-wrap font-sans text-[14px] leading-[1.65] text-foreground tracking-tight">
        {text}
      </pre>
    );
  }
  const esc = (k: string) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const buildPattern = (raw: string) => {
    const k = raw.trim();
    if (!k) return null;
    // Multi-word keywords: tolerate spaces/hyphens/slashes between words and
    // simple plural/verb suffixes on the LAST word.
    if (/\s/.test(k)) {
      const words = k.split(/\s+/).map(esc);
      const last = words.pop()!;
      const lastWithSuffix = `${last}(?:s|es|ed|ing|ies)?`;
      return [...words, lastWithSuffix].join("[\\s\\-/]+");
    }
    // Single token: also match common suffixes; preserve special chars (e.g. C++, .NET).
    return `${esc(k)}(?:s|es|ed|ing|ies)?`;
  };
  const patterns = [...keywords]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map(buildPattern)
    .filter((p): p is string => !!p);
  if (!patterns.length) {
    return (
      <pre className="mt-4 whitespace-pre-wrap font-sans text-[14px] leading-[1.65] text-foreground tracking-tight">
        {text}
      </pre>
    );
  }
  const re = new RegExp(`\\b(${patterns.join("|")})\\b`, "gi");
  const parts = text.split(re);
  return (
    <pre className="mt-4 whitespace-pre-wrap font-sans text-[14px] leading-[1.65] text-foreground tracking-tight">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="bg-foreground/[0.08] text-foreground rounded px-0.5 py-px font-medium"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </pre>
  );
};

const PersonalizationCard = ({ letter }: { letter: Letter }) => {
  const matched = letter.matched_keywords ?? [];
  const missing = letter.missing_keywords ?? [];
  const total = (letter.jd_keywords ?? []).length;
  const score = letter.match_score;
  if (!total && !letter.company_mission) return null;

  return (
    <SectionCard className="p-0 overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium flex items-center gap-1.5">
            <Target className="w-3 h-3" />
            Personalization
          </p>
          {total > 0 && (
            <p className="mt-1.5 text-[14px] text-foreground tracking-tight leading-snug">
              Your cover letter includes{" "}
              <span className="font-semibold">{matched.length}</span> of{" "}
              <span className="font-semibold">{total}</span> keywords from the job description.
            </p>
          )}
          {letter.company_mission && (
            <p className="mt-1 text-[12px] text-foreground/55 tracking-tight">
              Aligned to {letter.company}'s mission{letter.company_url ? ` (${new URL(letter.company_url).hostname})` : ""}.
            </p>
          )}
        </div>
        {score !== null && score !== undefined && (
          <div
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold tracking-tight tabular-nums",
              score >= 70
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : score >= 40
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "bg-foreground/[0.06] text-foreground/70",
            )}
          >
            {score}% match
          </div>
        )}
      </div>

      {(matched.length > 0 || missing.length > 0) && (
        <div className="border-t border-foreground/[0.06] px-5 sm:px-6 py-4 space-y-3">
          {matched.length > 0 && (
            <div>
              <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                Covered ({matched.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {matched.map((k) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11.5px] tracking-tight"
                  >
                    <Check className="w-2.5 h-2.5" />
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          {missing.length > 0 && (
            <div>
              <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                Missing ({missing.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {missing.map((k) => (
                  <span
                    key={k}
                    className="px-2 py-0.5 rounded-full bg-foreground/[0.05] text-foreground/65 text-[11.5px] tracking-tight"
                  >
                    {k}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11.5px] text-foreground/50 tracking-tight">
                Tip: weave a few of these in to lift the match score.
              </p>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
};

const PREVIEW_PARTS: { key: string; label: string; helper: string; sample: (ctx: { company: string; role: string }) => string }[] = [
  {
    key: "hook",
    label: "Opening hook",
    helper: "A sharp first line — never starts with 'I'.",
    sample: ({ company }) =>
      `${company || "Your company"}'s recent work on shipping fast without breaking trust is exactly the kind of problem worth solving — and the kind I've been quietly preparing for.`,
  },
  {
    key: "culture",
    label: "Why this company",
    helper: "A specific, non-generic reason this company fits.",
    sample: ({ company }) =>
      `What pulls me toward ${company || "your team"} isn't the brand — it's the mission, and the way the team treats craft as a competitive advantage rather than a checkbox.`,
  },
  {
    key: "alignment",
    label: "Skills match",
    helper: "2–3 of your skills mapped directly to the JD.",
    sample: ({ role }) =>
      `For the ${role || "role"}, I'd bring hands-on experience with the exact stack and workflow you described — turning ambiguous problems into shipped, measurable outcomes.`,
  },
  {
    key: "proof",
    label: "Achievement proof",
    helper: "One concrete result with a real metric from your resume.",
    sample: () =>
      `In my last role, I led a project that cut a key workflow from 4 hours to 22 minutes and unlocked ~$120K/year in saved engineering time — the kind of impact I'd repeat here.`,
  },
  {
    key: "closing",
    label: "Closing paragraph",
    helper: "Confident close that suggests a next step.",
    sample: ({ company }) =>
      `Happy to walk through any of this in more depth — would love 20 minutes with the ${company || "team"} to dig into where I'd add the most value first.`,
  },
];

const LivePreviewSkeleton = ({
  company,
  role,
  tone,
  hasJd,
  hasResume,
}: {
  company: string;
  role: string;
  tone: Tone;
  hasJd: boolean;
  hasResume: boolean;
}) => {
  const ctx = { company: company.trim(), role: role.trim() };
  const toneLabel = TONES.find((t) => t.value === tone)?.label ?? "Confident";
  return (
    <SectionCard className="p-0 overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
            Live preview
          </p>
          <p className="mt-1.5 text-[14px] text-foreground tracking-tight leading-snug">
            Here's the structure your letter will follow.
          </p>
          <p className="mt-1 text-[12px] text-foreground/55 tracking-tight">
            {toneLabel} tone · {hasResume ? "real metrics from your resume" : "upload a resume for proof statements"}
            {hasJd ? " · keyword-aligned to your JD" : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-full px-2.5 py-1 bg-foreground/[0.05] text-foreground/55 text-[10.5px] tracking-[0.18em] uppercase font-medium">
          Sample
        </span>
      </div>
      <ul className="border-t border-foreground/[0.06] divide-y divide-foreground/[0.06]">
        {PREVIEW_PARTS.map((p, i) => (
          <li key={p.key} className="px-5 sm:px-6 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[11px] font-medium text-foreground/55 tracking-tight">
                <span className="text-foreground/35 tabular-nums mr-1.5">0{i + 1}</span>
                {p.label}
              </p>
              <p className="text-[10.5px] text-foreground/40 tracking-tight hidden sm:block">{p.helper}</p>
            </div>
            <p className="mt-2 text-[13.5px] leading-[1.6] text-foreground/55 tracking-tight italic">
              {p.sample(ctx)}
            </p>
          </li>
        ))}
      </ul>
      <div className="border-t border-foreground/[0.06] px-5 sm:px-6 py-3 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-foreground/45" />
        <p className="text-[11.5px] text-foreground/55 tracking-tight">
          Fill in the form and hit Generate — these placeholders will be replaced with your real, personalized letter.
        </p>
      </div>
    </SectionCard>
  );
};

export default CoverLetterGenerator;
