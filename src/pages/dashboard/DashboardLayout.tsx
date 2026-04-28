import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Flame, ArrowUpRight } from "lucide-react";

const nav = [
  { to: "/app/resume", label: "Resume" },
  { to: "/app/outreach", label: "Outreach" },
  { to: "/app/applications", label: "Applications" },
];

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const crumb = nav.find((n) => pathname.startsWith(n.to))?.label ?? "Resume";

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <div className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-[220px_1fr_300px]">
        {/* Sidebar */}
        <aside className="flex flex-col border-r border-border/60 px-6 py-8">
          <div className="mb-10 font-display text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Workspace
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-colors",
                    isActive
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 flex flex-col gap-2 border-t border-border/60 pt-6">
            <button className="rounded-xl px-3.5 py-2.5 text-left text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              Live ATS score
            </button>
            <button className="rounded-xl px-3.5 py-2.5 text-left text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              Voice Coach
            </button>
          </div>

          <div className="mt-auto flex items-center gap-3 pt-8">
            <div className="size-9 rounded-full bg-foreground/10 grid place-items-center text-[11px] font-semibold">
              ER
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-medium">Elena Rostova</span>
              <span className="text-[11px] text-muted-foreground">Pro plan</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-border/60 px-10">
            <div className="font-display text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
              {crumb === "Resume" ? "Resume_v7.pdf" : crumb}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-[11px] font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Live scan
            </div>
          </header>
          <div className="flex-1 px-10 py-8">
            <Outlet />
          </div>
        </main>

        {/* Right rail */}
        <aside className="flex flex-col gap-4 border-l border-border/60 px-6 py-8">
          <div className="font-display text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Today
          </div>

          <div className="rounded-2xl bg-card p-5 shadow-sm border border-border/50">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <Flame className="size-3" />
              Streak
            </div>
            <div className="mt-3 font-display text-3xl font-semibold tracking-tight">12 days</div>
          </div>

          <div className="rounded-2xl bg-card p-5 shadow-sm border border-border/50">
            <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Applications
            </div>
            <div className="mt-3 font-display text-3xl font-semibold tracking-tight tabular-nums">
              7 <span className="text-muted-foreground/60">/ 10</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[70%] rounded-full bg-foreground" />
            </div>
          </div>

          <div className="rounded-2xl bg-card p-5 shadow-sm border border-border/50">
            <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Next Interview
            </div>
            <div className="mt-3 font-display text-lg font-semibold tracking-tight">
              Stripe · onsite
            </div>
            <div className="mt-1 text-[12px] text-muted-foreground">Thu, 2:00 PM</div>
          </div>

          <button className="mt-2 inline-flex items-center justify-between rounded-2xl border border-border/60 bg-card/60 px-4 py-3 text-[13px] font-medium hover:bg-muted transition-colors">
            AI rewrite suggestions
            <ArrowUpRight className="size-4" />
          </button>
        </aside>
      </div>
    </div>
  );
}
