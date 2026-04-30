import { useState } from "react";
import { Sparkles, Loader2, Upload, FileText, Download, Copy, Check, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import { Document as DocxDocument, Packer, Paragraph, TextRun } from "docx";

type Tone = "confident" | "warm" | "direct" | "formal";

const TONES: { value: Tone; label: string; hint: string }[] = [
  { value: "confident", label: "Confident", hint: "Clear & bold" },
  { value: "warm", label: "Warm", hint: "Personable" },
  { value: "direct", label: "Direct", hint: "No fluff" },
  { value: "formal", label: "Formal", hint: "Polished" },
];

const CoverLetterGenerator = () => {
  const { user } = useAuth();
  const [jd, setJd] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [tone, setTone] = useState<Tone>("confident");
  const [generating, setGenerating] = useState(false);
  const [letter, setLetter] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    const isText = file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md");
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
          company: company.trim() || "the company",
          role: role.trim() || "this role",
          tone,
          job_description: jd.trim(),
        },
      });
      if (error) throw new Error(error.message || "Generation failed");
      const errMsg = (data as { error?: string })?.error;
      if (errMsg) throw new Error(errMsg);
      const full = (data as { letter?: { full_letter?: string } })?.letter?.full_letter ?? "";
      if (!full) throw new Error("No letter returned");
      setLetter(full);
      toast.success("Cover letter ready — edit before downloading.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const reset = () => {
    setLetter("");
    setJd("");
    setCompany("");
    setRole("");
  };

  const copyLetter = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  const fileBase = () => {
    const c = (company || "company").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const r = (role || "role").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    return `cover-letter-${c}-${r}`;
  };

  const downloadTxt = () => {
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${fileBase()}.txt`);
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 64;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const paragraphs = letter.split(/\n\s*\n/);
    let y = margin;
    const lineHeight = 16;
    for (const p of paragraphs) {
      const lines = doc.splitTextToSize(p.trim(), maxWidth);
      for (const line of lines) {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      }
      y += lineHeight * 0.6;
    }
    doc.save(`${fileBase()}.pdf`);
  };

  const downloadDocx = async () => {
    const paragraphs = letter.split(/\n\s*\n/).map(
      (p) =>
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: p.trim(), font: "Calibri", size: 22 })],
        }),
    );
    const docx = new DocxDocument({ sections: [{ children: paragraphs }] });
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
        Paste or upload a job description, pick a tone, and we'll draft a sharp cover letter you
        can edit before downloading.
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: input */}
        <SectionCard className="lg:col-span-5 p-0 overflow-hidden">
          <div className="px-5 sm:px-6 pt-5 pb-4">
            <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
              Job description
            </p>
            <p className="mt-1 text-[12.5px] text-foreground/55 tracking-tight">
              Paste the JD or upload a .txt file. The richer the JD, the sharper the letter.
            </p>
          </div>

          <div className="border-t border-foreground/[0.06] px-5 sm:px-6 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Company"
                value={company}
                onChange={setCompany}
                placeholder="Linear"
                disabled={generating}
              />
              <Field
                label="Role"
                value={role}
                onChange={setRole}
                placeholder="Senior PM"
                disabled={generating}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                  Paste JD
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
                rows={10}
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

            <div className="flex items-center gap-2 pt-1">
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
                    Generate cover letter
                  </>
                )}
              </button>
              {(letter || jd) && !generating && (
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

        {/* Right: editor / empty state */}
        <SectionCard className="lg:col-span-7 p-0 overflow-hidden">
          <div className="px-5 sm:px-6 pt-5 pb-4 flex items-center justify-between">
            <div>
              <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
                {letter ? "Editable letter" : "Preview"}
              </p>
              <p className="mt-1 text-[12.5px] text-foreground/55 tracking-tight">
                {letter
                  ? "Tweak anything below, then download."
                  : "Your letter will appear here. Edit it before downloading."}
              </p>
            </div>
            {letter && (
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

          {!letter ? (
            <div className="border-t border-foreground/[0.06] px-5 sm:px-6 py-12 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-2xl bg-foreground/[0.04] border border-foreground/[0.06] flex items-center justify-center">
                <FileText className="w-5 h-5 text-foreground/40" />
              </div>
              <p className="mt-4 text-[14px] font-medium tracking-tight text-foreground">
                No cover letter yet
              </p>
              <ol className="mt-3 space-y-1.5 text-[12.5px] text-foreground/55 tracking-tight">
                <li>1. Add the company and role</li>
                <li>2. Paste or upload the job description</li>
                <li>3. Pick a tone and click Generate</li>
              </ol>
            </div>
          ) : (
            <>
              <div className="border-t border-foreground/[0.06] px-5 sm:px-6 py-4">
                <textarea
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                  rows={20}
                  className="w-full bg-foreground/[0.02] border border-foreground/[0.06] rounded-lg px-4 py-3 text-[13.5px] leading-relaxed text-foreground placeholder:text-foreground/35 outline-none focus:border-foreground/20 transition-colors resize-y font-serif"
                />
                <p className="mt-1.5 text-[11px] text-foreground/45 tracking-tight">
                  {letter.trim().split(/\s+/).length} words
                </p>
              </div>

              <div className="border-t border-foreground/[0.06] px-5 sm:px-6 py-3 flex flex-wrap items-center gap-2 bg-foreground/[0.015]">
                <button
                  onClick={downloadPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3 py-1.5 text-[12.5px] font-medium tracking-tight hover:bg-foreground/90 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </button>
                <button
                  onClick={downloadDocx}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/[0.1] bg-foreground/[0.03] px-3 py-1.5 text-[12.5px] font-medium tracking-tight text-foreground/80 hover:bg-foreground/[0.06] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  DOCX
                </button>
                <button
                  onClick={downloadTxt}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/[0.1] bg-foreground/[0.03] px-3 py-1.5 text-[12.5px] font-medium tracking-tight text-foreground/80 hover:bg-foreground/[0.06] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Plain text (ATS)
                </button>
                <div className="ml-auto">
                  <button
                    onClick={copyLetter}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium tracking-tight text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05] transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </>
          )}
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

export default CoverLetterGenerator;
