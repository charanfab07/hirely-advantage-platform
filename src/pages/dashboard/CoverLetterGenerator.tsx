import { useEffect, useState } from "react";
import { Sparkles, Loader2, Upload, FileText, Download, Copy, Check, Trash2, RefreshCw, Maximize2, Minimize2, Bold, Italic, AlignLeft, AlignCenter, AlignJustify, Type, X } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";

type Tone = "confident" | "warm" | "direct" | "formal";

const TONES: { value: Tone; label: string; hint: string }[] = [
  { value: "confident", label: "Confident", hint: "Clear & bold" },
  { value: "warm", label: "Warm", hint: "Personable" },
  { value: "direct", label: "Direct", hint: "No fluff" },
  { value: "formal", label: "Formal", hint: "Polished" },
];

type LetterDoc = {
  // Sender
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderLocation: string;
  // Date
  date: string;
  // Recipient
  hiringManager: string;
  companyName: string;
  companyAddress: string;
  // Letter
  salutation: string;
  body: string;
  signOff: string;
};

type FontKey =
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
type AlignKey = "left" | "center" | "justify";

type TypoSettings = {
  font: FontKey;
  fontSize: number; // px in preview, mapped to pt for exports
  lineHeight: number;
  align: AlignKey;
  bold: boolean;
  italic: boolean;
};

