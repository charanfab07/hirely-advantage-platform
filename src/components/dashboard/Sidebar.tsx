import { NavLink } from "react-router-dom";
import { FileText, Mail, Mic, Briefcase, Send, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

const suite = [
  { to: "/app/resume", label: "Resume Analyzer", icon: FileText },
  { to: "/app/cover-letter", label: "Cover Letter Generator", icon: Mail },
  { to: "/app/interview-prep", label: "Interview Prep", icon: Mic },
];

const tracking = [
  { to: "/app/applications", label: "Applications", count: 28, icon: Briefcase },
  { to: "/app/outreach", label: "Outreach", count: 14, icon: Send },
  { to: "/app/saved", label: "Saved", count: 12, icon: Bookmark },
];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] tracking-[0.22em] uppercase text-foreground/35 px-2 mb-1.5 font-medium">
    {children}
  </p>
);

export const DashboardSidebar = () => {
  return (
    <aside className="w-[240px] shrink-0 hidden md:flex flex-col px-5 py-7">
      <div className="flex items-center gap-2 mb-9 px-2">
        <div className="w-7 h-7 rounded-[9px] bg-foreground flex items-center justify-center text-background text-[11px] font-semibold">
          H
        </div>
        <span className="font-semibold tracking-[-0.02em] text-foreground text-[14.5px]">Hirely</span>
      </div>

      <SectionLabel>Suite</SectionLabel>
      <nav className="flex flex-col gap-0.5 mb-5">
        {suite.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] tracking-tight transition-colors",
                isActive
                  ? "bg-card/70 text-foreground font-medium shadow-[0_1px_0_hsl(0_0%_100%/1)_inset,0_1px_2px_hsl(var(--slate-ink)/0.06)]"
                  : "text-foreground/55 hover:text-foreground hover:bg-card/40",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors",
                    isActive ? "bg-[hsl(258_38%_52%)]" : "bg-transparent",
                  )}
                />
                <Icon className="w-3.5 h-3.5 opacity-70" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <SectionLabel>Tracking</SectionLabel>
      <nav className="flex flex-col gap-0.5 mb-5">
        {tracking.map(({ to, label, count, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] tracking-tight transition-colors",
                isActive
                  ? "text-foreground font-medium bg-card/60"
                  : "text-foreground/60 hover:text-foreground hover:bg-card/40",
              )
            }
          >
            <span className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 opacity-70" />
              {label}
            </span>
            <span className="text-foreground/40 text-[12px]">{count}</span>
          </NavLink>
        ))}
      </nav>

      <div
        className="mt-auto rounded-2xl p-4 text-white"
        style={{ background: "linear-gradient(140deg,#0E0B1F,#3a2d5e)" }}
      >
        <p className="text-[11px] font-medium tracking-tight">Hirely Pro</p>
        <p className="text-[10.5px] text-white/65 mt-0.5">Unlimited rewrites & mock interviews</p>
        <button
          type="button"
          className="mt-3 text-[11px] bg-white text-foreground font-medium px-3 py-1.5 rounded-full w-full hover:opacity-90 transition-opacity"
        >
          Upgrade
        </button>
      </div>
    </aside>
  );
};
