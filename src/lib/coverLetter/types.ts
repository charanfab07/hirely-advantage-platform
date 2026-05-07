// Types, constants, and small pure helpers shared across the cover letter
// flow. Kept framework-free so they can be imported from both UI and
// export-utility modules.
import { AlignmentType } from "docx";

export type Tone = "confident" | "warm" | "direct" | "formal";

export const TONES: { value: Tone; label: string; hint: string }[] = [
  { value: "confident", label: "Confident", hint: "Clear & bold" },
  { value: "warm", label: "Warm", hint: "Personable" },
  { value: "direct", label: "Direct", hint: "No fluff" },
  { value: "formal", label: "Formal", hint: "Polished" },
];

export type LetterDoc = {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderLocation: string;
  date: string;
  hiringManager: string;
  companyName: string;
  companyAddress: string;
  salutation: string;
  body: string;
  signOff: string;
};

export type FontKey =
  | "times"
  | "georgia"
  | "cambria"
  | "garamond"
  | "bookman"
  | "inter"
  | "helvetica"
  | "arial"
  | "calibri"
  | "verdana"
  | "tahoma"
  | "trebuchet"
  | "jetbrains"
  | "courier";

export type AlignKey = "left" | "center" | "justify";

export type TypoSettings = {
  font: FontKey;
  fontSize: number; // px in preview, mapped to pt for exports
  lineHeight: number;
  align: AlignKey;
  bold: boolean;
  italic: boolean;
};

export const FONT_STACKS: Record<FontKey, string> = {
  times: '"Times New Roman", Times, serif',
  georgia: 'Georgia, "Iowan Old Style", serif',
  cambria: 'Cambria, "Hoefler Text", serif',
  garamond: '"EB Garamond", Garamond, "Apple Garamond", serif',
  bookman: '"Bookman Old Style", "URW Bookman L", serif',
  inter: '"Inter", "Helvetica Neue", Arial, sans-serif',
  helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  arial: 'Arial, "Liberation Sans", sans-serif',
  calibri: 'Calibri, "Carlito", "Trebuchet MS", sans-serif',
  verdana: 'Verdana, Geneva, sans-serif',
  tahoma: 'Tahoma, "DejaVu Sans", sans-serif',
  trebuchet: '"Trebuchet MS", "Lucida Sans", sans-serif',
  jetbrains: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
  courier: '"Courier New", Courier, monospace',
};

export const FONT_LABELS: Record<FontKey, string> = {
  times: "Times New Roman",
  georgia: "Georgia",
  cambria: "Cambria",
  garamond: "Garamond",
  bookman: "Bookman",
  inter: "Inter",
  helvetica: "Helvetica",
  arial: "Arial",
  calibri: "Calibri",
  verdana: "Verdana",
  tahoma: "Tahoma",
  trebuchet: "Trebuchet MS",
  jetbrains: "JetBrains Mono",
  courier: "Courier New",
};

// jsPDF has 3 built-in font families. Map each choice to the closest match.
export const PDF_FONT: Record<FontKey, "times" | "helvetica" | "courier"> = {
  times: "times",
  georgia: "times",
  cambria: "times",
  garamond: "times",
  bookman: "times",
  inter: "helvetica",
  helvetica: "helvetica",
  arial: "helvetica",
  calibri: "helvetica",
  verdana: "helvetica",
  tahoma: "helvetica",
  trebuchet: "helvetica",
  jetbrains: "courier",
  courier: "courier",
};

export const DOCX_FONT: Record<FontKey, string> = {
  times: "Times New Roman",
  georgia: "Georgia",
  cambria: "Cambria",
  garamond: "Garamond",
  bookman: "Bookman Old Style",
  inter: "Inter",
  helvetica: "Helvetica",
  arial: "Arial",
  calibri: "Calibri",
  verdana: "Verdana",
  tahoma: "Tahoma",
  trebuchet: "Trebuchet MS",
  jetbrains: "JetBrains Mono",
  courier: "Courier New",
};

export const DOCX_ALIGN: Record<AlignKey, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  justify: AlignmentType.JUSTIFIED,
};

export const todayLong = () =>
  new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export const emptyDoc = (): LetterDoc => ({
  senderName: "",
  senderEmail: "",
  senderPhone: "",
  senderLocation: "",
  date: todayLong(),
  hiringManager: "",
  companyName: "",
  companyAddress: "",
  salutation: "",
  body: "",
  signOff: "Sincerely,",
});