const FONT_STACKS: Record<FontKey, string> = {
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

const FONT_LABELS: Record<FontKey, string> = {
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
const PDF_FONT: Record<FontKey, "times" | "helvetica" | "courier"> = {
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
const DOCX_FONT: Record<FontKey, string> = {
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
const DOCX_ALIGN: Record<AlignKey, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  justify: AlignmentType.JUSTIFIED,
};

const todayLong = () =>
  new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const emptyDoc = (): LetterDoc => ({
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
function extractBody(full: string, salutationGuess: string): string {
  if (!full) return "";
  let text = full.replace(/\r\n/g, "\n").trim();

  // Drop any leading "Dear …," line(s)
  const lines = text.split("\n");
  while (lines.length && /^\s*(dear|hello|hi|to whom)\b/i.test(lines[0])) {
    lines.shift();
    // also drop a blank line right after
    if (lines.length && lines[0].trim() === "") lines.shift();
  }

  // Drop trailing sign-offs and signatures
  while (lines.length) {
    const last = lines[lines.length - 1].trim();
    if (
      last === "" ||
      /^(sincerely|regards|best regards|kind regards|best|warmly|thank you|thanks|yours truly|respectfully)[,.]?$/i.test(
        last,
      )
    ) {
      lines.pop();
      continue;
    }
    break;
  }

  text = lines.join("\n").trim();
  // Collapse 3+ blank lines
  text = text.replace(/\n{3,}/g, "\n\n");
  return text;
}

function guessSalutation(hiringManager: string) {
  const name = hiringManager.trim();
  return name ? `Dear ${name},` : "Dear Hiring Manager,";
}

// Parse contact info from a resume's raw text. Best-effort heuristics —
// scans the first ~40 non-empty lines (resume header) for name, email,
// phone, and city/country location.
function parseResumeContact(raw: string): {
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

  // Email
  const emailMatch = headBlob.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  const email = emailMatch?.[0];

  // Phone — international or local, 9–15 digits, allows spaces/dashes/parens
  const phoneMatch = headBlob.match(
    /(\+?\d[\d\s().-]{8,16}\d)/,
  );
  const phone = phoneMatch?.[1]?.replace(/\s+/g, " ").trim();

  // Name — first line that looks like a "Firstname Lastname" header.
  // 2–4 words, mostly letters, no email/phone/digits, not all caps lock-only
  // junk. Allow ALL CAPS too (common on resumes).
  let name: string | undefined;
  for (const line of head.slice(0, 8)) {
    if (/[@\d]/.test(line)) continue;
    if (line.length > 60) continue;
    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 5) continue;
    const ok = words.every((w) => /^[A-Za-zÀ-ÿ'’.\-]{1,}$/.test(w));
    if (!ok) continue;
    // Title-case the line (handles ALL CAPS resumes nicely)
    name = words
      .map((w) =>
        w.length <= 2
          ? w
          : w[0].toUpperCase() + w.slice(1).toLowerCase(),
      )
      .join(" ");
    break;
  }

  // Location — line containing a comma + words, no digits-only, no email,
  // not the name. Common patterns: "San Francisco, CA", "Bengaluru, India".
  let location: string | undefined;
  for (const line of head) {
    if (line === name) continue;
    if (/@/.test(line)) continue;
    if (!/,/.test(line)) continue;
    if (/\d{4,}/.test(line)) continue; // skip lines with long numbers
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

// Best-effort company + hiring-manager extraction from a job description.
function parseJobDescription(jd: string): {
  company?: string;
  hiringManager?: string;
} {
  if (!jd) return {};
  const text = jd.replace(/\r\n/g, "\n");

  // "at <Company>" — pick the proper-noun phrase right after.
  // e.g. "Senior Engineer at Stripe", "Join us at Acme Corp".
  let company: string | undefined;
  const atMatch = text.match(
    /\bat\s+([A-Z][A-Za-z0-9&.\-']+(?:\s+[A-Z][A-Za-z0-9&.\-']+){0,3})\b/,
  );
  if (atMatch) company = atMatch[1].trim();

  // "About <Company>" header
  if (!company) {
    const aboutMatch = text.match(
      /\bAbout\s+([A-Z][A-Za-z0-9&.\-']+(?:\s+[A-Z][A-Za-z0-9&.\-']+){0,3})\b/,
    );
    if (aboutMatch) company = aboutMatch[1].trim();
  }

  // Strip trailing connectors that get caught by the regex.
  if (company) {
    company = company.replace(/\s+(is|are|we|our|the)$/i, "").trim();
  }

  // Hiring manager — "Hiring Manager: Jane Doe" / "Reports to Jane Doe"
  let hiringManager: string | undefined;
  const hmMatch = text.match(
    /(?:hiring manager|reports? to|recruiter)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i,
  );
  if (hmMatch) hiringManager = hmMatch[1].trim();

  return { company, hiringManager };
}

const CoverLetterGenerator = () => {
  const { user } = useAuth();
  const [jd, setJd] = useState("");
  const [tone, setTone] = useState<Tone>("confident");
  const [generating, setGenerating] = useState(false);
  const [hasLetter, setHasLetter] = useState(false);
  const [doc, setDoc] = useState<LetterDoc>(emptyDoc());
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [typo, setTypo] = useState<TypoSettings>({
    font: "times",
    fontSize: 14,
    lineHeight: 1.7,
    align: "left",
    bold: false,
    italic: false,
  });
  const updateTypo = <K extends keyof TypoSettings>(key: K, value: TypoSettings[K]) =>
    setTypo((t) => ({ ...t, [key]: value }));

  const [resumeId, setResumeId] = useState<string | null>(null);

  // Pre-fill sender details from the signed-in user + their latest resume.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      // 1) Quick fill from auth metadata
      setDoc((d) => ({
        ...d,
        senderEmail: d.senderEmail || user.email || "",
        senderName:
          d.senderName ||
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          "",
      }));

      // 2) Pull most recent resume and parse contact info
      const { data, error } = await supabase
        .from("resumes")
        .select("id, raw_text")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled || error || !data) return;
      setResumeId(data.id);
      const parsed = parseResumeContact(data.raw_text ?? "");
      setDoc((d) => ({
        ...d,
        senderName: d.senderName || parsed.name || "",
        senderEmail: d.senderEmail || parsed.email || "",
        senderPhone: d.senderPhone || parsed.phone || "",
        senderLocation: d.senderLocation || parsed.location || "",
      }));
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Auto-fill recipient details when the user pastes/uploads a JD.
  useEffect(() => {
    if (jd.trim().length < 40) return;
    const parsed = parseJobDescription(jd);
    setDoc((d) => ({
      ...d,
      companyName: d.companyName || parsed.company || "",
      hiringManager: d.hiringManager || parsed.hiringManager || "",
    }));
  }, [jd]);

  // Esc closes fullscreen + lock body scroll while open
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const update = <K extends keyof LetterDoc>(key: K, value: LetterDoc[K]) =>
    setDoc((d) => ({ ...d, [key]: value }));

  const handleFile = async (file: File) => {
    if (!file) return;
    const isText =
      file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md");
    if (!isText) {
      toast.error("Please upload a .txt or .md file (or paste the JD).");
      return;
    }
    const text = await file.text();
    setJd(text.slice(0, 12000));
    toast.success("Job description loaded.");
  };

  const generate = async () => {
    if (!user) {
      toast.error("Please sign in first.");
      return;
    }
    if (jd.trim().length < 40) {
      toast.error("Paste a job description first (at least a paragraph).");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-cover-letter", {
        body: {
          company: doc.companyName.trim() || "the company",
          role: "this role",
          tone,
          job_description: jd.trim(),
          hiring_manager: doc.hiringManager.trim() || undefined,
          resume_id: resumeId ?? undefined,
        },
      });
      if (error) throw new Error(error.message || "Generation failed");
      const errMsg = (data as { error?: string })?.error;
      if (errMsg) throw new Error(errMsg);
      const full = (data as { letter?: { full_letter?: string } })?.letter?.full_letter ?? "";
      if (!full) throw new Error("No letter returned");

      const salutation = guessSalutation(doc.hiringManager);
      const body = extractBody(full, salutation);

      setDoc((d) => ({
        ...d,
        salutation,
        body,
        signOff: d.signOff || "Sincerely,",
        date: d.date || todayLong(),
      }));
      setHasLetter(true);
      toast.success("Cover letter ready — edit before downloading.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const reset = () => {
    setHasLetter(false);
    setJd("");
    setDoc((d) => ({
      ...emptyDoc(),
      // keep sender identity so users don't retype it every time
      senderName: d.senderName,
      senderEmail: d.senderEmail,
      senderPhone: d.senderPhone,
      senderLocation: d.senderLocation,
    }));
  };

  // Build the canonical, structured plain-text letter for copy / TXT / PDF / DOCX.
  const buildPlainLetter = (): string => {
    const senderLines = [
      doc.senderName,
      doc.senderEmail,
      doc.senderPhone,
      doc.senderLocation,
    ].filter((s) => s && s.trim());

    const recipientLines = [doc.hiringManager, doc.companyName, doc.companyAddress].filter(
      (s) => s && s.trim(),
    );

    const parts: string[] = [];
    if (senderLines.length) parts.push(senderLines.join("\n"));
    if (doc.date.trim()) parts.push(doc.date.trim());
    if (recipientLines.length) parts.push(recipientLines.join("\n"));
    if (doc.salutation.trim()) parts.push(doc.salutation.trim());
    if (doc.body.trim()) parts.push(doc.body.trim());
    const signOff = [doc.signOff.trim() || "Sincerely,", doc.senderName].filter(Boolean).join("\n\n");
    if (signOff) parts.push(signOff);

    return parts.join("\n\n");
  };

  const copyLetter = async () => {
    try {
      await navigator.clipboard.writeText(buildPlainLetter());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  const fileBase = () => {
    const c = (doc.companyName || "company").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const n = (doc.senderName || "applicant").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    return `cover-letter-${n}-${c}`;
  };

  const downloadTxt = () => {
    const blob = new Blob([buildPlainLetter()], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${fileBase()}.txt`);
  };

  const downloadPdf = () => {
    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 72; // 1 inch
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;

    // Map preview px font-size -> pt (preview is rendered ~1.0 ratio).
    const fontSizePt = Math.round(typo.fontSize * 0.85); // 14px ≈ 12pt
    const lineHeight = Math.round(fontSizePt * typo.lineHeight);
    const blockGap = Math.round(lineHeight * 0.55);
    const fontName = PDF_FONT[typo.font];
    const baseStyle: "normal" | "italic" = typo.italic ? "italic" : "normal";
    const baseBold: "bold" | "bolditalic" = typo.italic ? "bolditalic" : "bold";

    pdf.setFont(fontName, baseStyle);
    pdf.setFontSize(fontSizePt);

    let y = margin;
    const ensureSpace = (h: number) => {
      if (y + h > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
    };

    const writeBlock = (text: string, opts: { bold?: boolean } = {}) => {
      if (!text || !text.trim()) return;
      const isBold = opts.bold || typo.bold;
      pdf.setFont(fontName, isBold ? baseBold : baseStyle);
      const lines = pdf.splitTextToSize(text.trim(), maxWidth);
      for (const line of lines) {
        ensureSpace(lineHeight);
        let x = margin;
        let alignOpt: { align?: "left" | "center" | "justify" } = { align: "left" };
        if (typo.align === "center") {
          x = pageWidth / 2;
          alignOpt = { align: "center" };
        } else if (typo.align === "justify") {
          alignOpt = { align: "justify" };
        }
        pdf.text(line, x, y, alignOpt);
        y += lineHeight;
      }
      y += blockGap;
    };

    // Sender
    const sender = [doc.senderName, doc.senderEmail, doc.senderPhone, doc.senderLocation]
      .filter((s) => s && s.trim())
      .join("\n");
    writeBlock(sender, { bold: true });

    // Date
    writeBlock(doc.date);

    // Recipient
    const recipient = [doc.hiringManager, doc.companyName, doc.companyAddress]
      .filter((s) => s && s.trim())
      .join("\n");
    writeBlock(recipient);

    // Salutation
    writeBlock(doc.salutation);

    // Body — paragraph by paragraph
    const paragraphs = doc.body.split(/\n\s*\n/);
    for (const p of paragraphs) {
      writeBlock(p);
    }

    // Sign-off
    writeBlock(doc.signOff || "Sincerely,");
    writeBlock(doc.senderName);

    pdf.save(`${fileBase()}.pdf`);
  };

  const downloadDocx = async () => {
    const docxFont = DOCX_FONT[typo.font];
    // docx 'size' is half-points. preview px ≈ pt; 1pt = 2 half-points.
    const sizeHalfPt = Math.round(typo.fontSize * 0.85 * 2);
    const docxAlign = DOCX_ALIGN[typo.align];

    const para = (text: string, opts: { bold?: boolean } = {}) =>
      new Paragraph({
        alignment: docxAlign,
        spacing: { after: 200, line: Math.round(typo.lineHeight * 240) },
        children: [
          new TextRun({
            text,
            font: docxFont,
            size: sizeHalfPt,
            bold: opts.bold || typo.bold,
            italics: typo.italic,
          }),
        ],
      });

    const blank = () =>
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "", font: docxFont, size: sizeHalfPt })],
      });

    const children: Paragraph[] = [];

    // Sender
    const senderLines = [doc.senderName, doc.senderEmail, doc.senderPhone, doc.senderLocation]
      .filter((s) => s && s.trim());
    senderLines.forEach((l, i) =>
      children.push(para(l, { bold: i === 0 })),
    );
    if (senderLines.length) children.push(blank());

    // Date
    if (doc.date.trim()) {
      children.push(para(doc.date.trim()));
      children.push(blank());
    }

    // Recipient
    const recipientLines = [doc.hiringManager, doc.companyName, doc.companyAddress].filter(
      (s) => s && s.trim(),
    );
    if (recipientLines.length) {
      recipientLines.forEach((l) => children.push(para(l)));
      children.push(blank());
    }

    // Salutation
    if (doc.salutation.trim()) {
      children.push(para(doc.salutation.trim()));
    }

    // Body paragraphs
    const bodyParas = doc.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    for (const p of bodyParas) {
      children.push(para(p));
    }

    // Sign-off
    children.push(para(doc.signOff || "Sincerely,"));
    children.push(blank());
    if (doc.senderName.trim()) children.push(para(doc.senderName.trim(), { bold: true }));

    const docx = new DocxDocument({
      styles: {
        default: {
          document: { run: { font: docxFont, size: sizeHalfPt } },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
            },
          },
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(docx);
    saveAs(blob, `${fileBase()}.docx`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <p className="text-[10.5px] tracking-[0.22em] uppercase text-foreground/40 font-medium">
        Cover Letter Generator
      </p>
      <h1 className="mt-2 text-[36px] sm:text-[44px] leading-[1.04] font-semibold tracking-[-0.035em] text-foreground">
        One letter, perfectly{" "}
        <span
          style={{
            background: "linear-gradient(120deg,#0E0B1F,#6D54B3,#0E0B1F)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          tuned
        </span>
        .
      </h1>
      <p className="mt-3 text-[14px] text-foreground/60 tracking-tight max-w-2xl">
        Paste or upload a job description, fill in your details, pick a tone, and we'll draft a
        properly structured cover letter you can edit before downloading.
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: input */}
        <SectionCard className="lg:col-span-5 p-0 overflow-hidden">

          <div className="border-t border-foreground/[0.06] px-5 sm:px-6 pt-4 pb-2">
            <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
              Job description
            </p>
            <p className="mt-1 text-[12.5px] text-foreground/55 tracking-tight">
              Paste the JD or upload a .txt file.
            </p>
          </div>
          <div className="px-5 sm:px-6 py-3 space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                  JD
                </label>
                <label
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[11.5px] text-foreground/60 cursor-pointer hover:text-foreground transition-colors",
                    generating && "pointer-events-none opacity-50",
                  )}
                >
                  <Upload className="w-3 h-3" />
                  Upload .txt
                  <input
                    type="file"
                    accept=".txt,.md,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                rows={8}
                disabled={generating}
                placeholder="Paste the full job description here…"
                className="mt-1.5 w-full bg-foreground/[0.03] border border-foreground/[0.06] rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-foreground/35 outline-none focus:border-foreground/20 transition-colors resize-none"
              />
              <p className="mt-1 text-[11px] text-foreground/45 tracking-tight">
                {jd.trim().length === 0 ? "Empty" : `${jd.trim().split(/\s+/).length} words`}
              </p>
            </div>

            <div>
              <label className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                Tone
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    disabled={generating}
                    onClick={() => setTone(t.value)}
                    className={cn(
                      "rounded-lg px-2.5 py-2 text-left transition-colors border",
                      tone === t.value
                        ? "bg-foreground text-background border-foreground"
                        : "bg-foreground/[0.03] border-foreground/[0.06] hover:bg-foreground/[0.06]",
                    )}
                  >
                    <p className="text-[12.5px] font-medium tracking-tight">{t.label}</p>
                    <p
                      className={cn(
                        "text-[11px] tracking-tight",
                        tone === t.value ? "text-background/60" : "text-foreground/50",
                      )}
                    >
                      {t.hint}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 pb-1">
              <button
                onClick={generate}
                disabled={generating || jd.trim().length < 40}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium tracking-tight transition-colors",
                  generating || jd.trim().length < 40
                    ? "bg-foreground/10 text-foreground/40 cursor-not-allowed"
                    : "bg-foreground text-background hover:bg-foreground/90",
                )}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Drafting…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate
                  </>
                )}
              </button>
              {(hasLetter || jd) && !generating && (
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium tracking-tight text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Right: structured letter */}
        <SectionCard className="lg:col-span-7 p-0 overflow-hidden">
          <div className="px-5 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                {hasLetter ? "Editable letter" : "Letter preview"}
              </p>
              <p className="mt-1 text-[12.5px] text-foreground/55 tracking-tight">
                {hasLetter
                  ? "Click any field to edit. Open full screen to format the letter."
                  : "Your letter will appear in standard business-letter format."}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setFullscreen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1.5 text-[12px] font-medium tracking-tight text-foreground/80 hover:bg-foreground/[0.06] transition-colors"
                title="Open full screen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Full screen
              </button>
              {hasLetter && (
                <button
                  onClick={generate}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium tracking-tight text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05] transition-colors disabled:opacity-50"
                  title="Regenerate"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
                  Regenerate
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-foreground/[0.06] bg-foreground/[0.015] p-3 sm:p-4">
            <LetterSheet
              doc={doc}
              update={update}
              hasLetter={hasLetter}
              isEmpty={!hasLetter && jd.trim().length === 0}
              typo={typo}
              compact
            />

            {/* Action bar */}
            <div className="mx-auto mt-4 max-w-[640px] flex flex-wrap items-center gap-2">
              <button
                onClick={downloadPdf}
                disabled={!hasLetter}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium tracking-tight transition-colors",
                  hasLetter
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-foreground/10 text-foreground/40 cursor-not-allowed",
                )}
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </button>
              <button
                onClick={downloadDocx}
                disabled={!hasLetter}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium tracking-tight transition-colors",
                  hasLetter
                    ? "border-foreground/[0.1] bg-foreground/[0.03] text-foreground/80 hover:bg-foreground/[0.06]"
                    : "border-foreground/[0.06] text-foreground/30 cursor-not-allowed",
                )}
              >
                <Download className="w-3.5 h-3.5" />
                DOCX
              </button>
              <button
                onClick={downloadTxt}
                disabled={!hasLetter}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium tracking-tight transition-colors",
                  hasLetter
                    ? "border-foreground/[0.1] bg-foreground/[0.03] text-foreground/80 hover:bg-foreground/[0.06]"
                    : "border-foreground/[0.06] text-foreground/30 cursor-not-allowed",
                )}
              >
                <Download className="w-3.5 h-3.5" />
                Plain text (ATS)
              </button>
              <div className="ml-auto">
                <button
                  onClick={copyLetter}
                  disabled={!hasLetter}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium tracking-tight transition-colors",
                    hasLetter
                      ? "text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05]"
                      : "text-foreground/30 cursor-not-allowed",
                  )}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

          </div>
        </SectionCard>
      </div>

      {/* Fullscreen letter editor */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 border-b border-foreground/[0.08] bg-background/80 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-foreground/50" />
              <select
                value={typo.font}
                onChange={(e) => updateTypo("font", e.target.value as FontKey)}
                className="bg-foreground/[0.04] border border-foreground/[0.08] rounded-md px-2 py-1 text-[12.5px] text-foreground outline-none focus:border-foreground/20"
              >
                {(Object.keys(FONT_LABELS) as FontKey[]).map((k) => (
                  <option key={k} value={k}>
                    {FONT_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-foreground/[0.04] border border-foreground/[0.08] rounded-md px-1.5 py-0.5">
              <button
                onClick={() => updateTypo("fontSize", Math.max(10, typo.fontSize - 1))}
                className="w-6 h-6 inline-flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/[0.06] rounded"
                title="Decrease size"
              >
                −
              </button>
              <span className="text-[12px] tabular-nums w-7 text-center text-foreground/70">
                {typo.fontSize}
              </span>
              <button
                onClick={() => updateTypo("fontSize", Math.min(28, typo.fontSize + 1))}
                className="w-6 h-6 inline-flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/[0.06] rounded"
                title="Increase size"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-foreground/50 tracking-tight">Line</span>
              <select
                value={typo.lineHeight}
                onChange={(e) => updateTypo("lineHeight", Number(e.target.value))}
                className="bg-foreground/[0.04] border border-foreground/[0.08] rounded-md px-2 py-1 text-[12.5px] text-foreground outline-none focus:border-foreground/20"
              >
                {[1.3, 1.5, 1.7, 2.0].map((v) => (
                  <option key={v} value={v}>
                    {v.toFixed(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-0.5 bg-foreground/[0.04] border border-foreground/[0.08] rounded-md p-0.5">
              <ToolbarToggle
                active={typo.bold}
                onClick={() => updateTypo("bold", !typo.bold)}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </ToolbarToggle>
              <ToolbarToggle
                active={typo.italic}
                onClick={() => updateTypo("italic", !typo.italic)}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </ToolbarToggle>
            </div>

            <div className="flex items-center gap-0.5 bg-foreground/[0.04] border border-foreground/[0.08] rounded-md p-0.5">
              <ToolbarToggle
                active={typo.align === "left"}
                onClick={() => updateTypo("align", "left")}
                title="Align left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </ToolbarToggle>
              <ToolbarToggle
                active={typo.align === "center"}
                onClick={() => updateTypo("align", "center")}
                title="Align center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </ToolbarToggle>
              <ToolbarToggle
                active={typo.align === "justify"}
                onClick={() => updateTypo("align", "justify")}
                title="Justify"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </ToolbarToggle>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={downloadPdf}
                disabled={!hasLetter}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium tracking-tight transition-colors",
                  hasLetter
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-foreground/10 text-foreground/40 cursor-not-allowed",
                )}
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                onClick={downloadDocx}
                disabled={!hasLetter}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium tracking-tight transition-colors",
                  hasLetter
                    ? "border-foreground/[0.1] bg-foreground/[0.03] text-foreground/80 hover:bg-foreground/[0.06]"
                    : "border-foreground/[0.06] text-foreground/30 cursor-not-allowed",
                )}
              >
                <Download className="w-3.5 h-3.5" /> DOCX
              </button>
              <button
                onClick={downloadTxt}
                disabled={!hasLetter}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium tracking-tight transition-colors",
                  hasLetter
                    ? "border-foreground/[0.1] bg-foreground/[0.03] text-foreground/80 hover:bg-foreground/[0.06]"
                    : "border-foreground/[0.06] text-foreground/30 cursor-not-allowed",
                )}
              >
                <Download className="w-3.5 h-3.5" /> TXT
              </button>
              <button
                onClick={() => setFullscreen(false)}
                className="inline-flex items-center gap-1.5 rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1.5 text-[12px] font-medium tracking-tight text-foreground/80 hover:bg-foreground/[0.06] transition-colors"
                title="Exit full screen (Esc)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                Exit
              </button>
            </div>
          </div>

          {/* Sheet */}
          <div className="flex-1 overflow-auto py-8 px-4">
            <LetterSheet
              doc={doc}
              update={update}
              hasLetter={hasLetter}
              typo={typo}
              compact={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const ToolbarToggle = ({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      "inline-flex items-center justify-center w-7 h-7 rounded transition-colors",
      active
        ? "bg-foreground text-background"
        : "text-foreground/70 hover:text-foreground hover:bg-foreground/[0.06]",
    )}
  >
    {children}
  </button>
);

const LetterSheet = ({
  doc,
  update,
  hasLetter,
  typo,
  compact,
}: {
  doc: LetterDoc;
  update: <K extends keyof LetterDoc>(key: K, value: LetterDoc[K]) => void;
  hasLetter: boolean;
  typo: TypoSettings;
  compact: boolean;
}) => {
  const sheetStyle: React.CSSProperties = {
    fontFamily: FONT_STACKS[typo.font],
    fontSize: `${typo.fontSize}px`,
    lineHeight: typo.lineHeight,
    fontWeight: typo.bold ? 600 : 400,
    fontStyle: typo.italic ? "italic" : "normal",
    textAlign: typo.align,
  };

  const maxW = compact ? "max-w-[600px]" : "max-w-[820px]";
  const padX = compact ? "px-6 sm:px-8" : "px-10 sm:px-16";
  const padY = compact ? "py-5" : "py-14";

  return (
    <div
      className={cn(
        "mx-auto bg-background border border-foreground/[0.08] rounded-md shadow-sm text-foreground",
        maxW,
        padX,
        padY,
      )}
      style={sheetStyle}
    >
      {/* Sender block */}
      <div>
        <EditableLine
          value={doc.senderName}
          onChange={(v) => update("senderName", v)}
          placeholder="Your full name"
          accentBold
        />
        <EditableLine
          value={doc.senderEmail}
          onChange={(v) => update("senderEmail", v)}
          placeholder="you@email.com"
        />
        <EditableLine
          value={doc.senderPhone}
          onChange={(v) => update("senderPhone", v)}
          placeholder="Phone"
        />
        <EditableLine
          value={doc.senderLocation}
          onChange={(v) => update("senderLocation", v)}
          placeholder="City, Country"
        />
      </div>

      <div className="mt-3">
        <EditableLine
          value={doc.date}
          onChange={(v) => update("date", v)}
          placeholder="Date"
        />
      </div>

      <div className="mt-3">
        <EditableLine
          value={doc.hiringManager}
          onChange={(v) => update("hiringManager", v)}
          placeholder="Hiring manager"
        />
        <EditableLine
          value={doc.companyName}
          onChange={(v) => update("companyName", v)}
          placeholder="Company name"
          accentBold
        />
        <EditableLine
          value={doc.companyAddress}
          onChange={(v) => update("companyAddress", v)}
          placeholder="Company address"
        />
      </div>

      <div className="mt-3">
        <EditableLine
          value={doc.salutation}
          onChange={(v) => update("salutation", v)}
          placeholder={
            doc.hiringManager ? `Dear ${doc.hiringManager},` : "Dear Hiring Manager,"
          }
        />
      </div>

      <textarea
        value={doc.body}
        onChange={(e) => update("body", e.target.value)}
        rows={hasLetter ? Math.max(6, doc.body.split("\n").length + 1) : 6}
        placeholder={
          hasLetter
            ? ""
            : "Your generated letter body will appear here.\n\nEach paragraph is separated by a blank line. Click Generate after pasting the JD."
        }
        className="mt-3 w-full bg-transparent border-0 outline-none resize-none text-foreground placeholder:text-foreground/35"
        style={{
          ...sheetStyle,
          minHeight: hasLetter ? undefined : compact ? 110 : 360,
        }}
      />

      <div className="mt-2">
        <EditableLine
          value={doc.signOff}
          onChange={(v) => update("signOff", v)}
          placeholder="Sincerely,"
        />
        <div className="h-3" />
        <EditableLine
          value={doc.senderName}
          onChange={(v) => update("senderName", v)}
          placeholder="Your full name"
          accentBold
        />
      </div>
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => (
  <div>
    <label className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="mt-1.5 w-full bg-foreground/[0.03] border border-foreground/[0.06] rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-foreground/35 outline-none focus:border-foreground/20 transition-colors"
    />
  </div>
);

const EditableLine = ({
  value,
  onChange,
  placeholder,
  accentBold,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  accentBold?: boolean;
}) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={cn(
      "block w-full bg-transparent border-0 outline-none px-0 py-0.5 text-foreground placeholder:text-foreground/35 focus:bg-foreground/[0.03] rounded-sm transition-colors",
      accentBold && "font-semibold",
    )}
    style={{ font: "inherit", color: "inherit", textAlign: "inherit" }}
  />
);

export default CoverLetterGenerator;
