import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FileText,
  Send,
  Briefcase,
  Mic,
  Activity,
  Settings,
  Search,
  Command,
  Bell,
  Plus,
  Flame,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

const primaryNav = [
  { to: "/app/resume", label: "Resume", icon: FileText },
  { to: "/app/outreach", label: "Outreach", icon: Send },
  { to: "/app/applications", label: "Applications", icon: Briefcase },
];

const secondaryNav = [
  { to: "/app/voice", label: "Voice Coach", icon: Mic },
  { to: "/app/score", label: "Live ATS", icon: Activity },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const active =
    [...primaryNav, ...secondaryNav].find((n) => pathname.startsWith(n.to))?.label ?? "Resume";

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased overflow-hidden">
      {/* Soft pastel ambient wash — same palette as landing */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(60% 50% at 12% 8%, hsl(var(--ethereal-blue) / 0.55), transparent 70%),
            radial-gradient(55% 45% at 92% 6%, hsl(var(--soft-lilac) / 0.5), transparent 70%),
            radial-gradient(50% 40% at 88% 92%, hsl(var(--warm-blush) / 0.4), transparent 70%),
            radial-gradient(45% 40% at 8% 96%, hsl(var(--dawn-orange) / 0.35), transparent 70%),
            hsl(var(--pearl))
          `,
        }}
      />
      <div className="grain pointer-events-none fixed inset-0 -z-10 opacity-30" />

      <div className="relative mx-auto grid min-h-screen max-w-[1480px] grid-cols-[248px_1fr_336px]">
        {/* ============== Sidebar ============== */}
        <aside className="flex flex-col px-5 py-7 border-r border-foreground/[0.06]">
          <div className="px-3 mb-9 flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-foreground grid place-items-center shadow-[0_4px_12px_-4px_hsl(var(--slate-ink)/0.4)]">
              <div className="size-2 rounded-full bg-background" />
            </div>
            <span className="font-display text-[15px] font-semibold tracking-tight">Hirely</span>
          </div>

          <div className="px-3 mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/40">
            Workspace
          </div>
          <nav className="flex flex-col gap-0.5">
            {primaryNav.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>

          <div className="px-3 mt-8 mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/40">
            Tools
          </div>
          <nav className="flex flex-col gap-0.5">
            {secondaryNav.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>

          {/* Upgrade card — pastel glass, not heavy black */}
          <div
            className="mt-auto relative overflow-hidden rounded-2xl p-4 border border-white/70"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--soft-lilac) / 0.85), hsl(var(--ethereal-blue) / 0.75) 60%, hsl(var(--warm-blush) / 0.7))",
              boxShadow:
                "0 1px 0 hsl(0 0% 100% / 0.8) inset, 0 18px 40px -22px hsl(var(--slate-ink) / 0.18)",
            }}
          >
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/55">
              Pro
            </div>
            <div className="mt-1.5 font-display text-[15px] font-semibold leading-snug text-foreground">
              Unlock unlimited rewrites
            </div>
            <button className="mt-3.5 w-full rounded-lg bg-foreground text-background py-2 text-[12px] font-semibold hover:bg-foreground/90 transition-colors">
              Upgrade — $19/mo
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 px-1">
            <div
              className="size-8 rounded-full grid place-items-center text-[10px] font-semibold text-foreground border border-white/80"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--ethereal-blue)), hsl(var(--soft-lilac)))",
              }}
            >
              ER
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[12.5px] font-semibold truncate">Elena Rostova</span>
              <span className="text-[11px] text-foreground/45 truncate">elena@hirely.ai</span>
            </div>
          </div>
        </aside>

        {/* ============== Main ============== */}
        <main className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between px-10 bg-background/70 backdrop-blur-xl border-b border-foreground/[0.06]">
            <div className="flex items-center gap-2.5 text-[13px]">
              <span className="text-foreground/45">Workspace</span>
              <span className="text-foreground/25">/</span>
              <span className="font-medium">{active}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button className="group flex items-center gap-2.5 rounded-xl border border-foreground/[0.08] bg-white/70 backdrop-blur px-3 py-1.5 text-[12px] text-foreground/55 hover:border-foreground/15 transition-colors w-[260px]">
                <Search className="size-3.5" />
                <span className="flex-1 text-left">Search across your career…</span>
                <span className="inline-flex items-center gap-0.5 rounded-md bg-foreground/[0.05] px-1.5 py-0.5 text-[10px] font-medium">
                  <Command className="size-2.5" />K
                </span>
              </button>
              <button className="size-9 grid place-items-center rounded-xl border border-foreground/[0.08] bg-white/70 backdrop-blur text-foreground/60 hover:text-foreground transition-colors relative">
                <Bell className="size-4" />
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-emerald-500" />
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background px-3.5 py-2 text-[12.5px] font-semibold hover:bg-foreground/85 transition-colors shadow-[0_8px_20px_-8px_hsl(var(--slate-ink)/0.4)]">
                <Plus className="size-3.5" />
                New scan
              </button>
            </div>
          </header>

          <div className="flex-1 px-10 py-8">
            <Outlet />
          </div>
        </main>

        {/* ============== Right rail ============== */}
        <aside className="border-l border-foreground/[0.06] px-6 py-7 flex flex-col gap-4 overflow-y-auto">
          <RightRail />
        </aside>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all",
          isActive
            ? "bg-white/85 backdrop-blur text-foreground border border-white shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_1px_2px_hsl(var(--slate-ink)/0.04),0_8px_20px_-8px_hsl(var(--slate-ink)/0.1)]"
            : "text-foreground/55 hover:text-foreground hover:bg-white/40",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r-full bg-foreground" />
          )}
          <Icon className="size-4 shrink-0" />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

function RightRail() {
  return (
    <>
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/40">
        Today
      </div>

      {/* Streak — hero stat */}
      <div
        className="rounded-2xl border border-white/70 p-5 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(135deg, hsl(0 0% 100% / 0.85), hsl(var(--warm-blush) / 0.55))",
          boxShadow:
            "0 1px 0 hsl(0 0% 100% / 0.85) inset, 0 1px 2px hsl(var(--slate-ink) / 0.03), 0 18px 40px -22px hsl(var(--slate-ink) / 0.14)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-foreground/45">
            <Flame className="size-3" />
            Streak
          </div>
          <span className="text-[10px] font-mono text-foreground/40">+1 today</span>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-[40px] leading-none font-semibold tracking-tight tabular-nums">
            12
          </span>
          <span className="text-[13px] text-foreground/50">days</span>
        </div>
        <div className="mt-4 flex gap-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className={`h-6 flex-1 rounded-[3px] ${
                i < 12 ? "bg-foreground" : "bg-foreground/[0.07]"
              }`}
              style={i < 12 ? { opacity: 0.35 + (i / 14) * 0.65 } : undefined}
            />
          ))}
        </div>
      </div>

      {/* Applications */}
      <div
        className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/70 p-5"
        style={{
          boxShadow:
            "0 1px 0 hsl(0 0% 100% / 0.85) inset, 0 1px 2px hsl(var(--slate-ink) / 0.03)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-foreground/45">
            Applications
          </div>
          <TrendingUp className="size-3.5 text-emerald-600" />
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-[34px] leading-none font-semibold tracking-tight tabular-nums">
            7
          </span>
          <span className="text-[13px] text-foreground/45">/ 10 weekly goal</span>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: "70%",
              background:
                "linear-gradient(90deg, hsl(var(--slate-ink)), hsl(var(--slate-ink-soft)))",
            }}
          />
        </div>
      </div>

      {/* Next interview */}
      <div
        className="rounded-2xl border border-white/70 p-5 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(135deg, hsl(0 0% 100% / 0.85), hsl(var(--ethereal-blue) / 0.55))",
          boxShadow:
            "0 1px 0 hsl(0 0% 100% / 0.85) inset, 0 1px 2px hsl(var(--slate-ink) / 0.03)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-foreground/45">
            Next interview
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-medium">
            <span className="size-1 rounded-full bg-emerald-500" />
            Confirmed
          </span>
        </div>
        <div className="mt-3 font-display text-[17px] font-semibold tracking-tight">
          Stripe · Onsite
        </div>
        <div className="mt-1 text-[12px] text-foreground/55">
          Thu, Apr 30 · 2:00 PM PST
        </div>
        <div className="mt-3.5 flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {["#d4a574", "#7a9b8e", "#a89cb8"].map((c) => (
              <div
                key={c}
                className="size-5 rounded-full border-2 border-white"
                style={{ background: c }}
              />
            ))}
          </div>
          <span className="text-[11px] text-foreground/55">3 interviewers</span>
        </div>
      </div>

      {/* Suggestion CTA */}
      <button className="group flex items-center justify-between rounded-2xl bg-white/40 hover:bg-white/70 backdrop-blur border border-dashed border-foreground/15 px-4 py-3.5 text-[12.5px] font-medium text-foreground/70 hover:text-foreground transition-all">
        <span>3 AI rewrite suggestions</span>
        <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    </>
  );
}
