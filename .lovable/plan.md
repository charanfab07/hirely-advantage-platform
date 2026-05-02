# Plan: Top 5 high-impact improvements

I picked the 5 changes with the best ratio of user-visible impact to risk. No speculative features — every item is grounded in the current codebase.

---

## 1. Remove fake counts on placeholder sidebar items

**Problem:** Sidebar shows hardcoded `count: 28 / 14 / 12` for Applications, Outreach, Saved — but those routes render `PlaceholderPage`. It's misleading.

**Fix:**
- In `src/components/dashboard/Sidebar.tsx`, drop the `count` field for these three items and add a small "Soon" badge instead.
- Keep the routes so links don't 404, but the sidebar stops lying about data.

---

## 2. Dynamic upgrade card (Free → Pro, Pro → Advanced)

**Problem:** Sidebar shows the same "Upgrade to Pro" block to everyone, including users already on Pro.

**Fix:**
- In `Sidebar.tsx`, read `useEntitlements()` to determine the tier.
- Free users see "Upgrade to Pro" (existing copy).
- Pro users see "Unlock Advanced" pointing at unlimited analyses + voice mode (already memoed as Advanced-only).
- Advanced users see no upgrade card — replace with a tiny "Advanced" pill.

---

## 3. Move `UsageMeter` into the dashboard shell

**Problem:** `UsageMeter` is mounted per-page. Users only see usage on the page they happen to visit, and each page refetches.

**Fix:**
- Mount `UsageMeter` once in the dashboard layout (the file that renders `<Outlet />` for `/app/*`), in the header or above the sidebar footer.
- Remove the per-page mounts from `InterviewPrep`, `CoverLetterGenerator`, `ResumeAnalyzer`, `MockInterview`.
- One fetch, always visible, no duplication.

---

## 4. Refactor `CoverLetterGenerator.tsx` (1457 lines)

**Problem:** One file holds export logic, typography helpers, the editor, the preview, history, and the form. Hard to scan, slow to edit, easy to break.

**Fix — extract into:**
- `src/lib/letterExport.ts` — DOCX/PDF/copy helpers
- `src/components/dashboard/cover-letter/LetterEditor.tsx` — editable letter body
- `src/components/dashboard/cover-letter/LetterPreview.tsx` — read-only formatted view
- `src/components/dashboard/cover-letter/LetterHistory.tsx` — past letters list
- `CoverLetterGenerator.tsx` becomes the orchestrator (form + state + composition).

No behavior change. Pure structural refactor with the same props/state shape.

---

## 5. Cache resume analyses by content hash

**Problem:** `resumes.content_hash` already exists, but `ResumeAnalyzer` re-runs the AI analysis every time the user clicks Analyze on the same resume + role. Wastes a Pro-cap unit and adds latency.

**Fix:**
- Before invoking the analyze edge function, query `resume_analyses` for `(user_id, resume_id, target_role)` ordered by `created_at desc limit 1`.
- If a row exists and the resume's `content_hash` hasn't changed since that analysis, hydrate the UI from it instead of calling the model. Add a small "Cached — Re-run" button so users can force a fresh run.
- No schema change required (all needed columns exist).

---

## Out of scope (intentionally deferred)

- Voice interview mode — already memoed for Advanced; build when monetization is ready.
- `ResumeAnalyzer.tsx` (1195 lines) refactor — valuable but lower urgency than the cover letter one because tabs already partially split it.
- `MeshGradient` re-animation polish — cosmetic.
- Practice-again / pinning for interview questions — feature, not polish.

---

## Technical notes

- No DB migrations.
- No new edge functions.
- No new dependencies.
- Entitlement gating reuses existing `useEntitlements` + `UpgradeAdvancedDialog` (per Core memory).
- All five items are independent and can ship in any order; I'll do them in the listed order.

Approve and I'll execute.