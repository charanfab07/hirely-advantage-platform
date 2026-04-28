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
  User,
  Clock,
  Star,
  LayoutGrid,
  Map,
  Layers,
  ChevronRight,
  PanelLeft,
  Filter,
  LayoutDashboard,
  Users,
  MoreHorizontal,
  Sparkles,
  Upload,
  Plus as PlusIcon,
} from "lucide-react";

const SKY = "205 70% 86%";        // muted soft sky
const SKY_DEEP = "210 60% 70%";   // restrained accent sky
const SKY_SOFT = "205 75% 96%";   // barely-there tint
const INK = "220 15% 12%";        // soft near-black

// Jira-style top-level rows (icon + label, optional chevron)
const topNav = [
  { to: "/app/for-you", label: "For you", icon: User },
  { to: "/app/recent", label: "Recent", icon: Clock, chevron: true },
  { to: "/app/starred", label: "Starred", icon: Star, chevron: true },
  { to: "/app/apps", label: "Apps", icon: LayoutGrid },
  { to: "/app/plans", label: "Plans", icon: Map },
  { to: "/app/spaces", label: "Spaces", icon: Layers, trailing: "actions" as const },
];

// "Recent" group inside Spaces — primary workspace areas live here
const spacesRecent = [
  { to: "/app/resume", label: "Resume", active: true },
  { to: "/app/outreach", label: "Outreach" },
  { to: "/app/applications", label: "Applications" },
];

// "Recommended" group
const recommended = [
  { to: "/app/voice", label: "Voice Coach", icon: Sparkles, badge: "TRY" },
  { to: "/app/import", label: "Import work", icon: Upload },
];

// Footer rows
const footerNav = [
  { to: "/app/filters", label: "Filters", icon: Filter },
  { to: "/app/score", label: "Dashboards", icon: LayoutDashboard },
];

