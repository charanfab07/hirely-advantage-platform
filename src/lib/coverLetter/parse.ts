// Heuristic parsers for resume header (sender) and JD (company / hiring
// manager). Best-effort, never throw — return undefined when unsure.

export function parseResumeContact(raw: string): {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
} {
  if (!raw) return {};
  const text = raw.replace(/\r\n/g, "\n");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const head = lines.slice(0, 40);
  const headBlob = head.join("\n");

  const emailMatch = headBlob.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  const email = emailMatch?.[0];

  const phoneMatch = headBlob.match(/(\+?\d[\d\s().-]{8,16}\d)/);
  const phone = phoneMatch?.[1]?.replace(/\s+/g, " ").trim();

  let name: string | undefined;
  for (const line of head.slice(0, 8)) {
    if (/[@\d]/.test(line)) continue;
    if (line.length > 60) continue;
    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 5) continue;
    const ok = words.every((w) => /^[A-Za-zÀ-ÿ'’.\-]{1,}$/.test(w));
    if (!ok) continue;
    name = words
      .map((w) =>
        w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1).toLowerCase(),
      )
      .join(" ");
    break;
  }

  let location: string | undefined;
  for (const line of head) {
    if (line === name) continue;
    if (/@/.test(line)) continue;
    if (!/,/.test(line)) continue;
    if (/\d{4,}/.test(line)) continue;
    if (line.length > 60) continue;
    if (/(linkedin|github|twitter|portfolio|http)/i.test(line)) continue;
    const parts = line.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length < 2 || parts.length > 3) continue;
    const ok = parts.every((p) => /^[A-Za-zÀ-ÿ'’.\- ]{2,}$/.test(p));
    if (!ok) continue;
    location = parts.join(", ");
    break;
  }

  return { name, email, phone, location };
}

export function parseJobDescription(jd: string): {
  company?: string;
  hiringManager?: string;
} {
  if (!jd) return {};
  const text = jd.replace(/\r\n/g, "\n");

  let company: string | undefined;
  const atMatch = text.match(
    /\bat\s+([A-Z][A-Za-z0-9&.\-']+(?:\s+[A-Z][A-Za-z0-9&.\-']+){0,3})\b/,
  );
  if (atMatch) company = atMatch[1].trim();

  if (!company) {
    const aboutMatch = text.match(
      /\bAbout\s+([A-Z][A-Za-z0-9&.\-']+(?:\s+[A-Z][A-Za-z0-9&.\-']+){0,3})\b/,
    );
    if (aboutMatch) company = aboutMatch[1].trim();
  }

  if (company) {
    company = company.replace(/\s+(is|are|we|our|the)$/i, "").trim();
  }

  let hiringManager: string | undefined;
  const hmMatch = text.match(
    /(?:hiring manager|reports? to|recruiter)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i,
  );
  if (hmMatch) hiringManager = hmMatch[1].trim();

  return { company, hiringManager };
}
