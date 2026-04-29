# Dashboard build plan — "macOS sheet" direction

## Goal
Add an authenticated dashboard at `/app` that lives on the same aurora background as the landing, uses Apple-style SF-Pro typography, the landing palette (pearl + ethereal-blue + soft-lilac + warm-blush, with violet `#6D54B3` as the single accent), and a left sidebar surfacing the three core tools: **Resume Analyzer**, **Cover Letter Generator**, **Interview Prep**.

No auth/backend changes in this pass — pure UI shell with placeholder data so we can iterate on look-and-feel before wiring anything up.

## Routes

```
/                     Landing (unchanged)
/app                  → redirects to /app/resume
/app/resume           Resume Analyzer  (default)
/app/cover-letter     Cover Letter Generator
/app/interview-prep   Interview Prep
/app/applications     Applications tracker
/app/saved            Saved roles
```

The landing's "Get My Resume Score" CTA and Navbar "Sign in" link will point to `/app`.

## File structure

```
src/
  pages/
    dashboard/
      DashboardLayout.tsx       Shell: aurora + sidebar + main outlet
      ResumeAnalyzer.tsx        Default view (the prototype B canvas)
      CoverLetterGenerator.tsx  Placeholder with same shell typography
      InterviewPrep.tsx         Placeholder
      ApplicationsPage.tsx      Placeholder
      SavedPage.tsx             Placeholder
  components/
    dashboard/
      Sidebar.tsx               Left nav (Suite + Tracking + Pro card)
      SegmentedTabs.tsx         Reusable iOS-style segmented control
      StatStrip.tsx             4-up divided stat row
      SectionCard.tsx           Glass card wrapper
```

`src/App.tsx` gets the new routes nested under `<DashboardLayout />`.

## Visual system

Reuses landing tokens from `src/index.css` — no new CSS variables needed.

- **Background**: Reuse `<MeshGradient />` from the landing inside `DashboardLayout` so the aurora ribbons, sparks, and cursor spotlight follow the user across both surfaces.
- **Typography**: SF Pro stack already configured (`font-display`). Headings use `tracking-[-0.035em]` and `font-semibold`. Body 13–14px, eyebrows 10–11px uppercase with `tracking-[0.22em]`.
- **Cards**: `rounded-[22px]` glass — `bg-white/55 backdrop-blur-2xl border border-white/70` plus the existing `--shadow-glass` token.
- **Accent**: violet `#6D54B3` (matching the landing "Interviewed" gradient) for the single highlighted metric, active-state dot, and primary CTA in the dark hero card. All other UI is black/white/glass.
- **Tabs**: segmented pill control — outer `bg-black/[0.05]` track, inner active pill `bg-white` with subtle 1px shadow. Used inside Resume Analyzer for Score / Keywords / Impact rewrites / Versions.
- **Dark accent card**: the small "Interviews · 5" card uses `linear-gradient(160deg,#0E0B1F,#3a2d5e)` with a `#C8B6FF` button, matching the landing's deeper accent moments.

## Sidebar

Width 210px, transparent (sits directly on the aurora — no card wrapper).

```
[H] Hirely

SUITE
 • Resume Analyzer        ← active row (white glass pill)
   Cover Letter Generator
   Interview Prep

TRACKING
   Applications      28
   Outreach          14
   Saved             12

[Hirely Pro upsell card — dark gradient, "Upgrade" button]
```

Active state: white glass pill with inset highlight; inactive: 13px `text-black/55`, hover to full black + faint white wash. A tiny violet dot marks the active route. Section headers are 10px uppercase `tracking-[0.22em] text-black/35`.

A top-bar collapse trigger lets the sidebar tuck away on narrow screens; on mobile (<768px) it becomes a sheet that slides in from the left.

## Resume Analyzer page (the hero view)

Top row: eyebrow date + searchbox (`⌘K` placeholder) + avatar.

Display headline: `From ignored to interviewed.` — "interviewed" rendered with the same black→violet→black gradient used on the landing, so the brand line is instantly recognizable.

Segmented tabs (Score / Keywords / Impact rewrites / Versions). Score is the default panel and contains:

1. **Score card (col-span 2)** — large `94` numeral at 80px with `tracking-[-0.045em]`, `+12 pts` violet pill, a 3px gradient progress bar (black → violet) at 94%, and the line "Beats 89% of senior PM resumes in your market."
2. **Interviews card (dark, col-span 1)** — `5` interviews, "2 scheduled this week", lilac CTA "Open prep →" linking to `/app/interview-prep`.
3. **Stat strip** below — Applied 28 / Screening 11 / **Interview 5** (violet) / Offer 1, divided by 1px hairlines inside a single faint glass shell.

Other tab panels render skeleton placeholders for now so we can fill them iteratively.

## Other pages (lightweight in this pass)

Cover Letter Generator and Interview Prep get the same shell (eyebrow + display headline + segmented tabs + one hero card) but with placeholder content so the navigation feels complete:

- **Cover Letter Generator** — tabs: Compose / Tone / History. Hero card shows a textarea with a "Generate with AI" CTA stub.
- **Interview Prep** — tabs: Practice / Question bank / Recordings. Hero card shows the upcoming Linear screen + a "Start mock interview" CTA stub.

Applications and Saved are simple list placeholders.

## Landing → dashboard wiring

- `Hero.tsx` "Get My Resume Score" button: `href="#features"` → `to="/app"`.
- `Navbar.tsx` "Sign in" / "Get Started": link to `/app`.
- `FinalCTA.tsx` form submission: navigate to `/app` on submit.

(No real auth yet — these are entry points so the dashboard is reachable.)

## Out of scope for this pass

- Backend / Supabase auth, file uploads, real ATS scoring.
- AI generation for cover letters / mock interview voice flow.
- Persistence of applications/saved lists.

These get layered in once the visual shell is approved.

## Technical notes

- `MeshGradient` is reused as-is; it's already `position: fixed` so it works under any route.
- Segmented tab component is presentational only (controlled `value` / `onChange`) — no router coupling, so we can drop it into any page.
- All new components are TypeScript + Tailwind, using existing shadcn primitives (`Button`, `Input`) where useful but no new shadcn additions required.
- Mobile: sidebar collapses to a sheet at `<768px`; main content reflows to single column at `<lg`.
