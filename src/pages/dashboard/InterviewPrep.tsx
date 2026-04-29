import { useState } from "react";
import { Mic } from "lucide-react";
import { SegmentedTabs } from "@/components/dashboard/SegmentedTabs";
import { SectionCard } from "@/components/dashboard/SectionCard";

const tabs = [
  { value: "practice", label: "Practice" },
  { value: "bank", label: "Question bank", count: 120 },
  { value: "recordings", label: "Recordings", count: 7 },
];

const InterviewPrep = () => {
  const [tab, setTab] = useState("practice");

  return (
    <div className="max-w-6xl mx-auto">
      <p className="text-[10.5px] tracking-[0.22em] uppercase text-foreground/40 font-medium">
        Interview Prep
      </p>
      <h1 className="mt-2 text-[36px] sm:text-[44px] leading-[1.04] font-semibold tracking-[-0.035em] text-foreground">
        Practice under pressure.{" "}
        <span
          style={{
            background: "linear-gradient(120deg,#0E0B1F,#6D54B3,#0E0B1F)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Walk in fluent.
        </span>
      </h1>

      <div className="mt-6">
        <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard className="lg:col-span-2">
          <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
            Up next
          </p>
          <p className="mt-3 text-[22px] font-semibold tracking-[-0.02em] text-foreground leading-snug">
            Linear · Senior PM screen
          </p>
          <p className="text-[13px] text-foreground/55 mt-1">Wed, 2:30 PM · 30 min with Karri</p>

          <div className="mt-5 pt-5 border-t border-foreground/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-foreground/55">Prep checklist</span>
              <span className="text-[12px] font-medium text-[hsl(258_38%_52%)]">3 of 5 done</span>
            </div>
            <div className="mt-3 flex gap-1">
              {[true, true, true, false, false].map((done, i) => (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full"
                  style={{ background: done ? "#6D54B3" : "hsl(var(--foreground) / 0.1)" }}
                />
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard tone="dark" className="flex flex-col">
          <p className="text-[10.5px] tracking-[0.18em] uppercase text-white/55 font-medium">
            Mock interview
          </p>
          <p className="mt-3 text-[20px] font-semibold tracking-tight">Behavioral · STAR drill</p>
          <p className="text-[12.5px] text-white/65 mt-2">
            15 min · voice-first · live delivery scoring
          </p>
          <button
            type="button"
            className="mt-auto w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full text-[12.5px] font-medium hover:opacity-90 transition-opacity"
            style={{ background: "#C8B6FF", color: "#0E0B1F" }}
          >
            <Mic className="w-3.5 h-3.5" /> Start mock interview
          </button>
        </SectionCard>
      </div>
    </div>
  );
};

export default InterviewPrep;
