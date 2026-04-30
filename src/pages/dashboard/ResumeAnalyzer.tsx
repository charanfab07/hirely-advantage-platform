import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LogOut, Search } from "lucide-react";
import { SegmentedTabs } from "@/components/dashboard/SegmentedTabs";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { StatStrip } from "@/components/dashboard/StatStrip";
import { TodayCard } from "@/components/dashboard/TodayCard";
import { ScoreSparkline } from "@/components/dashboard/ScoreSparkline";
import { InsightsTriad, type InsightsColumn } from "@/components/dashboard/InsightsTriad";
import { QuickWins, type QuickWin } from "@/components/dashboard/QuickWins";
import { ResumeUploadCard } from "@/components/dashboard/ResumeUploadCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Weakness = {
  category:
    | "lack_of_metrics"
    | "weak_action_verbs"
    | "too_generic"
    | "missing_summary"
    | "skills_mismatch"
    | "ats_formatting"
    | "grammar"
    | "other";
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
};

type Analysis = {
  id: string;
  resume_id: string;
  overall_score: number;
  ats_score: number;
  summary: string;
  target_role?: string | null;
  extracted: {
    name?: string;
    headline?: string;
    skills?: string[];
    keywords?: string[];
    experience?: { title: string; company: string; dates?: string; bullets?: string[] }[];
    projects?: { name: string; description?: string }[];
    education?: { degree: string; school: string; dates?: string }[];
    achievements?: string[];
  };
  issues: {
    missing_sections?: string[];
    weak_bullets?: { text: string; reason: string }[];
    grammar_issues?: string[];
    formatting_problems?: string[];
    ats_problems?: string[];
  };
  insights: {
    strengths?: string[];
    gaps?: string[];
    risks?: string[];
  };
  quick_wins: { title: string; detail: string; impact: "high" | "medium" | "low" }[];
  strengths?: { title: string; detail: string }[];
  weaknesses?: Weakness[];
  bullet_rewrites?: { before: string; after: string; why: string }[];
  score_breakdown?: {
    ats_compatibility?: number;
    impact_statements?: number;
    relevance?: number;
    clarity?: number;
    keyword_match?: number;
  };
  job_match?: {
    target_role?: string;
    match_percent?: number;
    target_percent?: number;
    missing_requirements?: string[];
    matched_requirements?: string[];
  };
  created_at: string;
};

const tabs = [
  { value: "score", label: "Score" },
  { value: "extracted", label: "Extracted" },
  { value: "issues", label: "Issues" },
  { value: "versions", label: "History" },
];

const today = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const impactToLift: Record<string, string> = {
  high: "+5 pts",
  medium: "+3 pts",
  low: "+1 pt",
};

