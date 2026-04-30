import { useEffect, useMemo, useState } from "react";
import { Sparkles, Loader2, Copy, Check, Trash2, FileText, Target, Globe } from "lucide-react";
import { toast } from "sonner";
import { SegmentedTabs } from "@/components/dashboard/SegmentedTabs";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Tone = "confident" | "warm" | "direct" | "formal";

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

  // form
  const [company, setCompany] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [role, setRole] = useState("");
  const [tone, setTone] = useState<Tone>("confident");
  const [jd, setJd] = useState("");

  const tabs = [
    { value: "compose", label: "Compose" },
    { value: "history", label: "History", count: letters.length || undefined },
  ];

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: l }, { data: r }] = await Promise.all([
        supabase
          .from("cover_letters")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("resumes")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
      setLetters((l ?? []) as unknown as Letter[]);
      if (l?.[0]) setActiveId(l[0].id);
      if (r?.[0]) {
        setResumeId(r[0].id);
        setHasResume(true);
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
              <SectionCard className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-foreground/[0.05] grid place-items-center shrink-0">
                  <FileText className="w-4 h-4 text-foreground/55" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium tracking-tight text-foreground">
                    No cover letter yet
                  </p>
                  <p className="text-[12.5px] text-foreground/60 tracking-tight">
                    Fill in the company, role, and tone — we'll write a structured letter that doesn't
                    sound like generic AI.
                  </p>
                </div>
              </SectionCard>
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

export default CoverLetterGenerator;
