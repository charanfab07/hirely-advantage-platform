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

type FontKey = "serif" | "sans" | "mono";
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
  serif: '"Times New Roman", Georgia, "Cambria", serif',
  sans: '"Inter", "Helvetica Neue", Arial, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

const FONT_LABELS: Record<FontKey, string> = {
  serif: "Serif",
  sans: "Sans",
  mono: "Mono",
};

// Map our preview font choice -> the font name jsPDF / Word should use.
const PDF_FONT: Record<FontKey, "times" | "helvetica" | "courier"> = {
  serif: "times",
  sans: "helvetica",
  mono: "courier",
};
const DOCX_FONT: Record<FontKey, string> = {
  serif: "Times New Roman",
  sans: "Calibri",
  mono: "Courier New",
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

const CoverLetterGenerator = () => {
  const { user } = useAuth();
  const [jd, setJd] = useState("");
  const [tone, setTone] = useState<Tone>("confident");
  const [generating, setGenerating] = useState(false);
  const [hasLetter, setHasLetter] = useState(false);
  const [doc, setDoc] = useState<LetterDoc>(emptyDoc());
  const [copied, setCopied] = useState(false);

  // Pre-fill sender name + email from the signed-in user.
  useEffect(() => {
    if (!user) return;
    setDoc((d) => ({
      ...d,
      senderEmail: d.senderEmail || user.email || "",
      senderName:
        d.senderName ||
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        "",
    }));
  }, [user?.id]);

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
    const lineHeight = 14;
    const blockGap = 10;

    pdf.setFont("times", "normal");
    pdf.setFontSize(11);

    let y = margin;
    const ensureSpace = (h: number) => {
      if (y + h > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
    };

    const writeBlock = (text: string, opts: { bold?: boolean } = {}) => {
      if (!text || !text.trim()) return;
      pdf.setFont("times", opts.bold ? "bold" : "normal");
      const lines = pdf.splitTextToSize(text.trim(), maxWidth);
      for (const line of lines) {
        ensureSpace(lineHeight);
        pdf.text(line, margin, y);
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
    const para = (text: string, opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) =>
      new Paragraph({
        alignment: opts.align,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text,
            font: "Times New Roman",
            size: 22, // 11pt
            bold: opts.bold,
          }),
        ],
      });

    const blank = () =>
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "", font: "Times New Roman", size: 22 })],
      });

    const splitBlock = (text: string, opts: { bold?: boolean } = {}) =>
      text
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => para(l, opts));

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
          document: { run: { font: "Times New Roman", size: 22 } },
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
          <div className="px-5 sm:px-6 pt-5 pb-4">
            <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
              Your details
            </p>
            <p className="mt-1 text-[12.5px] text-foreground/55 tracking-tight">
              These appear at the top of the letter.
            </p>
          </div>

          <div className="border-t border-foreground/[0.06] px-5 sm:px-6 py-4 space-y-3">
            <Field
              label="Full name"
              value={doc.senderName}
              onChange={(v) => update("senderName", v)}
              placeholder="Aanya Sharma"
              disabled={generating}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Email"
                value={doc.senderEmail}
                onChange={(v) => update("senderEmail", v)}
                placeholder="aanya@email.com"
                disabled={generating}
              />
              <Field
                label="Phone"
                value={doc.senderPhone}
                onChange={(v) => update("senderPhone", v)}
                placeholder="+91 98xxxxxx"
                disabled={generating}
              />
            </div>
            <Field
              label="Location"
              value={doc.senderLocation}
              onChange={(v) => update("senderLocation", v)}
              placeholder="Bengaluru, India"
              disabled={generating}
            />
          </div>

          <div className="border-t border-foreground/[0.06] px-5 sm:px-6 pt-4 pb-2">
            <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
              Recipient
            </p>
          </div>
          <div className="px-5 sm:px-6 py-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Hiring manager"
                value={doc.hiringManager}
                onChange={(v) => update("hiringManager", v)}
                placeholder="Priya Shah (optional)"
                disabled={generating}
              />
              <Field
                label="Company"
                value={doc.companyName}
                onChange={(v) => update("companyName", v)}
                placeholder="Linear"
                disabled={generating}
              />
            </div>
            <Field
              label="Company address"
              value={doc.companyAddress}
              onChange={(v) => update("companyAddress", v)}
              placeholder="San Francisco, CA (optional)"
              disabled={generating}
            />
          </div>

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
          <div className="px-5 sm:px-6 pt-5 pb-4 flex items-center justify-between">
            <div>
              <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                {hasLetter ? "Editable letter" : "Letter preview"}
              </p>
              <p className="mt-1 text-[12.5px] text-foreground/55 tracking-tight">
                {hasLetter
                  ? "Click any field to edit. Layout follows a standard business-letter format."
                  : "Your letter will appear in standard business-letter format. Edit any block before downloading."}
              </p>
            </div>
            {hasLetter && (
              <button
                onClick={generate}
                disabled={generating}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium tracking-tight text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05] transition-colors disabled:opacity-50"
                title="Regenerate"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
                Regenerate
              </button>
            )}
          </div>

          <div className="border-t border-foreground/[0.06] bg-foreground/[0.015] p-4 sm:p-6">
            {/* Letter sheet */}
            <div className="mx-auto max-w-[640px] bg-background border border-foreground/[0.08] rounded-md shadow-sm px-8 sm:px-12 py-10 font-serif text-foreground">
              {/* Sender block */}
              <div className="text-[13px] leading-relaxed">
                <EditableLine
                  value={doc.senderName}
                  onChange={(v) => update("senderName", v)}
                  placeholder="Your full name"
                  bold
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

              {/* Date */}
              <div className="mt-6 text-[13px]">
                <EditableLine
                  value={doc.date}
                  onChange={(v) => update("date", v)}
                  placeholder="Date"
                />
              </div>

              {/* Recipient block */}
              <div className="mt-6 text-[13px] leading-relaxed">
                <EditableLine
                  value={doc.hiringManager}
                  onChange={(v) => update("hiringManager", v)}
                  placeholder="Hiring manager"
                />
                <EditableLine
                  value={doc.companyName}
                  onChange={(v) => update("companyName", v)}
                  placeholder="Company name"
                  bold
                />
                <EditableLine
                  value={doc.companyAddress}
                  onChange={(v) => update("companyAddress", v)}
                  placeholder="Company address"
                />
              </div>

              {/* Salutation */}
              <div className="mt-6 text-[13.5px]">
                <EditableLine
                  value={doc.salutation}
                  onChange={(v) => update("salutation", v)}
                  placeholder={
                    doc.hiringManager ? `Dear ${doc.hiringManager},` : "Dear Hiring Manager,"
                  }
                />
              </div>

              {/* Body */}
              <textarea
                value={doc.body}
                onChange={(e) => update("body", e.target.value)}
                rows={hasLetter ? Math.max(10, doc.body.split("\n").length + 2) : 10}
                placeholder={
                  hasLetter
                    ? ""
                    : "Your generated letter body will appear here.\n\nEach paragraph is separated by a blank line. Click Generate after pasting the JD."
                }
                className="mt-5 w-full bg-transparent border-0 outline-none resize-none text-[13.5px] leading-[1.7] text-foreground placeholder:text-foreground/35 font-serif"
                style={{ minHeight: hasLetter ? undefined : 220 }}
              />

              {/* Sign-off */}
              <div className="mt-2 text-[13.5px]">
                <EditableLine
                  value={doc.signOff}
                  onChange={(v) => update("signOff", v)}
                  placeholder="Sincerely,"
                />
                <div className="h-6" />
                <EditableLine
                  value={doc.senderName}
                  onChange={(v) => update("senderName", v)}
                  placeholder="Your full name"
                  bold
                />
              </div>
            </div>

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

            {!hasLetter && (
              <div className="mx-auto mt-4 max-w-[640px] text-[12px] text-foreground/45 tracking-tight flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Tip: fill in your details on the left first — they'll appear in the letter
                automatically.
              </div>
            )}
          </div>
        </SectionCard>
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
  bold,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  bold?: boolean;
}) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={cn(
      "block w-full bg-transparent border-0 outline-none px-0 py-0.5 text-foreground placeholder:text-foreground/35 focus:bg-foreground/[0.03] rounded-sm transition-colors font-serif",
      bold && "font-semibold",
    )}
  />
);

export default CoverLetterGenerator;
