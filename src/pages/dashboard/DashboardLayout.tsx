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
    <div className="min-h-screen bg-[#F6F5F2] text-[#0F0F0E] antialiased">
      {/* very subtle paper grain */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      <div className="relative mx-auto grid min-h-screen max-w-[1480px] grid-cols-[248px_1fr_336px]">
        {/* ============== Sidebar ============== */}
        <aside className="flex flex-col px-5 py-7 border-r border-[#0F0F0E]/[0.06]">
          <div className="px-3 mb-9 flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-[#0F0F0E] grid place-items-center">
              <div className="size-2 rounded-full bg-[#F6F5F2]" />
            </div>
            <span className="font-display text-[15px] font-semibold tracking-tight">Hirely</span>
          </div>

          <div className="px-3 mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[#0F0F0E]/40">
            Workspace
          </div>
          <nav className="flex flex-col gap-0.5">
            {primaryNav.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>

          <div className="px-3 mt-8 mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[#0F0F0E]/40">
            Tools
          </div>
          <nav className="flex flex-col gap-0.5">
            {secondaryNav.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>

          {/* Upgrade card */}
          <div className="mt-auto rounded-2xl bg-[#0F0F0E] text-[#F6F5F2] p-4 shadow-[0_14px_40px_-18px_rgba(15,15,14,0.6)]">
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
              Pro
            </div>
            <div className="mt-1.5 font-display text-[15px] font-semibold leading-snug">
              Unlock unlimited rewrites
            </div>
            <button className="mt-3.5 w-full rounded-lg bg-white text-[#0F0F0E] py-2 text-[12px] font-semibold hover:bg-white/90 transition-colors">
              Upgrade — $19/mo
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 px-1">
            <div className="size-8 rounded-full bg-gradient-to-br from-[#0F0F0E] to-[#3a3835] grid place-items-center text-[10px] font-semibold text-white">
              ER
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[12.5px] font-semibold truncate">Elena Rostova</span>
              <span className="text-[11px] text-[#0F0F0E]/45 truncate">elena@hirely.ai</span>
            </div>
          </div>
        </aside>

        {/* ============== Main ============== */}
        <main className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between px-10 bg-[#F6F5F2]/80 backdrop-blur-md border-b border-[#0F0F0E]/[0.06]">
            <div className="flex items-center gap-2.5 text-[13px]">
              <span className="text-[#0F0F0E]/45">Workspace</span>
              <span className="text-[#0F0F0E]/25">/</span>
              <span className="font-medium">{active}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button className="group flex items-center gap-2.5 rounded-xl border border-[#0F0F0E]/[0.08] bg-white px-3 py-1.5 text-[12px] text-[#0F0F0E]/55 hover:border-[#0F0F0E]/15 transition-colors w-[260px]">
                <Search className="size-3.5" />
                <span className="flex-1 text-left">Search across your career…</span>
                <span className="inline-flex items-center gap-0.5 rounded-md bg-[#0F0F0E]/[0.05] px-1.5 py-0.5 text-[10px] font-medium">
                  <Command className="size-2.5" />K
                </span>
              </button>
              <button className="size-9 grid place-items-center rounded-xl border border-[#0F0F0E]/[0.08] bg-white text-[#0F0F0E]/60 hover:text-[#0F0F0E] transition-colors relative">
                <Bell className="size-4" />
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-emerald-500" />
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F0F0E] text-[#F6F5F2] px-3.5 py-2 text-[12.5px] font-semibold hover:bg-[#0F0F0E]/85 transition-colors">
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
        <aside className="border-l border-[#0F0F0E]/[0.06] px-6 py-7 flex flex-col gap-4 overflow-y-auto">
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
            ? "bg-white text-[#0F0F0E] shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_1px_2px_rgba(15,15,14,0.04),0_8px_20px_-8px_rgba(15,15,14,0.08)]"
            : "text-[#0F0F0E]/55 hover:text-[#0F0F0E] hover:bg-[#0F0F0E]/[0.025]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r-full bg-[#0F0F0E]" />
          )}
          <Icon className="size-4 shrink-0" />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

import { Flame, ArrowUpRight, TrendingUp } from "lucide-react";

function RightRail() {
  return (
    <>
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#0F0F0E]/40">
        Today
      </div>

      {/* Streak — hero stat */}
      <div className="rounded-2xl bg-gradient-to-br from-white to-[#FBFAF7] border border-[#0F0F0E]/[0.06] p-5 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_1px_2px_rgba(15,15,14,0.03),0_18px_40px_-22px_rgba(15,15,14,0.12)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#0F0F0E]/45">
            <Flame className="size-3" />
            Streak
          </div>
          <span className="text-[10px] font-mono text-[#0F0F0E]/40">+1 today</span>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-[40px] leading-none font-semibold tracking-tight tabular-nums">
            12
          </span>
          <span className="text-[13px] text-[#0F0F0E]/50">days</span>
        </div>
        <div className="mt-4 flex gap-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className={`h-6 flex-1 rounded-[3px] ${
                i < 12 ? "bg-[#0F0F0E]" : "bg-[#0F0F0E]/[0.06]"
              }`}
              style={i < 12 ? { opacity: 0.35 + (i / 14) * 0.65 } : undefined}
            />
          ))}
        </div>
      </div>

      {/* Applications */}
      <div className="rounded-2xl bg-white border border-[#0F0F0E]/[0.06] p-5 shadow-[0_1px_2px_rgba(15,15,14,0.03)]">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#0F0F0E]/45">
            Applications
          </div>
          <TrendingUp className="size-3.5 text-emerald-600" />
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-[34px] leading-none font-semibold tracking-tight tabular-nums">
            7
          </span>
          <span className="text-[13px] text-[#0F0F0E]/45">/ 10 weekly goal</span>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#0F0F0E]/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0F0F0E] to-[#3a3835] transition-all duration-700"
            style={{ width: "70%" }}
          />
        </div>
      </div>

      {/* Next interview */}
      <div className="rounded-2xl bg-white border border-[#0F0F0E]/[0.06] p-5 shadow-[0_1px_2px_rgba(15,15,14,0.03)]">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#0F0F0E]/45">
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
        <div className="mt-1 text-[12px] text-[#0F0F0E]/55">
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
          <span className="text-[11px] text-[#0F0F0E]/55">3 interviewers</span>
        </div>
      </div>

      {/* Suggestion CTA */}
      <button className="group flex items-center justify-between rounded-2xl bg-[#0F0F0E]/[0.025] hover:bg-[#0F0F0E]/[0.05] border border-dashed border-[#0F0F0E]/15 px-4 py-3.5 text-[12.5px] font-medium text-[#0F0F0E]/70 hover:text-[#0F0F0E] transition-all">
        <span>3 AI rewrite suggestions</span>
        <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    </>
  );
}
