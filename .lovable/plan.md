# Free Plan — Feature Audit

This is a status report only — no code changes yet. Step 2 (enforcement) follows once you approve.

## Headline finding

The app has **no plan system at all**. There's no `plan` column on `profiles`, no `usage` table, no quota checks in any edge function, and no gating in the UI. Every signed-in user today has the full feature set, regardless of which tier they "bought." That means most Free-plan limits below are currently **violated by default**.

## Status per Free-plan bullet

```text
Feature                              Status        Where it lives
-----------------------------------  ------------  -------------------------------------
1 resume upload                      VIOLATED      ResumeUploadCard.tsx — unlimited
ATS score only (no breakdown)        VIOLATED      ResumeAnalyzer.tsx — full breakdown shown
2 improvement suggestions            VIOLATED      QuickWins shows top 3; deep-dive shows all
1 cover letter (watermarked)         VIOLATED      CoverLetterGenerator — unlimited, no watermark
3 interview questions                PARTIAL       InterviewPrep generates batches; no hard cap
No export                            VIOLATED      PDF / DOCX / TXT export buttons always visible
```

### Detail

- **1 resume upload** — `ResumeUploadCard` calls `supabase.from("resumes").insert(...)` with no count check. Users can upload as many resumes as they want.
- **ATS score only (no breakdown)** — The Score tab in `ResumeAnalyzer` shows `ats_score`, `score_breakdown`, strengths, weaknesses, bullet rewrites, and the full Deep Dive accordion. Free should see only the headline ATS number.
- **2 improvement suggestions** — `QuickWins` already slices to 3, and weaknesses/rewrites accordions render every item. Free should be capped at 2 quick wins and the rest should be locked behind an Upgrade prompt.
- **1 cover letter (watermarked)** — `generate-cover-letter` and `CoverLetterGenerator` have no per-user counter and produce clean PDF/DOCX. No watermark logic exists. Free should be capped at 1 generated letter, and exports should be watermarked.
- **3 interview questions** — `generate-interview-questions` takes a count from the client and has no plan-aware ceiling. The InterviewPrep page can request more. Free should hard-cap at 3 lifetime questions.
- **No export** — `ResumeEditor` (PDF / DOCX / TXT), `CoverLetterGenerator` (PDF / DOCX / TXT), and the cover letter download buttons are always enabled. Free should hide or disable all export buttons.

## What's missing in the backend

To actually enforce any of the above, we need:

1. **A plan source of truth.** New `plan` column on `profiles` (`free | pro | advanced | teams`), defaulting to `free`. Set in `handle_new_user()`.
2. **Usage counters.** New `usage_counters` table keyed by `(user_id, period_start)` with monthly counts for `resume_uploads`, `analyses`, `cover_letters`, `mock_interviews`, `interview_questions`. RLS: user can read own, edge functions write via service role.
3. **A `useEntitlements()` hook** on the client returning `{ plan, limits, usage, can(featureKey) }` so UI can disable buttons and show locks consistently.
4. **Server-side checks in edge functions** (`analyze-resume`, `generate-cover-letter`, `generate-interview-questions`, `enhance-resume`, `tailor-resume`, `mock-interview`) that read the user's plan + counters and reject (HTTP 402) when over quota.

## Proposed enforcement plan for the Free tier (next step)

If you approve, I will then:

1. **Schema**
   - Add `plan` to `profiles` (default `free`).
   - Create `usage_counters` table + RLS.
   - Update `handle_new_user()` to seed the row.
2. **Entitlements**
   - Add `src/lib/entitlements.ts` with the per-plan limit map.
   - Add `useEntitlements()` hook.
3. **UI gating (Free tier)**
   - `ResumeUploadCard`: block second upload, show "Upgrade for more uploads."
   - `ResumeAnalyzer`: on Free, hide Enhanced / Compare / Issues / Tailored / History tabs and the Deep Dive sections; show only the ATS hero number + a locked "Unlock full breakdown" card. Cap Quick Wins at 2.
   - `CoverLetterGenerator`: block second generation; stamp "Generated with Hirely Free" watermark on the preview and disable PDF/DOCX, leaving only a watermarked TXT or watermarked PDF.
   - `InterviewPrep`: cap question generation at 3 total; disable further generation with an upgrade nudge.
   - `ResumeEditor`: hide PDF / DOCX / TXT buttons on Free; show "Export available on Pro" pill.
4. **Edge-function checks**
   - In each function, read `profiles.plan` + relevant `usage_counters` row, reject with 402 if over quota, and increment the counter on success.
5. **Upgrade affordances**
   - Every locked surface routes to `/app/upgrade` (already built) with the matching plan pre-highlighted.

## Out of scope for this step

- Real billing / Paddle / Stripe wiring. We'll model the plan field manually for now (settable via SQL or admin), and wire payments separately when you're ready.
- Pro / Advanced / Teams enforcement — we'll do those in follow-up passes the same way, one tier at a time, as you requested.

## Confirm to proceed

Reply "go" (or with edits) and I'll implement the Free-tier enforcement above. We'll then move to Pro next.
