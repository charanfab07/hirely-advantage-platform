import { isApprovedName } from "./templates";
import type { ResumeDocument } from "./types";

export type AtsScoreBreakdown = {
  layoutReadability: number;     // 0..25
  sectionHeadingClarity: number; // 0..25
  keywordReadability: number;    // 0..25
  exportSafety: number;          // 0..25
  total: number;                 // 0..100
  warnings: string[];
};

export function computeAtsScore(doc: ResumeDocument): AtsScoreBreakdown {
  const warnings: string[] = [];

  // 1. Layout readability — single col by construction, but check density.
  let layout = 25;
  const totalBullets =
    doc.content.experience.reduce((n, e) => n + e.bullets.length, 0) +
    doc.content.projects.reduce((n, p) => n + p.bullets.length, 0);
  if (doc.settings.fontSize < 10.5) {
    layout -= 4;
    warnings.push("Font size below 10.5pt may be hard for recruiters to read.");
  }
  if (doc.settings.spacing === "compact" && totalBullets > 18) {
    layout -= 3;
    warnings.push("Compact spacing with many bullets can look crowded.");
  }

  // 2. Section heading clarity — every enabled section must use an approved name.
  let headings = 25;
  for (const s of doc.sections.filter((x) => x.enabled)) {
    if (!isApprovedName(s.type, s.name)) {
      headings -= 4;
      warnings.push(`Section "${s.name}" uses a non-standard heading.`);
    }
  }
  if (headings < 0) headings = 0;

  // 3. Keyword readability — content density & skills coverage.
  let keywords = 0;
  const skillCount = doc.content.skills.reduce((n, g) => n + g.items.length, 0);
  if (skillCount >= 8) keywords += 10;
  else if (skillCount >= 4) keywords += 6;
  else if (skillCount >= 1) keywords += 3;
  else warnings.push("Add at least 6–10 skills so keyword scanners can match the role.");

  if (doc.content.summary.trim().split(/\s+/).length >= 30) keywords += 8;
  else warnings.push("Summary is short — aim for 3–4 lines that include role keywords.");

  if (totalBullets >= 6) keywords += 7;
  else warnings.push("Add more bullet points to your experience or projects for keyword coverage.");

  // 4. Export safety — accent contrast, allowed font, no weird names.
  let exportSafety = 25;
  const hex = doc.settings.accent.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance > 0.55) {
    exportSafety -= 5;
    warnings.push("Accent color is too light — use a darker tone for ATS contrast.");
  }
  if (!doc.content.personal.email.includes("@")) {
    exportSafety -= 6;
    warnings.push("Add a valid email address — recruiters and parsers need it.");
  }
  if (!doc.content.personal.name.trim()) {
    exportSafety -= 8;
    warnings.push("Add your full name at the top.");
  }

  const clamp = (n: number) => Math.max(0, Math.min(25, n));
  const out = {
    layoutReadability: clamp(layout),
    sectionHeadingClarity: clamp(headings),
    keywordReadability: clamp(keywords),
    exportSafety: clamp(exportSafety),
    total: 0,
    warnings,
  };
  out.total =
    out.layoutReadability +
    out.sectionHeadingClarity +
    out.keywordReadability +
    out.exportSafety;
  return out;
}