const teamsRow = { to: "/app/teams", label: "Teams", icon: Users, external: true };
const allNav = [...topNav, ...spacesRecent.map((s) => ({ ...s, icon: FileText })), ...recommended, ...footerNav, teamsRow];

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const active =
    allNav.find((n: any) => n.to && pathname.startsWith(n.to))?.label ?? "Resume";

  return (
    <div
      className="relative min-h-screen antialiased overflow-hidden"
      style={{ color: `hsl(${INK})` }}
    >
      {/* Sky-blue → white gradient ambient wash */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(80% 60% at 0% 0%, hsl(${SKY} / 0.35), transparent 65%),
            radial-gradient(60% 50% at 100% 100%, hsl(${SKY_SOFT}), transparent 70%),
            linear-gradient(180deg, #ffffff 0%, hsl(${SKY_SOFT} / 0.6) 100%)
          `,
        }}
      />

      <div
        className="relative mx-auto grid min-h-screen max-w-[1480px] grid-cols-[232px_1fr_336px]"
        style={{ ["--ink" as any]: INK, ["--sky" as any]: SKY, ["--sky-deep" as any]: SKY_DEEP, ["--sky-soft" as any]: SKY_SOFT }}
      >
        {/* ============== Sidebar (Jira-style) ============== */}
        <aside className="flex flex-col px-2.5 py-3 border-r border-black/[0.06]">
          {/* Top row: app switcher + brand + collapse */}
          <div className="flex items-center justify-between px-1.5 mb-3">
            <div className="flex items-center gap-1.5">
              <button
                aria-label="App switcher"
                className="size-7 grid place-items-center rounded-md text-black/55 hover:text-black hover:bg-black/[0.04] transition-colors"
              >
                <LayoutGrid className="size-[15px]" />
              </button>
              <div className="flex items-center gap-1.5 px-1">
                <div
                  className="size-[22px] rounded-[6px] grid place-items-center shadow-[0_2px_6px_-2px_rgba(0,0,0,0.18)]"
                  style={{
                    background: `linear-gradient(135deg, hsl(${SKY}), hsl(${SKY_DEEP}))`,
                  }}
                >
                  <div className="size-1.5 rounded-full bg-white" />
                </div>
                <span className="text-[13.5px] font-semibold tracking-tight text-black">
                  Hirely
                </span>
              </div>
            </div>
            <button
              aria-label="Collapse sidebar"
              className="size-7 grid place-items-center rounded-md text-black/45 hover:text-black hover:bg-black/[0.04] transition-colors"
            >
              <PanelLeft className="size-[15px]" />
            </button>
          </div>

          {/* Top-level nav rows */}
          <nav className="flex flex-col gap-px">
            {topNav.map((item) => (
              <SideRow
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                chevron={(item as any).chevron}
                trailing={(item as any).trailing}
              />
            ))}
          </nav>

          {/* Spaces → Recent group */}
          <div className="mt-2.5 px-2 mb-1 text-[11px] font-medium text-black/45">
            Recent
          </div>
          <nav className="flex flex-col gap-px">
            {spacesRecent.map((item) => (
              <SpaceRow
                key={item.to}
                to={item.to}
                label={item.label}
                forceActive={item.active}
              />
            ))}
            <SideRow
              to="/app/more-spaces"
              label="More spaces"
              icon={MoreHorizontal}
              chevron
              indent
            />
          </nav>

          {/* Recommended group */}
          <div className="mt-2.5 px-2 mb-1 text-[11px] font-medium text-black/45">
            Recommended
          </div>
          <nav className="flex flex-col gap-px">
            {recommended.map((item) => (
              <SideRow
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                badge={(item as any).badge}
              />
            ))}
          </nav>

          {/* Footer rows */}
          <nav className="mt-2.5 flex flex-col gap-px">
            {footerNav.map((item) => (
              <SideRow
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </nav>

          {/* Teams pinned */}
          <div className="mt-3 pt-3 border-t border-black/[0.05]">
            <SideRow
              to={teamsRow.to}
              label={teamsRow.label}
              icon={teamsRow.icon}
              external
              emphasized
            />
            <button className="mt-1 flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-[13px] text-black/55 hover:text-black hover:bg-black/[0.04] transition-colors">
              <MoreHorizontal className="size-[15px] shrink-0" />
              <span>More</span>
            </button>
          </div>

          {/* Profile pinned bottom */}
          <div className="mt-auto pt-3 flex items-center gap-2 px-1">
            <div
              className="size-7 rounded-full grid place-items-center text-[10px] font-semibold text-white border border-white/80"
              style={{
                background: `linear-gradient(135deg, hsl(${SKY}), hsl(${SKY_DEEP}))`,
              }}
            >
              ER
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[12px] font-semibold truncate text-black">Elena Rostova</span>
              <span className="text-[10.5px] text-black/45 truncate">elena@hirely.ai</span>
            </div>
            <Settings className="size-3.5 ml-auto text-black/40" />
          </div>
        </aside>

        {/* ============== Main ============== */}
        <main className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between px-10 bg-white/70 backdrop-blur-xl border-b border-black/[0.06]">
            <div className="flex items-center gap-2.5 text-[13px]">
              <span className="text-black/45">Workspace</span>
              <span className="text-black/25">/</span>
              <span className="font-medium text-black">{active}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button className="group flex items-center gap-2.5 rounded-xl border border-black/[0.08] bg-white/80 backdrop-blur px-3 py-1.5 text-[12px] text-black/55 hover:border-black/15 transition-colors w-[260px]">
                <Search className="size-3.5" />
                <span className="flex-1 text-left">Search across your career…</span>
                <span className="inline-flex items-center gap-0.5 rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[10px] font-medium text-black/60">
                  <Command className="size-2.5" />K
                </span>
              </button>
              <button className="size-9 grid place-items-center rounded-xl border border-black/[0.08] bg-white/80 backdrop-blur text-black/60 hover:text-black transition-colors relative">
                <Bell className="size-4" />
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-emerald-500" />
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-white hover:-translate-y-px transition-all shadow-[0_8px_20px_-8px_rgba(0,0,0,0.35)]"
                style={{
                  background: `linear-gradient(135deg, hsl(${SKY_DEEP}), hsl(${SKY}))`,
                }}
              >
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
        <aside className="border-l border-black/[0.06] px-6 py-7 flex flex-col gap-4 overflow-y-auto">
          <RightRail />
        </aside>
      </div>
    </div>
  );
}

function SideRow({
  to,
  label,
  icon: Icon,
  chevron,
  trailing,
  badge,
  indent,
  external,
  emphasized,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  chevron?: boolean;
  trailing?: "actions";
  badge?: string;
  indent?: boolean;
  external?: boolean;
  emphasized?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
          indent ? "ml-3" : "",
          isActive
            ? "bg-black/[0.05] text-black font-medium"
            : emphasized
              ? "text-black font-medium hover:bg-black/[0.04]"
              : "text-black/70 hover:text-black hover:bg-black/[0.04]",
        ].join(" ")
      }
    >
      <Icon className="size-[15px] shrink-0 text-black/55 group-hover:text-black/80" />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="rounded-[4px] border border-black/15 px-1 py-px text-[9.5px] font-semibold tracking-wider text-black/65">
          {badge}
        </span>
      )}
      {trailing === "actions" && (
        <span className="flex items-center gap-1 text-black/45">
          <PlusIcon className="size-3.5 hover:text-black" />
          <MoreHorizontal className="size-3.5 hover:text-black" />
        </span>
      )}
      {chevron && <ChevronRight className="size-3.5 text-black/35" />}
      {external && <ArrowUpRight className="size-3.5 text-black/45" />}
    </NavLink>
  );
}

function SpaceRow({
  to,
  label,
  forceActive,
}: {
  to: string;
  label: string;
  forceActive?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => {
        const on = isActive || forceActive;
        return [
          "group relative flex items-center gap-2 rounded-md ml-3 px-2 py-1.5 text-[13px] transition-colors",
          on
            ? "text-black font-medium"
            : "text-black/70 hover:text-black hover:bg-black/[0.04]",
        ].join(" ");
      }}
      style={({ isActive }) =>
        isActive || forceActive
          ? {
              background: `linear-gradient(90deg, hsl(${SKY} / 0.55), hsl(${SKY_SOFT} / 0.6))`,
            }
          : undefined
      }
    >
      {({ isActive }) => {
        const on = isActive || forceActive;
        return (
          <>
            {on && (
              <span
                className="absolute -left-3 top-1/2 -translate-y-1/2 h-4 w-[2.5px] rounded-r-full"
                style={{ background: `hsl(${SKY_DEEP})` }}
              />
            )}
            <span className="flex-1 truncate">{label}</span>
          </>
        );
      }}
    </NavLink>
  );
}

function RightRail() {
  return (
    <>
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-black/40">
        Today
      </div>

      {/* Streak */}
      <div
        className="rounded-2xl border border-white p-5 backdrop-blur-xl"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.9), hsl(${SKY_SOFT} / 0.85))`,
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.9) inset, 0 18px 40px -22px rgba(0,0,0,0.14)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-black/45">
            <Flame className="size-3" />
            Streak
          </div>
          <span className="text-[10px] font-mono text-black/40">+1 today</span>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-[40px] leading-none font-semibold tracking-tight tabular-nums text-black">
            12
          </span>
          <span className="text-[13px] text-black/50">days</span>
        </div>
        <div className="mt-4 flex gap-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="h-6 flex-1 rounded-[3px]"
              style={
                i < 12
                  ? {
                      background: `linear-gradient(180deg, hsl(${SKY}), hsl(${SKY_DEEP}))`,
                      opacity: 0.55 + (i / 14) * 0.45,
                    }
                  : { background: "rgba(0,0,0,0.06)" }
              }
            />
          ))}
        </div>
      </div>

      {/* Applications */}
      <div
        className="rounded-2xl bg-white/85 backdrop-blur-xl border border-white p-5"
        style={{
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-black/45">
            Applications
          </div>
          <TrendingUp className="size-3.5 text-emerald-600" />
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-[34px] leading-none font-semibold tracking-tight tabular-nums text-black">
            7
          </span>
          <span className="text-[13px] text-black/45">/ 10 weekly goal</span>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: "70%",
              background: `linear-gradient(90deg, hsl(${SKY}), hsl(${SKY_DEEP}))`,
            }}
          />
        </div>
      </div>

      {/* Next interview */}
      <div
        className="rounded-2xl border border-white p-5 backdrop-blur-xl"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.9), hsl(${SKY} / 0.45))`,
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-black/45">
            Next interview
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-medium">
            <span className="size-1 rounded-full bg-emerald-500" />
            Confirmed
          </span>
        </div>
        <div className="mt-3 font-display text-[17px] font-semibold tracking-tight text-black">
          Stripe · Onsite
        </div>
        <div className="mt-1 text-[12px] text-black/55">
          Thu, Apr 30 · 2:00 PM PST
        </div>
        <div className="mt-3.5 flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {[`hsl(${SKY_DEEP})`, `hsl(${SKY})`, "#ffffff"].map((c, i) => (
              <div
                key={i}
                className="size-5 rounded-full border-2 border-white"
                style={{ background: c }}
              />
            ))}
          </div>
          <span className="text-[11px] text-black/55">3 interviewers</span>
        </div>
      </div>

      {/* Suggestion CTA */}
      <button className="group flex items-center justify-between rounded-2xl bg-white/50 hover:bg-white/80 backdrop-blur border border-dashed border-black/15 px-4 py-3.5 text-[12.5px] font-medium text-black/70 hover:text-black transition-all">
        <span>3 AI rewrite suggestions</span>
        <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    </>
  );
}
