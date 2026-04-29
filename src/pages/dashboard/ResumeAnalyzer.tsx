import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { SegmentedTabs } from "@/components/dashboard/SegmentedTabs";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { StatStrip } from "@/components/dashboard/StatStrip";
import { TodayCard } from "@/components/dashboard/TodayCard";
import { ScoreSparkline } from "@/components/dashboard/ScoreSparkline";

const tabs = [
  { value: "score", label: "Score" },
  { value: "keywords", label: "Keywords", count: 14 },
  { value: "rewrites", label: "Impact rewrites" },
  { value: "versions", label: "Versions", count: 3 },
];

const today = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const ResumeAnalyzer = () => {
  const [tab, setTab] = useState("score");

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
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-foreground to-[#3a2d5e]" />
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

      {/* Tabs */}
      <div className="mt-6 overflow-x-auto">
        <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />
      </div>

      {/* Score panel */}
      {tab === "score" && (
        <>
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
            <SectionCard className="lg:col-span-7">
              <div className="flex items-baseline justify-between">
                <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                  Resume readiness
                </p>
                <span className="text-[11.5px] font-medium text-[hsl(258_38%_52%)]">+12 pts</span>
              </div>
              <p className="mt-3 text-[72px] sm:text-[80px] leading-none font-semibold tracking-[-0.045em] text-foreground">
                94<span className="text-[26px] text-foreground/30 tracking-tight">/100</span>
              </p>
              <div className="mt-4 h-[3px] rounded-full bg-foreground/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{ width: "94%", background: "linear-gradient(90deg,#0E0B1F,#6D54B3)" }}
                />
              </div>
              <p className="text-[12.5px] text-foreground/55 mt-2">
                Beats 89% of senior PM resumes in your market.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-full bg-foreground text-background text-[12.5px] font-medium tracking-tight hover:opacity-90 transition-opacity"
                >
                  Open resume →
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-full text-foreground/65 text-[12.5px] hover:bg-foreground/5 transition-colors"
                >
                  Recompute
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

          <ScoreSparkline className="mt-4" />

          <div className="mt-4">
            <StatStrip
              stats={[
                { label: "Applied", value: 28 },
                { label: "Screening", value: 11 },
                { label: "Interview", value: 5, highlight: true },
                { label: "Offer", value: 1 },
              ]}
            />
          </div>
        </>
      )}

      {tab !== "score" && (
        <SectionCard className="mt-5">
          <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
            {tabs.find((t) => t.value === tab)?.label}
          </p>
          <p className="mt-3 text-[18px] tracking-tight text-foreground/70">
            Coming up next — we're tuning this view.
          </p>
        </SectionCard>
      )}
    </div>
  );
};

export default ResumeAnalyzer;
