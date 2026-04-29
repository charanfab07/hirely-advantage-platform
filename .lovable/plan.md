# Above-the-fold upgrade — Resume Analyzer

## Goal
Make the dashboard's first viewport feel like a complete morning status page, not a marketing card. Two concrete additions:

1. A third hero column (**Today** card) next to Score and Interviews.
2. A slim **30-day score sparkline** strip above the pipeline stats, giving visual proof of "+12 pts".

No backend changes. Pure UI, mock data, fits the existing aurora/glass system.

## New layout

Current hero is `grid-cols-3` (Score 2 / Interviews 1). Switching to a 12-column grid gives room for the third column without crowding:

```text
┌────────────────────────────┬───────────────┬───────────┐
│ Score                      │ Interviews    │ Today     │
│ (col-span 7)               │ (col-span 3)  │ (span 2)  │
│ 94/100, gradient bar, CTAs │ dark, "5",    │ "1 task   │
│                            │ Open prep →   │ due", mini│
│                            │               │ checklist │
└────────────────────────────┴───────────────┴───────────┘
┌──────────────────────────────────────────────────────────┐
│ Score · last 30 days   82 → 94   +12 pts        sparkline│
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ Applied 28 │ Screening 11 │ Interview 5 │ Offer 1        │
└──────────────────────────────────────────────────────────┘
```

Below `lg`, it collapses to single column in a sensible order: Score → Today → Interviews → Sparkline → Stats.

## New components

### `src/components/dashboard/TodayCard.tsx`
- Eyebrow "Today" + small `done/total` badge top-right.
- Big number `{pending.length}` followed by "task due / tasks due".
- A highlighted **focus task** row (first pending task) inside a soft inner card: title + duration ("Polish Linear cover letter · 12 min").
- A 3-row mini checklist: violet-filled circle with check for done, hairline circle for open. Done items get strike-through and dimmed text.
- Footer link "View all →" in violet.
- Default mock tasks:
  - "Polish Linear cover letter" · 12 min · pending  ← focus
  - "Confirm Wed 2:30 with Karri" · 2 min · done
  - "Run STAR drill · leadership" · 15 min · pending
- Uses `SectionCard` glass tone for visual continuity with Score card.

### `src/components/dashboard/ScoreSparkline.tsx`
- Pure inline SVG (no chart lib — keeps the bundle clean).
- Eyebrow: "Score · last 30 days"; large readout: `82 → 94` with violet `+12 pts` pill.
- Right side (sm+): faint "30 daily snapshots" caption.
- 100×28 viewBox area chart:
  - Line stroke uses the same black→violet gradient as the Score progress bar (`#0E0B1F → #6D54B3`).
  - Subtle violet area fill underneath (22% → 0% opacity).
  - White-fill / violet-stroke dot at the latest point ("today" marker).
  - `vector-effect="non-scaling-stroke"` so the line stays crisp when the SVG stretches.
- Default data: realistic 30-point ramp from 82 to 94 with small noise; component accepts `data?: number[]` for later real data.

## Resume Analyzer wiring

In `src/pages/dashboard/ResumeAnalyzer.tsx` (Score tab only):

1. Replace the existing 3-col hero grid with `grid-cols-1 lg:grid-cols-12 gap-4`.
2. Score card → `lg:col-span-7`.
3. Interviews card → `lg:col-span-3`.
4. New `<TodayCard />` → `lg:col-span-2` (will read 2-of-12, which is narrow on huge screens; on `lg` it stays comfortably readable).
5. After the hero row, add `<ScoreSparkline />` as a full-width strip with `mt-4`.
6. The existing `<StatStrip />` follows the sparkline.

The Score card itself gets one small refinement: drop its bottom "Beats 89% of senior PM resumes" line down to a tighter `mt-2` so the card height roughly matches the new Today card column visually.

## Responsive

- `<lg` (≤1023px): everything stacks. Sparkline still renders full-width and looks great because the SVG is fluid.
- `sm` (≥640px): Today card stays comfortably sized; the 28-data-point line is dense enough to look like a real trend, not a stub.
- `prefers-reduced-motion` is unaffected — these are static visuals, no animation added.

## Out of scope (saved for next pass)
- Real task model / persistence.
- Real score history (will plug in once we have a scoring backend).
- Strengths / Gaps / Risks card and Quick Wins — separate bundle.

## Files touched
- **NEW** `src/components/dashboard/TodayCard.tsx`
- **NEW** `src/components/dashboard/ScoreSparkline.tsx`
- **EDIT** `src/pages/dashboard/ResumeAnalyzer.tsx` — restructure hero grid + insert sparkline
