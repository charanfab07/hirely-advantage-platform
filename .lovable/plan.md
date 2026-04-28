## Resume Before/After — Redesign

Strip all foreign colors (red, green, lilac highlights). Use only the site's monochrome glass palette + foreground ink, matching Stats / Features / Hero. Simplify the layout so a user gets the message in 3 seconds.

### What changes

**Color cleanup**
- Remove red dot + red "Before" pill, green dot + green "After" pill
- Remove lilac/blue `<mark>` highlights on the after bullets
- Remove the aurora wash (lilac + ethereal-blue blurs) inside the card — the page background already handles atmosphere
- Replace with: muted glass for "Before", glass-strong for "After", subtle underline on key phrases instead of colored highlight

**Layout simplification**
- Drop the keyword pill rows from both cards (extra visual noise — the page already has +keyword chips elsewhere)
- 3 bullets per side instead of 4 — easier to scan
- Add a clear arrow between Before and After (filled dark circle with `ArrowRight`) so the transformation is obvious in one glance
- Add a thin horizontal score bar under each card (40-something filled vs near-full) — instant visual "got better"
- Score reads as small mono text "42 / 100" → "94 / 100" in the corner — quieter, cleaner
- Win chips become 3 plain centered numbers under a divider, not boxed cards

**Tone**
- "After" bullet emphasis = bold + thin underline using `foreground` only (no purple/blue marks)
- Subheading kept the same

### File touched
- `src/components/landing/ResumeCompare.tsx` — full rewrite, ~120 lines (down from ~140), no other files affected

### Result
Reads as one breath: muted card → arrow → crisp card → score jumped. Pure ink-on-pearl, identical visual vocabulary to the rest of the page.

Approve and I'll ship it.
