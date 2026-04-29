import { useState } from "react";
import { Sparkles } from "lucide-react";
import { SegmentedTabs } from "@/components/dashboard/SegmentedTabs";
import { SectionCard } from "@/components/dashboard/SectionCard";

const tabs = [
  { value: "compose", label: "Compose" },
  { value: "tone", label: "Tone" },
  { value: "history", label: "History", count: 4 },
];

const CoverLetterGenerator = () => {
  const [tab, setTab] = useState("compose");

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

      <div className="mt-6">
        <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />
      </div>

      <SectionCard className="mt-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
            Draft
          </p>
          <p className="text-[11px] text-foreground/45">Linear · Senior PM</p>
        </div>
        <textarea
          className="mt-3 w-full min-h-[220px] resize-none rounded-2xl bg-card/60 border border-white/70 p-4 text-[13.5px] leading-relaxed text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-foreground/10"
          placeholder="Paste a job description or start from scratch — we'll match the voice, the values, and the role's actual roadmap."
        />
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[11.5px] text-foreground/50">
            Trained on 12k cover letters that landed interviews.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-medium text-white tracking-tight hover:opacity-90 transition-opacity"
            style={{ background: "#6D54B3" }}
          >
            <Sparkles className="w-3.5 h-3.5" /> Generate with AI
          </button>
        </div>
      </SectionCard>
    </div>
  );
};

export default CoverLetterGenerator;
