import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertOctagon,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  Gauge,
  ListChecks,
  Sparkles,
  Layers,
  Table2,
  User,
  Briefcase,
  GraduationCap,
  XOctagon,
} from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { cn } from "@/lib/utils";

type Section = {
  key: string;
  title: string;
  body: string;
};

type Meta = {
  icon: typeof AlertOctagon;
  accent: string; // tailwind color class for icon container bg
  iconColor: string;
  label: string;
};

const META: Record<string, Meta> = {
  hard: {
    icon: AlertOctagon,
    accent: "bg-rose-500/10 ring-1 ring-rose-500/20",
    iconColor: "text-rose-600",
    label: "Critical",
  },
  soft: {
    icon: AlertTriangle,
    accent: "bg-amber-500/10 ring-1 ring-amber-500/20",
    iconColor: "text-amber-600",
    label: "Important",
  },
  keyword: {
    icon: KeyRound,
    accent: "bg-violet-500/10 ring-1 ring-violet-500/20",
    iconColor: "text-violet-600",
    label: "ATS",
  },
  strength: {
    icon: CheckCircle2,
    accent: "bg-emerald-500/10 ring-1 ring-emerald-500/20",
    iconColor: "text-emerald-600",
    label: "Working",
  },
  score: {
    icon: Gauge,
    accent: "bg-foreground/[0.06] ring-1 ring-foreground/10",
    iconColor: "text-foreground",
    label: "Verdict",
  },
  action: {
    icon: ListChecks,
    accent: "bg-sky-500/10 ring-1 ring-sky-500/20",
    iconColor: "text-sky-600",
    label: "Do this next",
  },
  seniority: {
    icon: Layers,
    accent: "bg-indigo-500/10 ring-1 ring-indigo-500/20",
    iconColor: "text-indigo-600",
    label: "Level fit",
  },
  evidence: {
    icon: Table2,
    accent: "bg-teal-500/10 ring-1 ring-teal-500/20",
    iconColor: "text-teal-600",
    label: "Evidence map",
  },
  contact: {
    icon: User,
    accent: "bg-sky-500/10 ring-1 ring-sky-500/20",
    iconColor: "text-sky-600",
    label: "Contact",
  },
  experience: {
    icon: Briefcase,
    accent: "bg-violet-500/10 ring-1 ring-violet-500/20",
    iconColor: "text-violet-600",
    label: "Experience",
  },
  education: {
    icon: GraduationCap,
    accent: "bg-indigo-500/10 ring-1 ring-indigo-500/20",
    iconColor: "text-indigo-600",
    label: "Education",
  },
  skills: {
    icon: KeyRound,
    accent: "bg-emerald-500/10 ring-1 ring-emerald-500/20",
    iconColor: "text-emerald-600",
    label: "Skills",
  },
  failure: {
    icon: XOctagon,
    accent: "bg-rose-500/10 ring-1 ring-rose-500/20",
    iconColor: "text-rose-600",
    label: "Parse failures",
  },
  default: {
    icon: Sparkles,
    accent: "bg-foreground/5 ring-1 ring-foreground/10",
    iconColor: "text-foreground/70",
    label: "Section",
  },
};

function classify(title: string): keyof typeof META {
  const t = title.toLowerCase();
  if (t.includes("hard requirement")) return "hard";
  if (t.includes("soft requirement")) return "soft";
  if (t.includes("seniority") || t.includes("scope match") || t.includes("level fit")) return "seniority";
  if (t.includes("parse failure") || t.includes("failure report")) return "failure";
  if (t.includes("contact")) return "contact";
  if (t.includes("work experience") || t.includes("experience parse")) return "experience";
  if (t.includes("education")) return "education";
  if (t.includes("skill")) return "skills";
  if (t.includes("keyword")) return "keyword";
  if (t.includes("strength")) return "strength";
  if (t.includes("score") || t.includes("readability") || t.includes("parseability") || t.includes("overall")) return "score";
  if (t.includes("action") || t.includes("priority") || t.includes("fix")) return "action";
  return "default";
}

