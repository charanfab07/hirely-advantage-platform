
# Pro plan — enforcement

Free is done. Next up is **Pro**. The good news: limits and counters already exist (`PLAN_LIMITS.pro` in `src/lib/entitlements.ts`, monthly `usage_counters` rows, server-side checks in every edge function). What's missing is **Advanced-upsell UX** when a Pro user hits a Pro ceiling, plus a small audit to confirm nothing slips past.

## Pro caps to enforce

```text
Feature                   Cap            Already counted?   UI today
------------------------  -------------  -----------------  ----------------------------
Resume analyses           15 / month     yes (analyses)     no upsell when capped
Cover letters             20 / month     yes                Free-only modal exists
Mock interviews           5 / month      yes                no upsell when capped
Interview questions       unlimited      n/a                —
Resume uploads            unlimited      n/a                —
Resume export             allowed        n/a                —
ATS deep dive / tabs      allowed        n/a                —
```

So the work is on **3 surfaces**: Resume Analyzer, Cover Letter Generator, Mock Interview / Interview Prep.

## Plan

### 1. Shared "Upgrade to Advanced" dialog
Create `src/components/dashboard/UpgradeAdvancedDialog.tsx` — same visual language as the existing `UpgradePlansDialog` in `CoverLetterGenerator.tsx`, but:
- Title/copy is dynamic per feature ("You've used your 15 monthly analyses", "You've used your 20 monthly cover letters", "You've used your 5 monthly mock interviews").
- Highlights the **Advanced** plan (unlimited) and shows **Teams** as the larger option; **Pro** is shown as "current plan" with a muted tick.
- "Continue on Pro next month" secondary action just closes the dialog.

This replaces the bespoke dialog inside `CoverLetterGenerator` so both Free→Pro and Pro→Advanced paths share one component (props decide which plan is "current").

### 2. Resume Analyzer (`src/pages/dashboard/ResumeAnalyzer.tsx`)
- Before calling `analyze-resume`, check `can("analyses")`. Free is already gated; add the Pro-cap path: when `plan === "pro"` and remaining is 0, open `UpgradeAdvancedDialog` with the analyses copy instead of the generic toast.
- Show a small inline meter near the "Analyze" button on Pro: `"Analyses this month: 12 / 15"` using `useEntitlements().usage` + `limit("analyses")`. Hidden for Free (already shows lock) and Advanced/Teams (unlimited).

### 3. Cover Letter Generator (`src/pages/dashboard/CoverLetterGenerator.tsx`)
- Refactor existing modal to use the shared `UpgradeAdvancedDialog`.
- Branch by plan: Free → highlight Pro; Pro → highlight Advanced. Same trigger point (`!canGenerate` on submit).
- Add the same "X / 20 this month" meter for Pro users.

### 4. Mock Interview / Interview Prep (`src/pages/dashboard/InterviewPrep.tsx` + `MockInterviewPanel`)
- Pro is capped at 5 mock interviews/month. Today the UI lets them start a session and only the edge function returns 402.
- Add a pre-flight `can("mock_interviews")` check before starting a session. On block, open `UpgradeAdvancedDialog` (mock-interview copy). Free users (limit 0) see the same dialog highlighting Pro.
- Add the "X / 5 this month" meter for Pro on the mock-interview start screen.

### 5. Edge functions — confirm 402 handling
The functions already enforce caps via `supabase/functions/_shared/entitlements.ts`. Audit the three Pro-capped flows (`analyze-resume`, `generate-cover-letter`, `mock-interview`) and make sure:
- They return HTTP 402 with `{ code: "OVER_QUOTA", feature, plan }` when the user is over the Pro ceiling.
- The client catches 402 and opens `UpgradeAdvancedDialog` — so even if the in-UI counter is stale (e.g. another tab), the upgrade prompt still appears instead of a generic error toast.

### 6. Pricing CTA wiring (small)
On `/app/upgrade`, when the user's current plan is Pro, the **Pro** card swaps its CTA to "Current plan" (disabled), and **Advanced** becomes the highlighted card with the "Most Popular" badge. `Pricing.tsx` gets a `currentPlan?: AppPlan` prop to drive this.

## Out of scope (next passes)

- Real billing wiring (Paddle/Stripe). Plan changes still happen via SQL/admin until you say go on payments.
- Advanced and Teams enforcement (Advanced has unlimited on most things, but `cover_letters: 100` and Teams seat management still need work).
- Yearly billing toggle actually changing prices on the server.

## Confirm to proceed

Reply "go" and I'll implement steps 1–6 above. Want me to also wire payments (Stripe or Paddle) in this same pass, or keep that separate?