// Strip a possibly full-letter blob the AI returned down to just the body
// paragraphs (no greeting / sign-off), so we can display it cleanly inside
// the structured letter layout.
export function extractBody(full: string, _salutationGuess: string): string {
  if (!full) return "";
  let text = full.replace(/\r\n/g, "\n").trim();

  // Pre-empt single-line signatures like "Sincerely, Aarav Sharma" at the very end.
  text = text.replace(
    /\n\s*(sincerely|regards|best regards|kind regards|best|warmly|thank you|thanks|yours truly|respectfully)[,]?\s+[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+){0,3}\s*$/i,
    "",
  );

  const lines = text.split("\n");

  // Strip greeting
  while (lines.length && /^\s*(dear|hello|hi|to whom)\b/i.test(lines[0])) {
    lines.shift();
    if (lines.length && lines[0].trim() === "") lines.shift();
  }

  // Strip trailing signature block: sign-off word + optional blanks + sender name
  const signOffRe = /^(sincerely|regards|best regards|kind regards|best|warmly|thank you|thanks|yours truly|respectfully)[,.]?$/i;
  const isShortName = (s: string) => {
    const t = s.trim();
    if (!t || t.length > 60) return false;
    const words = t.split(/\s+/);
    if (words.length === 0 || words.length > 4) return false;
    return /^[A-Za-zÀ-ÿ]+([. '-][A-Za-zÀ-ÿ]+)*\.?$/i.test(t);
  };

  while (lines.length) {
    const last = lines[lines.length - 1].trim();
    if (last === "") {
      lines.pop();
      continue;
    }
    if (signOffRe.test(last)) {
      lines.pop();
      continue;
    }
    // If the last line looks like a sender's name and a sign-off appears
    // earlier (with only blanks between), it's part of the signature block.
    if (isShortName(last)) {
      let foundSignOff = false;
      for (let i = lines.length - 2; i >= 0; i--) {
        const t = lines[i].trim();
        if (t === "") continue;
        if (signOffRe.test(t)) foundSignOff = true;
        break;
      }
      if (foundSignOff) {
        lines.pop();
        continue;
      }
    }
    break;
  }

  text = lines.join("\n").trim();
  text = text.replace(/\n{3,}/g, "\n\n");
  return text;
}

export function guessSalutation(hiringManager: string) {
  const name = hiringManager.trim();
  return name ? `Dear ${name},` : "Dear Hiring Manager,";
}

/**
 * Properly capitalize a person's full name.
 * - "aarav sharma"        -> "Aarav Sharma"
 * - "AARAV SHARMA"        -> "Aarav Sharma"
 * - "mary-jane o'neil"    -> "Mary-Jane O'Neil"
 * - "john mcdonald"       -> "John McDonald"
 * - Particles ("de", "van", "von", "del", "della", "la") stay lowercase
 *   when not the first word.
 */
export function toTitleCaseName(input: string): string {
  if (!input) return "";
  const trimmed = input.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  const particles = new Set(["de", "del", "della", "der", "di", "da", "do", "dos", "du", "la", "le", "van", "von", "bin", "ibn", "y"]);
  const capWord = (w: string) => {
    if (!w) return w;
    // Hyphenated parts (Mary-Jane), apostrophes (O'Neil), and "Mc"/"Mac" prefixes.
    return w
      .split("-")
      .map((part) => {
        const lower = part.toLowerCase();
        // Keep apostrophe-aware capitalization: O'Neil, D'Angelo
        const apostropheCapped = lower.replace(/(^|['’])([a-zà-ÿ])/g, (_m, sep, ch) => sep + ch.toUpperCase());
        // Mc/Mac prefix → capitalize the next letter too (McDonald, MacArthur)
        return apostropheCapped.replace(/^(mc|mac)([a-zà-ÿ])/i, (_m, pre, ch) => {
          const fixedPre = pre[0].toUpperCase() + pre.slice(1).toLowerCase();
          return fixedPre + ch.toUpperCase();
        });
      })
      .join("-");
  };
  const words = trimmed.split(" ");
  return words
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i > 0 && particles.has(lower)) return lower;
      return capWord(w);
    })
    .join(" ");
}