function parseSections(md: string): Section[] {
  const lines = md.split(/\r?\n/);
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const line of lines) {
    const m = /^#{1,3}\s+(.+?)\s*$/.exec(line);
    if (m) {
      if (current) sections.push(current);
      const rawTitle = m[1].replace(/[*_`]/g, "").trim();
      current = {
        key: classify(rawTitle),
        title: rawTitle.replace(/^\d+\.\s*/, ""),
        body: "",
      };
    } else if (current) {
      current.body += line + "\n";
    } else {
      // preamble before first heading -> create implicit section
      current = { key: "default", title: "Summary", body: line + "\n" };
    }
  }
  if (current) sections.push(current);
  return sections.map((s) => ({ ...s, body: s.body.trim() }));
}

function extractScores(body: string) {
  // Look for lines like "Hard Requirements Met: 65/100"
  const re = /([A-Za-z][A-Za-z \-/]+?)\s*[:\-–]\s*(\d{1,3})\s*\/\s*100/g;
  const out: { label: string; value: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const label = m[1].replace(/[*_`#]/g, "").trim();
    const value = Math.min(100, Math.max(0, parseInt(m[2], 10)));
    if (label.length < 60) out.push({ label, value });
  }
  return out;
}

function ScoreRing({ value }: { value: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const tone =
    value >= 75 ? "text-emerald-500" : value >= 50 ? "text-amber-500" : "text-rose-500";
  return (
    <div className="relative w-[120px] h-[120px] shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} className="stroke-foreground/[0.08]" strokeWidth="8" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={r}
          className={cn(tone, "transition-all duration-700")}
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-medium tracking-tight text-foreground leading-none">
          {value}
        </span>
        <span className="text-[10px] tracking-[0.18em] uppercase text-foreground/50 mt-1">/ 100</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const tone =
    value >= 75 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <span className="text-[12.5px] text-foreground/70">{label}</span>
        <span className="text-[12.5px] font-medium tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", tone)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ScoreSection({ section }: { section: Section }) {
  const scores = extractScores(section.body);
  const overall =
    scores.find((s) => /overall/i.test(s.label))?.value ??
    (scores.length ? Math.round(scores.reduce((a, b) => a + b.value, 0) / scores.length) : null);
  const others = scores.filter((s) => !/overall/i.test(s.label));

  // verdict line: a sentence after the scores
  const verdict = section.body
    .split(/\n/)
    .map((l) => l.replace(/[*_`#>]/g, "").trim())
    .filter((l) => l && !/\d{1,3}\s*\/\s*100/.test(l) && !/^[-•]/.test(l))
    .pop();

  return (
    <SectionCard tone="dark" className="overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
        {overall !== null && (
          <div className="flex items-center gap-5">
            <ScoreRing value={overall} />
            <div>
              <p className="text-[10.5px] tracking-[0.22em] uppercase text-white/50 font-medium">
                Overall fit
              </p>
              <p className="mt-1 text-[18px] leading-snug font-medium tracking-tight text-white max-w-md">
                {overall >= 75
                  ? "Strong fit. Apply with confidence."
                  : overall >= 50
                  ? "Partial fit. Worth tailoring before submitting."
                  : "Weak fit. Significant gaps to close first."}
              </p>
            </div>
          </div>
        )}
        <div className="flex-1 grid sm:grid-cols-2 gap-x-6 gap-y-3 md:pl-6 md:border-l md:border-white/10">
          {others.length > 0 ? (
            others.map((s) => (
              <div key={s.label}>
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <span className="text-[12px] text-white/70">{s.label}</span>
                  <span className="text-[12px] font-medium tabular-nums text-white">{s.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white/85 transition-all duration-700"
                    style={{ width: `${s.value}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-[13px] text-white/70 leading-relaxed">{section.body}</div>
          )}
        </div>
      </div>
      {verdict && others.length > 0 && (
        <p className="mt-6 pt-5 border-t border-white/10 text-[13.5px] text-white/80 leading-relaxed">
          {verdict}
        </p>
      )}
    </SectionCard>
  );
}

function SectionBlock({ section }: { section: Section }) {
  const meta = META[section.key] ?? META.default;
  const Icon = meta.icon;

  if (section.key === "score") return <ScoreSection section={section} />;

  return (
    <SectionCard className="p-0 overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-5">
          <div className={cn("shrink-0 w-10 h-10 rounded-xl flex items-center justify-center", meta.accent)}>
            <Icon className={cn("w-[18px] h-[18px]", meta.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-[0.22em] uppercase text-foreground/45 font-medium">
              {meta.label}
            </p>
            <h2 className="mt-1 text-[18px] leading-snug font-medium tracking-tight text-foreground">
              {section.title}
            </h2>
          </div>
        </div>
        <article
          className={cn(
            "prose prose-sm max-w-none",
            "prose-p:text-foreground/80 prose-p:leading-[1.7] prose-p:my-3",
            "prose-li:text-foreground/80 prose-li:leading-[1.7] prose-li:my-1.5",
            "prose-ul:my-2 prose-ol:my-2 prose-ol:pl-5 prose-ul:pl-5",
            "prose-strong:text-foreground prose-strong:font-semibold",
            "prose-headings:hidden",
            "prose-code:text-foreground prose-code:bg-foreground/[0.06] prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-[12px] prose-code:before:content-none prose-code:after:content-none",
            "prose-hr:border-foreground/10",
            "[&_table]:w-full [&_table]:my-4 [&_table]:text-[12.5px] [&_table]:border-separate [&_table]:border-spacing-0 [&_table]:rounded-xl [&_table]:overflow-hidden [&_table]:border [&_table]:border-foreground/[0.08]",
            "[&_thead]:bg-foreground/[0.04]",
            "[&_th]:text-left [&_th]:font-medium [&_th]:text-foreground/70 [&_th]:px-3 [&_th]:py-2 [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-[0.1em] [&_th]:border-b [&_th]:border-foreground/[0.08]",
            "[&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:border-b [&_td]:border-foreground/[0.05] [&_td]:text-foreground/80",
            "[&_tbody_tr:last-child_td]:border-b-0",
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.body}</ReactMarkdown>
        </article>
      </div>
    </SectionCard>
  );
}

export default function GapResult({ markdown, preserveOrder = false }: { markdown: string; preserveOrder?: boolean }) {
  const sections = useMemo(() => parseSections(markdown), [markdown]);

  // Reorder: score first, then critical->soft->keyword->strength->action
  const order: Record<string, number> = {
    score: 0,
    hard: 1,
    seniority: 2,
    soft: 3,
    keyword: 4,
    strength: 5,
    action: 6,
    contact: 7,
    experience: 8,
    education: 9,
    skills: 10,
    failure: 11,
    default: 12,
  };
  const sorted = preserveOrder
    ? sections
    : [...sections].sort((a, b) => (order[a.key] ?? 99) - (order[b.key] ?? 99));

  return (
    <div className="space-y-5">
      {sorted.map((s, i) => (
        <SectionBlock key={`${s.key}-${i}`} section={s} />
      ))}
    </div>
  );
}
