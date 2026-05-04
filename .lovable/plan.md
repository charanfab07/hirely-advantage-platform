## What I'll ship

Two small, grounded improvements. Both are low-risk and independent.

---

### 1. Global usage meter strip in the dashboard shell

**Why:** `UsageMeter` is currently mounted on 4 different pages (Analyzer, Cover Letter, Interview Prep, Compare). Each page refetches and users only see usage on the page they happen to be on.

**Changes:**
- New `src/components/dashboard/UsageMeterStrip.tsx` — renders three meters: `analyses`, `cover_letters`, `mock_interviews`. Each meter already hides itself when the plan grants unlimited, so on Advanced/Teams the strip renders nothing.
- `src/pages/dashboard/DashboardLayout.tsx` — mount the strip once, top-right of the main pane (desktop) and below the mobile top bar.
- Remove the per-page mounts from `ResumeAnalyzer.tsx` (line 196), `CoverLetterGenerator.tsx` (line 760), `InterviewPrep.tsx` (lines 284–285).
- `CompareResumes.tsx` keeps its `resume_uploads` meter (it's the only page that exposes that counter and it sits next to the Upload button — contextually useful).

One fetch source per session (`useEntitlements`), always visible, no duplication.

---

### 2. "Cached — Re-run" affordance on Resume Analyzer

**Why:** `ResumeUploadCard` now silently reuses a prior analysis when `(content_hash, target_role)` matches. Power users have no way to force a fresh AI run when they want one (e.g. iterating on prompts, trying again after a model improvement).

**Changes:**
- `ResumeUploadCard.tsx`: add an optional `forceRefresh?: boolean` prop. When true, skip the cached-analysis lookup and always invoke `analyze-resume`.
- `ResumeAnalyzer.tsx`: when `latest` exists and the user re-uploads, surface a small "Loaded from cache" pill on the score hero with a "Re-run analysis" link that re-invokes the edge function for the same `(resume_id, target_role)`.
  - Implementation: small "Re-analyze" button next to the score (calls `analyze-resume` directly with `resume_id` + `target_role` from `latest`, then `refresh()`).
  - Respects entitlement: button disabled + tooltip when `ent.can("analyses")` is false; on click of disabled, opens `UpgradePlanDialog`.
- Track when the most recent analysis came from cache: `ResumeUploadCard` already returns the `analysisId`; we add a second callback arg `{ cached: boolean }` so the Analyzer can show a one-time "Loaded cached analysis · Re-run" toast/pill.

No DB or edge-function changes needed.

---

## Files touched

- `src/components/dashboard/UsageMeterStrip.tsx` *(new)*
- `src/pages/dashboard/DashboardLayout.tsx`
- `src/pages/dashboard/ResumeAnalyzer.tsx`
- `src/pages/dashboard/CoverLetterGenerator.tsx`
- `src/pages/dashboard/InterviewPrep.tsx`
- `src/components/dashboard/ResumeUploadCard.tsx`

## Out of scope (deferred, as before)

- Cover Letter refactor (1457 lines) — separate pass, bigger diff.
- CompareResumes route removal — needs your decision on whether the page stays as a standalone tool.

Approve and I'll execute.
