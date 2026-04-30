# Fill the dashboard's empty space — minimally

The Resume Analyzer dashboard currently has a centered `max-w-6xl` column on a wide canvas. After we condensed the Score tab into a hero + accordion, the page often ends short — leaving a big quiet area at the bottom on desktop, and a thin band of unused width to the right of the headline. Goal: make the page feel **composed and intentional** at any scroll depth, while staying minimal.

## What we'll change

### 1. Headline row — pair it with a "Today" companion (right side)
Right now the headline `From ignored to interviewed.` sits alone with whitespace to its right. We'll keep the headline on the left and add a small, quiet companion card on the right (desktop only) that shows:
- Last analyzed: relative time (e.g. "2h ago")
- Resume filename / version chip
- A subtle "Re-analyze" ghost link (opens upload again)

Two-column grid: `lg:grid-cols-[1fr_280px]`. Mobile stays single column. No new data fetching — uses `latest` we already have.

### 2. Hero card — give it a quiet right-rail
Inside the hero `SectionCard`, the score+stats row leaves a noticeable gap between the stats grid and the card edge on desktop. We'll widen the inner layout to a 3-column grid on `lg`:
- **Left (40%)**: score number + summary
- **Middle (35%)**: 2×2 mini stats (already there)
- **Right (25%)**: a tiny vertical "Score trajectory" — last 3 analyses as a 3-dot sparkline using the existing `ScoreSparkline` component, with delta (+4, etc.). Falls back to a "First analysis" pill when only one exists.

Reuses `ScoreSparkline` (already in the codebase) and `analyses` array we already query.

### 3. After Quick Wins — add a low-key "Next best step" strip
A single horizontal row (not a card) with three small chips that pull from existing data:
- "Tailor to a role" (→ tailored tab)
- "Practice an interview" (→ /app/interview-prep)
- "Draft a cover letter" (→ /app/cover-letter)

Each chip is icon + label + a single muted descriptor line. This visually closes the page on desktop and gives the user a clear next action across the suite — the dashboard stops feeling like a dead-end.

### 4. Bottom — a thin "Footer rail"
A faint horizontal rail at the bottom of the page with three muted items, each ~12px text:
- "Last sync · {time}"
- "Resumes analyzed · {count}"
- "Hirely v1.0"

This anchors the page so the canvas never ends in raw whitespace.

### 5. Widen the content column slightly
Bump the analyzer container from `max-w-6xl` to `max-w-[1180px]` and increase outer padding rhythm. Combined with the right-side companions above, this fills the wide canvas without feeling crowded.

## What we will NOT do
- No new sections, no new fetches, no new tabs.
- No decorative illustrations or hero blobs (we already have the mesh background).
- No expanding the sidebar.
- No changes to mobile layout beyond stacking — it's already tight.

## Files to touch

- `src/pages/dashboard/ResumeAnalyzer.tsx` — headline row → 2-col, hero → 3-col rail, add Next-best-step chip row, add footer rail, container width.
- `src/components/dashboard/ScoreSparkline.tsx` — reuse as-is (read first to confirm props).
- (Possibly) a small new helper component `DashboardFooterRail.tsx` if the JSX gets long. Otherwise inline.

No DB, edge function, or schema changes.

## Visual sketch

```text
┌─────────────────────────────────────────────────────────────┐
│  TUE · APRIL 30                                  🔍  ⎋  U  │
│                                                              │
│  From ignored to interviewed.       ┌──────────────────┐     │
│                                     │ Last analyzed 2h │     │
│                                     │ resume_v3.pdf    │     │
│                                     │ Re-analyze →     │     │
│                                     └──────────────────┘     │
│  [ Score | Extracted | Issues | Tailored | History ]         │
│                                                              │
│  ┌────────── Hero card ────────────────────────────────┐    │
│  │  78/100        │  ATS  Match  │  • • •   +4 vs last│    │
│  │  summary…      │  Skills Iss. │  trajectory         │    │
│  └─────────────────────────────────────────────────────┘    │
│  Quick wins · 3                                              │
│  [ Tailor a role ] [ Practice interview ] [ Draft letter ]   │
│  Deep dive ▾                                                 │
│  ─────────────────────────────────────────────────────────   │
│  Last sync · 2h ago      4 resumes analyzed      Hirely v1.0 │
└─────────────────────────────────────────────────────────────┘
```

Approve and I'll implement.
