import { NavLink } from "react-router-dom";
import { FileText, Mail, Mic, Briefcase, Send, Bookmark, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

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

const SidebarBody = ({ onNavigate }: { onNavigate?: () => void }) => (
  <>
    <div className="flex items-center gap-2.5 mb-9 px-2">
      <div className="w-8 h-8 rounded-[10px] bg-foreground flex items-center justify-center text-background text-[12px] font-semibold">
        H
      </div>
      <span className="font-semibold tracking-[-0.02em] text-foreground text-[15.5px]">Hirely</span>
    </div>

    <SectionLabel>Suite</SectionLabel>
    <nav className="flex flex-col gap-0.5 mb-5">
      {suite.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] tracking-tight transition-colors",
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
              <Icon className="w-4 h-4 opacity-70" />
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
          onClick={onNavigate}
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
  </>
);

export const DashboardSidebar = () => {
  return (
    <aside className="w-[280px] shrink-0 hidden md:flex flex-col px-6 py-8">
      <SidebarBody />
    </aside>
  );
};

export const MobileSidebar = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "md:hidden fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-foreground/30 backdrop-blur-sm transition-opacity duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute left-0 top-0 h-full w-[260px] bg-background/95 backdrop-blur-xl",
          "border-r border-border/60 shadow-2xl",
          "flex flex-col px-5 py-7",
          "transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] will-change-transform",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-card/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarBody onNavigate={onClose} />
      </div>
    </div>
  );
};
