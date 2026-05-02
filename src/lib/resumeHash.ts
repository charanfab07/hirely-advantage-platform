// Deterministic content hash for a resume's extracted text. The same text
// always produces the same hash so we can dedupe re-uploads of the same file.
export async function hashResumeText(text: string): Promise<string> {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  const bytes = new TextEncoder().encode(normalized);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