const ResumeAnalyzer = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("score");
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  const latest = analyses[0];

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("resume_analyses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      toast.error("Couldn't load analyses");
    } else {
      setAnalyses((data ?? []) as unknown as Analysis[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleAnalyzed = async () => {
    await refresh();
    setTab("score");
  };

  const insightsColumns: InsightsColumn[] | undefined = useMemo(() => {
    if (!latest) return undefined;
    const ins = latest.insights ?? {};
    return [
      {
        label: "Strengths",
        tone: "green",
        items: (ins.strengths ?? []).slice(0, 3).map((t) => ({ text: t })),
      },
      {
        label: "Gaps",
        tone: "amber",
        items: (ins.gaps ?? []).slice(0, 3).map((t) => ({ text: t })),
      },
      {
        label: "Risks",
        tone: "violet",
        items: (ins.risks ?? []).slice(0, 3).map((t) => ({ text: t })),
      },
    ];
  }, [latest]);

  const quickWins: QuickWin[] | undefined = useMemo(() => {
    if (!latest?.quick_wins?.length) return undefined;
    return latest.quick_wins.slice(0, 3).map((w, i) => ({
      id: `qw-${i}`,
      title: w.title,
      detail: w.detail,
      lift: impactToLift[w.impact] ?? "+2 pts",
      effort: w.impact === "high" ? "1 min" : w.impact === "medium" ? "45 sec" : "30 sec",
    }));
  }, [latest]);

  const sparklineData = useMemo(() => {
    // Build 30-point series from analysis history if we have any, else gentle ramp to current
    if (!analyses.length) return undefined;
    const scores = [...analyses].reverse().map((a) => a.overall_score);
    const last = scores[scores.length - 1] ?? 0;
    if (scores.length >= 30) return scores.slice(-30);
    // Pad start with a gentle ramp toward the first known score
    const pad: number[] = [];
    const first = scores[0];
    const padCount = 30 - scores.length;
    for (let i = 0; i < padCount; i++) {
      const v = Math.max(40, Math.round(first - (padCount - i) * 0.4));
      pad.push(v);
    }
    return [...pad, ...scores, ...(scores.length === 1 ? [last] : [])].slice(-30);
  }, [analyses]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10.5px] tracking-[0.22em] uppercase text-foreground/40 font-medium">
          {today}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              className="pl-8 pr-3 py-1.5 rounded-full bg-card/55 backdrop-blur border border-white/70 text-[12px] text-foreground/70 placeholder:text-foreground/40 outline-none w-44 focus:ring-2 focus:ring-foreground/10"
              placeholder="Search ⌘K"
            />
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="w-8 h-8 rounded-full bg-card/70 border border-white/70 backdrop-blur flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-card transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-foreground to-[#3a2d5e] flex items-center justify-center text-background text-[11px] font-semibold uppercase">
            {(user?.email?.[0] ?? "U")}
          </div>
        </div>
      </div>

      {/* Headline */}
      <h1 className="mt-3 text-[36px] sm:text-[44px] leading-[1.04] font-semibold tracking-[-0.035em] text-foreground">
        From ignored to{" "}
        <span
          style={{
            background: "linear-gradient(120deg,#0E0B1F,#6D54B3,#0E0B1F)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          interviewed
        </span>
        .
      </h1>

      {/* Upload always visible at top */}
      {user && (
        <div className="mt-5">
          <ResumeUploadCard userId={user.id} onAnalyzed={handleAnalyzed} />
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 overflow-x-auto">
        <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />
      </div>

      {!latest && !loading && (
        <SectionCard className="mt-5">
          <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
            No analysis yet
          </p>
          <p className="mt-2 text-[18px] tracking-tight text-foreground/75">
            Upload your resume above and we'll review it like a hiring manager —
            extract skills, score ATS compatibility, and surface the top fixes.
          </p>
        </SectionCard>
      )}

      {/* SCORE TAB */}
      {tab === "score" && latest && (
        <>
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
            <SectionCard className="lg:col-span-7">
              <div className="flex items-baseline justify-between">
                <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                  Resume readiness
                </p>
                <span className="text-[11.5px] font-medium text-[hsl(258_38%_52%)]">
                  ATS {latest.ats_score}/100
                </span>
              </div>
              <p className="mt-3 text-[72px] sm:text-[80px] leading-none font-semibold tracking-[-0.045em] text-foreground tabular-nums">
                {latest.overall_score}
                <span className="text-[26px] text-foreground/30 tracking-tight">/100</span>
              </p>
              <div className="mt-4 h-[3px] rounded-full bg-foreground/[0.06]">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{
                    width: `${latest.overall_score}%`,
                    background: "linear-gradient(90deg,#0E0B1F,#6D54B3)",
                  }}
                />
              </div>
              <p className="text-[12.5px] text-foreground/55 mt-2">
                {latest.summary || "Your latest review."}
              </p>
              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTab("extracted")}
                  className="px-4 py-2 rounded-full bg-foreground text-background text-[12.5px] font-medium tracking-tight hover:opacity-90 transition-opacity"
                >
                  See what we found →
                </button>
                <button
                  type="button"
                  onClick={() => setTab("issues")}
                  className="px-4 py-2 rounded-full text-foreground/65 text-[12.5px] hover:bg-foreground/5 transition-colors"
                >
                  View issues
                </button>
              </div>
            </SectionCard>

            <SectionCard tone="dark" className="lg:col-span-3 flex flex-col">
              <p className="text-[10.5px] tracking-[0.18em] uppercase text-white/55 font-medium">
                Interviews
              </p>
              <p className="text-[64px] leading-none font-semibold tracking-[-0.045em] mt-2">5</p>
              <p className="text-[12.5px] text-white/70 mt-2">2 scheduled this week</p>
              <Link
                to="/app/interview-prep"
                className="mt-auto pt-5 w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-full text-[12.5px] font-medium hover:opacity-90 transition-opacity"
                style={{ background: "#C8B6FF", color: "#0E0B1F" }}
              >
                Open prep <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </SectionCard>

            <TodayCard className="lg:col-span-2" />
          </div>

          {sparklineData && <ScoreSparkline className="mt-4" data={sparklineData} />}

          {(latest.job_match?.match_percent != null || latest.score_breakdown) && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {latest.job_match?.match_percent != null && (
                <JobMatchCard match={latest.job_match} />
              )}
              {latest.score_breakdown && (
                <ScoreBreakdownCard breakdown={latest.score_breakdown} />
              )}
            </div>
          )}

          {!!latest.strengths?.length && (
            <StrengthsCard className="mt-4" items={latest.strengths} />
          )}

          {!!latest.weaknesses?.length && (
            <WeaknessesCard className="mt-4" items={latest.weaknesses} />
          )}

          {!!latest.bullet_rewrites?.length && (
            <BulletRewritesCard className="mt-4" items={latest.bullet_rewrites} />
          )}

          {insightsColumns && <InsightsTriad className="mt-4" columns={insightsColumns} />}

          {quickWins && <QuickWins className="mt-4" wins={quickWins} />}

          <div className="mt-4">
            <StatStrip
              stats={[
                { label: "Skills", value: latest.extracted?.skills?.length ?? 0 },
                { label: "Keywords", value: latest.extracted?.keywords?.length ?? 0 },
                {
                  label: "ATS",
                  value: latest.ats_score,
                  highlight: latest.ats_score >= 80,
                },
                { label: "Issues", value:
                  (latest.issues?.weak_bullets?.length ?? 0) +
                  (latest.issues?.grammar_issues?.length ?? 0) +
                  (latest.issues?.formatting_problems?.length ?? 0) +
                  (latest.issues?.ats_problems?.length ?? 0)
                },
              ]}
            />
          </div>
        </>
      )}

      {/* EXTRACTED TAB */}
      {tab === "extracted" && latest && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SectionCard>
            <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
              Skills · {latest.extracted?.skills?.length ?? 0}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(latest.extracted?.skills ?? []).map((s, i) => (
                <span
                  key={i}
                  className="text-[12px] px-2.5 py-1 rounded-full bg-foreground/[0.05] text-foreground/75 tracking-tight"
                >
                  {s}
                </span>
              ))}
            </div>
          </SectionCard>

          <SectionCard>
            <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
              Keywords · {latest.extracted?.keywords?.length ?? 0}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(latest.extracted?.keywords ?? []).map((s, i) => (
                <span
                  key={i}
                  className="text-[12px] px-2.5 py-1 rounded-full bg-[hsl(258_45%_58%/0.10)] text-[hsl(258_38%_42%)] tracking-tight"
                >
                  {s}
                </span>
              ))}
            </div>
          </SectionCard>

          <SectionCard className="md:col-span-2">
            <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
              Experience
            </p>
            <ul className="mt-3 space-y-4">
              {(latest.extracted?.experience ?? []).map((exp, i) => (
                <li key={i} className="border-l-2 border-foreground/10 pl-4">
                  <p className="text-[14px] font-medium tracking-tight">
                    {exp.title}{" "}
                    <span className="text-foreground/55 font-normal">· {exp.company}</span>
                  </p>
                  {exp.dates && (
                    <p className="text-[11.5px] text-foreground/45 mt-0.5">{exp.dates}</p>
                  )}
                  <ul className="mt-2 space-y-1">
                    {(exp.bullets ?? []).map((b, j) => (
                      <li
                        key={j}
                        className="text-[12.5px] leading-[1.5] text-foreground/70 tracking-tight"
                      >
                        • {b}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
              {!latest.extracted?.experience?.length && (
                <p className="text-[13px] text-foreground/55">No experience extracted.</p>
              )}
            </ul>
          </SectionCard>

          {!!latest.extracted?.projects?.length && (
            <SectionCard>
              <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                Projects
              </p>
              <ul className="mt-3 space-y-2.5">
                {latest.extracted.projects.map((p, i) => (
                  <li key={i}>
                    <p className="text-[13px] font-medium tracking-tight">{p.name}</p>
                    {p.description && (
                      <p className="text-[12px] text-foreground/60 leading-snug">
                        {p.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {!!latest.extracted?.education?.length && (
            <SectionCard>
              <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                Education
              </p>
              <ul className="mt-3 space-y-2.5">
                {latest.extracted.education.map((e, i) => (
                  <li key={i}>
                    <p className="text-[13px] font-medium tracking-tight">{e.degree}</p>
                    <p className="text-[12px] text-foreground/60">
                      {e.school}
                      {e.dates ? ` · ${e.dates}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {!!latest.extracted?.achievements?.length && (
            <SectionCard className="md:col-span-2">
              <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                Achievements
              </p>
              <ul className="mt-3 space-y-1.5">
                {latest.extracted.achievements.map((a, i) => (
                  <li
                    key={i}
                    className="text-[13px] text-foreground/75 leading-snug tracking-tight"
                  >
                    • {a}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      )}

      {/* ISSUES TAB */}
      {tab === "issues" && latest && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <IssueList
            label="Missing sections"
            tone="amber"
            items={latest.issues?.missing_sections ?? []}
          />
          <IssueList
            label="ATS problems"
            tone="violet"
            items={latest.issues?.ats_problems ?? []}
          />
          <IssueList
            label="Formatting"
            tone="amber"
            items={latest.issues?.formatting_problems ?? []}
          />
          <IssueList
            label="Grammar"
            tone="violet"
            items={latest.issues?.grammar_issues ?? []}
          />

          <SectionCard className="md:col-span-2">
            <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
              Weak bullets · {latest.issues?.weak_bullets?.length ?? 0}
            </p>
            <ul className="mt-3 space-y-3">
              {(latest.issues?.weak_bullets ?? []).map((b, i) => (
                <li key={i} className="rounded-xl bg-foreground/[0.03] p-3.5">
                  <p className="text-[13px] text-foreground tracking-tight">“{b.text}”</p>
                  <p className="text-[12px] text-foreground/55 mt-1.5 leading-snug">
                    {b.reason}
                  </p>
                </li>
              ))}
              {!latest.issues?.weak_bullets?.length && (
                <p className="text-[13px] text-foreground/55">No weak bullets — solid work.</p>
              )}
            </ul>
          </SectionCard>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === "versions" && (
        <SectionCard className="mt-5 p-0 overflow-hidden">
          <ul className="divide-y divide-foreground/[0.06]">
            {analyses.map((a) => (
              <li
                key={a.id}
                className="px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium tracking-tight">
                    Score {a.overall_score} · ATS {a.ats_score}
                  </p>
                  <p className="text-[11.5px] text-foreground/50">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="text-[12.5px] text-foreground/65 truncate max-w-[60%] hidden sm:block">
                  {a.summary}
                </p>
              </li>
            ))}
            {!analyses.length && (
              <li className="px-5 py-6 text-[13px] text-foreground/55">
                No history yet. Upload a resume to start.
              </li>
            )}
          </ul>
        </SectionCard>
      )}
    </div>
  );
};

const toneClass: Record<"amber" | "violet" | "green", string> = {
  amber: "bg-[hsl(35_92%_55%/0.12)] text-[hsl(28_70%_38%)]",
  violet: "bg-[hsl(258_45%_58%/0.12)] text-[hsl(258_38%_42%)]",
  green: "bg-[hsl(150_55%_45%/0.10)] text-[hsl(150_45%_28%)]",
};

const IssueList = ({
  label,
  tone,
  items,
}: {
  label: string;
  tone: "amber" | "violet" | "green";
  items: string[];
}) => (
  <SectionCard>
    <div className="flex items-center justify-between">
      <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
        {label}
      </p>
      <span
        className={`text-[10px] font-medium px-2 py-0.5 rounded-full tracking-tight ${toneClass[tone]}`}
      >
        {items.length}
      </span>
    </div>
    <ul className="mt-3 space-y-2">
      {items.length ? (
        items.map((t, i) => (
          <li
            key={i}
            className="text-[12.5px] leading-[1.5] text-foreground/75 tracking-tight"
          >
            • {t}
          </li>
        ))
      ) : (
        <li className="text-[12.5px] text-foreground/45">None detected.</li>
      )}
    </ul>
  </SectionCard>
);

// ----- Job match card -----
const JobMatchCard = ({ match }: { match: NonNullable<Analysis["job_match"]> }) => {
  const pct = Math.max(0, Math.min(100, Math.round(match.match_percent ?? 0)));
  const target = Math.max(pct, Math.min(100, Math.round(match.target_percent ?? Math.min(100, pct + 22))));
  const missing = match.missing_requirements ?? [];
  return (
    <SectionCard>
      <div className="flex items-baseline justify-between">
        <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
          Job match
        </p>
        {match.target_role && (
          <span className="text-[11px] text-foreground/55 tracking-tight truncate max-w-[60%]">
            vs {match.target_role}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-[44px] leading-none font-semibold tracking-[-0.04em] tabular-nums">
          {pct}
          <span className="text-[18px] text-foreground/30">%</span>
        </p>
        <span className="text-[12px] text-foreground/55 tracking-tight">
          → {target}% reachable
        </span>
      </div>
      <div className="mt-3 relative h-[6px] rounded-full bg-foreground/[0.06] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${target}%`, background: "hsl(258 45% 58% / 0.18)" }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#0E0B1F,#6D54B3)" }}
        />
      </div>
      {missing.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] text-foreground/55 tracking-tight">
            Improve these {Math.min(missing.length, 5)} areas to reach {target}%+
          </p>
          <ul className="mt-2 space-y-1.5">
            {missing.slice(0, 5).map((m, i) => (
              <li
                key={i}
                className="text-[12.5px] leading-[1.5] text-foreground/75 tracking-tight flex items-start gap-2"
              >
                <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[hsl(258_45%_58%)] shrink-0" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
};

// ----- Score breakdown card -----
const BREAKDOWN_LABELS: { key: keyof NonNullable<Analysis["score_breakdown"]>; label: string }[] = [
  { key: "ats_compatibility", label: "ATS compatibility" },
  { key: "impact_statements", label: "Impact statements" },
  { key: "relevance", label: "Relevance" },
  { key: "clarity", label: "Clarity" },
  { key: "keyword_match", label: "Keyword match" },
];

const ScoreBreakdownCard = ({
  breakdown,
}: {
  breakdown: NonNullable<Analysis["score_breakdown"]>;
}) => {
  return (
    <SectionCard>
      <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
        Score breakdown
      </p>
      <ul className="mt-3 space-y-2.5">
        {BREAKDOWN_LABELS.map(({ key, label }) => {
          const val = Math.max(0, Math.min(100, Math.round(breakdown[key] ?? 0)));
          return (
            <li key={key}>
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-foreground/75 tracking-tight">{label}</span>
                <span className="text-[12px] font-medium text-foreground tabular-nums">{val}</span>
              </div>
              <div className="mt-1 h-[3px] rounded-full bg-foreground/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{
                    width: `${val}%`,
                    background:
                      val >= 80
                        ? "linear-gradient(90deg,#0E0B1F,#6D54B3)"
                        : val >= 60
                        ? "hsl(258 45% 58%)"
                        : "hsl(35 92% 55%)",
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
};

// ----- Strengths card -----
const StrengthsCard = ({
  items,
  className,
}: {
  items: { title: string; detail: string }[];
  className?: string;
}) => (
  <SectionCard className={className}>
    <div className="flex items-center justify-between">
      <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
        Strengths
      </p>
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full tracking-tight bg-[hsl(150_55%_45%/0.10)] text-[hsl(150_45%_28%)]">
        {items.length}
      </span>
    </div>
    <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map((s, i) => (
        <li
          key={i}
          className="rounded-xl bg-[hsl(150_55%_45%/0.06)] border border-[hsl(150_55%_45%/0.14)] p-3.5"
        >
          <p className="text-[13px] font-medium tracking-tight text-foreground">{s.title}</p>
          <p className="mt-1 text-[12.5px] text-foreground/65 leading-snug tracking-tight">
            {s.detail}
          </p>
        </li>
      ))}
    </ul>
  </SectionCard>
);

// ----- Weaknesses card -----
const WEAKNESS_LABEL: Record<Weakness["category"], string> = {
  lack_of_metrics: "Lack of metrics",
  weak_action_verbs: "Weak verbs",
  too_generic: "Too generic",
  missing_summary: "Missing summary",
  skills_mismatch: "Skills mismatch",
  ats_formatting: "ATS formatting",
  grammar: "Grammar",
  other: "Other",
};

const SEVERITY_TONE: Record<Weakness["severity"], string> = {
  high: "bg-[hsl(0_70%_55%/0.10)] text-[hsl(0_60%_38%)]",
  medium: "bg-[hsl(35_92%_55%/0.12)] text-[hsl(28_70%_38%)]",
  low: "bg-[hsl(258_45%_58%/0.10)] text-[hsl(258_38%_42%)]",
};

const WeaknessesCard = ({
  items,
  className,
}: {
  items: Weakness[];
  className?: string;
}) => (
  <SectionCard className={cn("p-0 overflow-hidden", className)}>
    <div className="px-5 sm:px-6 pt-5 pb-3 flex items-center justify-between">
      <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
        Weaknesses
      </p>
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full tracking-tight bg-[hsl(35_92%_55%/0.12)] text-[hsl(28_70%_38%)]">
        {items.length}
      </span>
    </div>
    <ul className="border-t border-foreground/[0.06] divide-y divide-foreground/[0.06]">
      {items.map((w, i) => (
        <li key={i} className="px-5 sm:px-6 py-3.5 flex items-start gap-3">
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full tracking-tight shrink-0 mt-0.5 ${SEVERITY_TONE[w.severity]}`}
          >
            {WEAKNESS_LABEL[w.category]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium tracking-tight text-foreground">{w.title}</p>
            <p className="mt-0.5 text-[12.5px] text-foreground/65 leading-snug tracking-tight">
              {w.detail}
            </p>
          </div>
        </li>
      ))}
    </ul>
  </SectionCard>
);

// ----- Bullet rewrites card -----
const BulletRewritesCard = ({
  items,
  className,
}: {
  items: { before: string; after: string; why: string }[];
  className?: string;
}) => (
  <SectionCard className={className}>
    <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
      Before · After
    </p>
    <p className="mt-1 text-[12.5px] text-foreground/55 tracking-tight">
      Concrete rewrites with realistic metrics — copy them, adapt the numbers to your reality.
    </p>
    <ul className="mt-4 space-y-3">
      {items.map((b, i) => (
        <li key={i} className="rounded-xl bg-foreground/[0.025] p-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] tracking-[0.18em] uppercase text-foreground/40 font-medium">
                Before
              </p>
              <p className="mt-1.5 text-[13px] text-foreground/70 leading-snug tracking-tight line-through decoration-foreground/20">
                {b.before}
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.18em] uppercase text-[hsl(258_38%_52%)] font-medium">
                After
              </p>
              <p className="mt-1.5 text-[13px] text-foreground leading-snug tracking-tight font-medium">
                {b.after}
              </p>
            </div>
          </div>
          {b.why && (
            <p className="mt-2.5 text-[11.5px] text-foreground/55 tracking-tight">
              Why: {b.why}
            </p>
          )}
        </li>
      ))}
    </ul>
  </SectionCard>
);

export default ResumeAnalyzer;

