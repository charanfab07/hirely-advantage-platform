import { useState, useMemo } from "react";
import { Plus, Trash2, Download, FileText, FileType, Pencil, Eye, X, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";

export type EditableResume = {
  contact: {
    name: string;
    location: string;
    email: string;
    phone: string;
    links: { label: string; url: string }[];
  };
  headline: string;
  summary: string;
  skills: { group: string; items: string[] }[];
  experience: {
    role: string;
    company: string;
    location: string;
    dates: string;
    bullets: string[];
  }[];
  projects: { name: string; description: string; tech: string[]; impact: string }[];
  education: { degree: string; school: string; dates: string; detail: string }[];
  achievements: string[];
};

// ===== Typography (font / size / placement) =====
export type ResumeFontKey =
  | "serif-times"
  | "serif-georgia"
  | "serif-cambria"
  | "serif-garamond"
  | "sans-inter"
  | "sans-helvetica"
  | "sans-arial"
  | "sans-calibri"
  | "sans-verdana"
  | "mono-jetbrains";

type AlignKey = "left" | "center" | "right" | "justify";

export type ResumeTypography = {
  font: ResumeFontKey;
  sizeScale: number; // 0.85 .. 1.25 — multiplies all element sizes
  lineHeight: number; // 1.3 .. 2.0
  bodyAlign: Exclude<AlignKey, "right">; // left or justify (or center)
  headerAlign: Exclude<AlignKey, "justify">; // header word-placement
};

const DEFAULT_TYPO: ResumeTypography = {
  font: "serif-times",
  sizeScale: 1,
  lineHeight: 1.5,
  bodyAlign: "left",
  headerAlign: "center",
};

// CSS font-family stacks for the live preview
const FONT_STACKS: Record<ResumeFontKey, string> = {
  "serif-times": '"Times New Roman", Times, serif',
  "serif-georgia": 'Georgia, "Iowan Old Style", serif',
  "serif-cambria": 'Cambria, "Hoefler Text", serif',
  "serif-garamond": '"EB Garamond", Garamond, serif',
  "sans-inter": '"Inter", "Helvetica Neue", Arial, sans-serif',
  "sans-helvetica": '"Helvetica Neue", Helvetica, Arial, sans-serif',
  "sans-arial": 'Arial, "Liberation Sans", sans-serif',
  "sans-calibri": 'Calibri, "Carlito", sans-serif',
  "sans-verdana": 'Verdana, Geneva, sans-serif',
  "mono-jetbrains": '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
};

const FONT_LABELS: Record<ResumeFontKey, string> = {
  "serif-times": "Times New Roman",
  "serif-georgia": "Georgia",
  "serif-cambria": "Cambria",
  "serif-garamond": "Garamond",
  "sans-inter": "Inter",
  "sans-helvetica": "Helvetica",
  "sans-arial": "Arial",
  "sans-calibri": "Calibri",
  "sans-verdana": "Verdana",
  "mono-jetbrains": "JetBrains Mono",
};

// jsPDF only ships Helvetica, Times, Courier — map our keys to the closest built-in.
const PDF_FONT_FAMILY: Record<ResumeFontKey, "helvetica" | "times" | "courier"> = {
  "serif-times": "times",
  "serif-georgia": "times",
  "serif-cambria": "times",
  "serif-garamond": "times",
  "sans-inter": "helvetica",
  "sans-helvetica": "helvetica",
  "sans-arial": "helvetica",
  "sans-calibri": "helvetica",
  "sans-verdana": "helvetica",
  "mono-jetbrains": "courier",
};

// DOCX font names — Word will substitute if missing on user's machine.
const DOCX_FONT_NAME: Record<ResumeFontKey, string> = {
  "serif-times": "Times New Roman",
  "serif-georgia": "Georgia",
  "serif-cambria": "Cambria",
  "serif-garamond": "Garamond",
  "sans-inter": "Inter",
  "sans-helvetica": "Helvetica",
  "sans-arial": "Arial",
  "sans-calibri": "Calibri",
  "sans-verdana": "Verdana",
  "mono-jetbrains": "JetBrains Mono",
};

const fieldCls =
  "w-full bg-transparent border border-foreground/10 hover:border-foreground/20 focus:border-foreground/40 focus:bg-white/60 rounded-md px-2.5 py-1.5 text-[13px] tracking-tight outline-none transition-colors";
const textareaCls = cn(fieldCls, "resize-y min-h-[60px] leading-[1.5]");
const labelCls = "text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium";

export const ResumeEditor = ({
  initial,
  onClose,
}: {
  initial: EditableResume;
  onClose?: () => void;
}) => {
  const [resume, setResume] = useState<EditableResume>(initial);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [typo, setTypo] = useState<ResumeTypography>(DEFAULT_TYPO);

  const updateTypo = <K extends keyof ResumeTypography>(key: K, value: ResumeTypography[K]) =>
    setTypo((t) => ({ ...t, [key]: value }));

  const update = <K extends keyof EditableResume>(key: K, value: EditableResume[K]) =>
    setResume((r) => ({ ...r, [key]: value }));

  const fileBase = useMemo(
    () => (resume.contact.name?.trim() || "resume").replace(/\s+/g, "_"),
    [resume.contact.name],
  );

  const handleDownloadTxt = () => {
    const text = toPlainText(resume);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${fileBase}_ATS.txt`);
    toast.success("Plain-text ATS resume downloaded");
  };

  const handleDownloadPdf = () => {
    try {
      const doc = renderPdf(resume, typo);
      doc.save(`${fileBase}.pdf`);
      toast.success("PDF downloaded");
    } catch (e) {
      console.error(e);
      toast.error("PDF export failed");
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const doc = renderDocx(resume, typo);
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${fileBase}.docx`);
      toast.success("DOCX downloaded");
    } catch (e) {
      console.error(e);
      toast.error("DOCX export failed");
    }
  };

  return (
    <SectionCard className="!p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-foreground/[0.06] bg-foreground/[0.02]">
        <div className="flex items-center gap-2">
          <p className={labelCls}>Editable resume</p>
          <div className="ml-2 inline-flex rounded-full bg-foreground/[0.05] p-0.5">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={cn(
                "px-3 py-1 rounded-full text-[12px] font-medium tracking-tight flex items-center gap-1.5 transition-colors",
                mode === "edit" ? "bg-white text-foreground shadow-sm" : "text-foreground/60 hover:text-foreground",
              )}
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={cn(
                "px-3 py-1 rounded-full text-[12px] font-medium tracking-tight flex items-center gap-1.5 transition-colors",
                mode === "preview" ? "bg-white text-foreground shadow-sm" : "text-foreground/60 hover:text-foreground",
              )}
            >
              <Eye className="w-3 h-3" /> Preview
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-3 py-1.5 rounded-full bg-foreground text-background text-[12px] font-medium tracking-tight flex items-center gap-1.5 hover:bg-foreground/90 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button
            type="button"
            onClick={handleDownloadDocx}
            className="px-3 py-1.5 rounded-full bg-foreground/[0.06] hover:bg-foreground/[0.1] text-[12px] font-medium tracking-tight flex items-center gap-1.5 transition-colors"
          >
            <FileType className="w-3.5 h-3.5" /> DOCX
          </button>
          <button
            type="button"
            onClick={handleDownloadTxt}
            className="px-3 py-1.5 rounded-full bg-foreground/[0.06] hover:bg-foreground/[0.1] text-[12px] font-medium tracking-tight flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> ATS .txt
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-1 p-1.5 rounded-full hover:bg-foreground/[0.08] text-foreground/55"
              title="Close editor"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Typography toolbar — applies to preview, PDF and DOCX */}
      <div className="flex items-center gap-2 flex-wrap px-5 py-2.5 border-b border-foreground/[0.06] bg-foreground/[0.015]">
        <div className="flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-foreground/50" />
          <select
            value={typo.font}
            onChange={(e) => updateTypo("font", e.target.value as ResumeFontKey)}
            className="bg-foreground/[0.04] border border-foreground/[0.08] rounded-md px-2 py-1 text-[12.5px] text-foreground outline-none focus:border-foreground/20"
            title="Font family"
          >
            {(Object.keys(FONT_LABELS) as ResumeFontKey[]).map((k) => (
              <option key={k} value={k}>
                {FONT_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 bg-foreground/[0.04] border border-foreground/[0.08] rounded-md px-1.5 py-0.5">
          <button
            type="button"
            onClick={() => updateTypo("sizeScale", Math.max(0.85, +(typo.sizeScale - 0.05).toFixed(2)))}
            className="w-6 h-6 inline-flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/[0.06] rounded"
            title="Decrease size"
          >
            −
          </button>
          <span className="text-[12px] tabular-nums w-10 text-center text-foreground/70">
            {Math.round(typo.sizeScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => updateTypo("sizeScale", Math.min(1.25, +(typo.sizeScale + 0.05).toFixed(2)))}
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
            {[1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.0].map((v) => (
              <option key={v} value={v}>
                {v.toFixed(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 ml-1">
          <span className="text-[11px] text-foreground/50 tracking-tight">Header</span>
          <div className="flex items-center gap-0.5 bg-foreground/[0.04] border border-foreground/[0.08] rounded-md p-0.5">
            <AlignToggle active={typo.headerAlign === "left"} onClick={() => updateTypo("headerAlign", "left")} title="Header left">
              <AlignLeft className="w-3.5 h-3.5" />
            </AlignToggle>
            <AlignToggle active={typo.headerAlign === "center"} onClick={() => updateTypo("headerAlign", "center")} title="Header center">
              <AlignCenter className="w-3.5 h-3.5" />
            </AlignToggle>
            <AlignToggle active={typo.headerAlign === "right"} onClick={() => updateTypo("headerAlign", "right")} title="Header right">
              <AlignRight className="w-3.5 h-3.5" />
            </AlignToggle>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-foreground/50 tracking-tight">Body</span>
          <div className="flex items-center gap-0.5 bg-foreground/[0.04] border border-foreground/[0.08] rounded-md p-0.5">
            <AlignToggle active={typo.bodyAlign === "left"} onClick={() => updateTypo("bodyAlign", "left")} title="Body left">
              <AlignLeft className="w-3.5 h-3.5" />
            </AlignToggle>
            <AlignToggle active={typo.bodyAlign === "center"} onClick={() => updateTypo("bodyAlign", "center")} title="Body center">
              <AlignCenter className="w-3.5 h-3.5" />
            </AlignToggle>
            <AlignToggle active={typo.bodyAlign === "justify"} onClick={() => updateTypo("bodyAlign", "justify")} title="Body justify">
              <AlignJustify className="w-3.5 h-3.5" />
            </AlignToggle>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setTypo(DEFAULT_TYPO)}
          className="ml-auto text-[11.5px] text-foreground/55 hover:text-foreground tracking-tight"
          title="Reset typography"
        >
          Reset
        </button>
      </div>

      {mode === "edit" ? (
        <div className="px-5 sm:px-7 py-6 space-y-7 max-h-[80vh] overflow-y-auto">
          {/* Contact */}
          <section className="space-y-3">
            <p className={labelCls}>Contact</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Name">
                <input
                  className={fieldCls}
                  value={resume.contact.name}
                  onChange={(e) =>
                    update("contact", { ...resume.contact, name: e.target.value })
                  }
                />
              </Field>
              <Field label="Job title / headline">
                <input
                  className={fieldCls}
                  value={resume.headline}
                  onChange={(e) => update("headline", e.target.value)}
                  placeholder="e.g. Senior Python Developer"
                />
              </Field>
              <Field label="Email">
                <input
                  className={fieldCls}
                  type="email"
                  value={resume.contact.email}
                  onChange={(e) =>
                    update("contact", { ...resume.contact, email: e.target.value })
                  }
                />
              </Field>
              <Field label="Phone">
                <input
                  className={fieldCls}
                  value={resume.contact.phone}
                  onChange={(e) =>
                    update("contact", { ...resume.contact, phone: e.target.value })
                  }
                />
              </Field>
              <Field label="Location">
                <input
                  className={fieldCls}
                  value={resume.contact.location}
                  onChange={(e) =>
                    update("contact", { ...resume.contact, location: e.target.value })
                  }
                />
              </Field>
            </div>
            <div>
              <p className={labelCls}>Links</p>
              <div className="mt-2 space-y-2">
                {resume.contact.links.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className={cn(fieldCls, "max-w-[160px]")}
                      placeholder="Label"
                      value={l.label}
                      onChange={(e) => {
                        const next = [...resume.contact.links];
                        next[i] = { ...next[i], label: e.target.value };
                        update("contact", { ...resume.contact, links: next });
                      }}
                    />
                    <input
                      className={fieldCls}
                      placeholder="https://…"
                      value={l.url}
                      onChange={(e) => {
                        const next = [...resume.contact.links];
                        next[i] = { ...next[i], url: e.target.value };
                        update("contact", { ...resume.contact, links: next });
                      }}
                    />
                    <RemoveBtn
                      onClick={() => {
                        const next = resume.contact.links.filter((_, j) => j !== i);
                        update("contact", { ...resume.contact, links: next });
                      }}
                    />
                  </div>
                ))}
                <AddBtn
                  label="Add link"
                  onClick={() =>
                    update("contact", {
                      ...resume.contact,
                      links: [...resume.contact.links, { label: "", url: "" }],
                    })
                  }
                />
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="space-y-2">
            <p className={labelCls}>Summary</p>
            <textarea
              className={textareaCls}
              rows={4}
              value={resume.summary}
              onChange={(e) => update("summary", e.target.value)}
            />
          </section>

          {/* Skills */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className={labelCls}>Skills</p>
              <AddBtn
                label="Add group"
                onClick={() =>
                  update("skills", [...resume.skills, { group: "", items: [] }])
                }
              />
            </div>
            <div className="space-y-3">
              {resume.skills.map((s, i) => (
                <div key={i} className="rounded-lg border border-foreground/[0.06] p-3 bg-foreground/[0.015]">
                  <div className="flex gap-2">
                    <input
                      className={cn(fieldCls, "max-w-[220px] font-semibold")}
                      placeholder="Group (e.g. Languages)"
                      value={s.group}
                      onChange={(e) => {
                        const next = [...resume.skills];
                        next[i] = { ...next[i], group: e.target.value };
                        update("skills", next);
                      }}
                    />
                    <RemoveBtn
                      onClick={() => update("skills", resume.skills.filter((_, j) => j !== i))}
                    />
                  </div>
                  <textarea
                    className={cn(textareaCls, "mt-2")}
                    rows={2}
                    placeholder="Comma-separated skills"
                    value={s.items.join(", ")}
                    onChange={(e) => {
                      const next = [...resume.skills];
                      next[i] = {
                        ...next[i],
                        items: e.target.value.split(",").map((x) => x.trim()).filter(Boolean),
                      };
                      update("skills", next);
                    }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Experience */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className={labelCls}>Experience</p>
              <AddBtn
                label="Add role"
                onClick={() =>
                  update("experience", [
                    ...resume.experience,
                    { role: "", company: "", location: "", dates: "", bullets: [""] },
                  ])
                }
              />
            </div>
            <div className="space-y-4">
              {resume.experience.map((x, i) => (
                <div key={i} className="rounded-lg border border-foreground/[0.06] p-3 bg-foreground/[0.015] space-y-2">
                  <div className="flex justify-end">
                    <RemoveBtn
                      onClick={() =>
                        update("experience", resume.experience.filter((_, j) => j !== i))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      className={cn(fieldCls, "font-semibold")}
                      placeholder="Role"
                      value={x.role}
                      onChange={(e) => {
                        const next = [...resume.experience];
                        next[i] = { ...next[i], role: e.target.value };
                        update("experience", next);
                      }}
                    />
                    <input
                      className={fieldCls}
                      placeholder="Company"
                      value={x.company}
                      onChange={(e) => {
                        const next = [...resume.experience];
                        next[i] = { ...next[i], company: e.target.value };
                        update("experience", next);
                      }}
                    />
                    <input
                      className={fieldCls}
                      placeholder="Location"
                      value={x.location}
                      onChange={(e) => {
                        const next = [...resume.experience];
                        next[i] = { ...next[i], location: e.target.value };
                        update("experience", next);
                      }}
                    />
                    <input
                      className={fieldCls}
                      placeholder="Dates (e.g. Jan 2023 – Present)"
                      value={x.dates}
                      onChange={(e) => {
                        const next = [...resume.experience];
                        next[i] = { ...next[i], dates: e.target.value };
                        update("experience", next);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className={labelCls}>Bullets</p>
                    {x.bullets.map((b, j) => (
                      <div key={j} className="flex gap-2 items-start">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
                        <textarea
                          className={textareaCls}
                          rows={2}
                          value={b}
                          onChange={(e) => {
                            const next = [...resume.experience];
                            const bullets = [...next[i].bullets];
                            bullets[j] = e.target.value;
                            next[i] = { ...next[i], bullets };
                            update("experience", next);
                          }}
                        />
                        <RemoveBtn
                          onClick={() => {
                            const next = [...resume.experience];
                            next[i] = {
                              ...next[i],
                              bullets: next[i].bullets.filter((_, k) => k !== j),
                            };
                            update("experience", next);
                          }}
                        />
                      </div>
                    ))}
                    <AddBtn
                      label="Add bullet"
                      onClick={() => {
                        const next = [...resume.experience];
                        next[i] = { ...next[i], bullets: [...next[i].bullets, ""] };
                        update("experience", next);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className={labelCls}>Projects</p>
              <AddBtn
                label="Add project"
                onClick={() =>
                  update("projects", [
                    ...resume.projects,
                    { name: "", description: "", tech: [], impact: "" },
                  ])
                }
              />
            </div>
            <div className="space-y-3">
              {resume.projects.map((p, i) => (
                <div key={i} className="rounded-lg border border-foreground/[0.06] p-3 bg-foreground/[0.015] space-y-2">
                  <div className="flex justify-end">
                    <RemoveBtn
                      onClick={() => update("projects", resume.projects.filter((_, j) => j !== i))}
                    />
                  </div>
                  <input
                    className={cn(fieldCls, "font-semibold")}
                    placeholder="Project name"
                    value={p.name}
                    onChange={(e) => {
                      const next = [...resume.projects];
                      next[i] = { ...next[i], name: e.target.value };
                      update("projects", next);
                    }}
                  />
                  <textarea
                    className={textareaCls}
                    rows={2}
                    placeholder="Description"
                    value={p.description}
                    onChange={(e) => {
                      const next = [...resume.projects];
                      next[i] = { ...next[i], description: e.target.value };
                      update("projects", next);
                    }}
                  />
                  <input
                    className={fieldCls}
                    placeholder="Tech (comma-separated)"
                    value={p.tech.join(", ")}
                    onChange={(e) => {
                      const next = [...resume.projects];
                      next[i] = {
                        ...next[i],
                        tech: e.target.value.split(",").map((x) => x.trim()).filter(Boolean),
                      };
                      update("projects", next);
                    }}
                  />
                  <input
                    className={fieldCls}
                    placeholder="Impact (e.g. cut latency 40%)"
                    value={p.impact}
                    onChange={(e) => {
                      const next = [...resume.projects];
                      next[i] = { ...next[i], impact: e.target.value };
                      update("projects", next);
                    }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className={labelCls}>Education</p>
              <AddBtn
                label="Add education"
                onClick={() =>
                  update("education", [
                    ...resume.education,
                    { degree: "", school: "", dates: "", detail: "" },
                  ])
                }
              />
            </div>
            <div className="space-y-2">
              {resume.education.map((ed, i) => (
                <div key={i} className="rounded-lg border border-foreground/[0.06] p-3 bg-foreground/[0.015] space-y-2">
                  <div className="flex justify-end">
                    <RemoveBtn
                      onClick={() => update("education", resume.education.filter((_, j) => j !== i))}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      className={cn(fieldCls, "font-semibold")}
                      placeholder="Degree"
                      value={ed.degree}
                      onChange={(e) => {
                        const next = [...resume.education];
                        next[i] = { ...next[i], degree: e.target.value };
                        update("education", next);
                      }}
                    />
                    <input
                      className={fieldCls}
                      placeholder="School"
                      value={ed.school}
                      onChange={(e) => {
                        const next = [...resume.education];
                        next[i] = { ...next[i], school: e.target.value };
                        update("education", next);
                      }}
                    />
                    <input
                      className={fieldCls}
                      placeholder="Dates"
                      value={ed.dates}
                      onChange={(e) => {
                        const next = [...resume.education];
                        next[i] = { ...next[i], dates: e.target.value };
                        update("education", next);
                      }}
                    />
                    <input
                      className={fieldCls}
                      placeholder="Detail (GPA, honors)"
                      value={ed.detail}
                      onChange={(e) => {
                        const next = [...resume.education];
                        next[i] = { ...next[i], detail: e.target.value };
                        update("education", next);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Achievements */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className={labelCls}>Achievements</p>
              <AddBtn
                label="Add achievement"
                onClick={() => update("achievements", [...resume.achievements, ""])}
              />
            </div>
            <div className="space-y-2">
              {resume.achievements.map((a, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
                  <textarea
                    className={textareaCls}
                    rows={2}
                    value={a}
                    onChange={(e) => {
                      const next = [...resume.achievements];
                      next[i] = e.target.value;
                      update("achievements", next);
                    }}
                  />
                  <RemoveBtn
                    onClick={() =>
                      update("achievements", resume.achievements.filter((_, j) => j !== i))
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <ResumePreview resume={resume} typo={typo} />
      )}
    </SectionCard>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
      {label}
    </span>
    <div className="mt-1">{children}</div>
  </label>
);

const RemoveBtn = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="p-1.5 rounded-md text-foreground/40 hover:text-[hsl(0_70%_50%)] hover:bg-[hsl(0_70%_50%/0.08)] transition-colors shrink-0"
    title="Remove"
  >
    <Trash2 className="w-3.5 h-3.5" />
  </button>
);

const AddBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-foreground/[0.05] hover:bg-foreground/[0.1] text-[11.5px] font-medium tracking-tight text-foreground/75 transition-colors"
  >
    <Plus className="w-3 h-3" /> {label}
  </button>
);

const AlignToggle = ({
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
      "w-7 h-7 inline-flex items-center justify-center rounded transition-colors",
      active
        ? "bg-foreground text-background"
        : "text-foreground/65 hover:text-foreground hover:bg-foreground/[0.06]",
    )}
  >
    {children}
  </button>
);

// ----- Live preview (matches the document preview style) -----
const ResumePreview = ({
  resume,
  typo,
}: {
  resume: EditableResume;
  typo: ResumeTypography;
}) => {
  const scale = typo.sizeScale;
  // Helper to render an em-scaled, aligned size
  const sz = (px: number) => `${(px * scale).toFixed(2)}px`;
  const headerAlign =
    typo.headerAlign === "left" ? "text-left" : typo.headerAlign === "right" ? "text-right" : "text-center";
  const bodyAlign =
    typo.bodyAlign === "center" ? "text-center" : typo.bodyAlign === "justify" ? "text-justify" : "text-left";
  return (
  <div
    className={cn("px-7 sm:px-10 py-9 bg-white text-[#0E0B1F] max-h-[80vh] overflow-y-auto", bodyAlign)}
    style={{ fontFamily: FONT_STACKS[typo.font], lineHeight: typo.lineHeight }}
  >
    <div className={headerAlign}>
      <h1 className="font-semibold tracking-[-0.02em]" style={{ fontSize: sz(26) }}>
        {resume.contact.name || "Your name"}
      </h1>
      {resume.headline && (
        <p className="mt-1 text-[14px] text-[#0E0B1F]/70 tracking-tight">{resume.headline}</p>
      )}
      <p className="mt-1.5 text-[11.5px] text-[#0E0B1F]/55 tracking-tight">
        {[
          resume.contact.location,
          resume.contact.email,
          resume.contact.phone,
          ...resume.contact.links.map((l) => l.label),
        ]
          .filter(Boolean)
          .join("  ·  ")}
      </p>
    </div>
    {resume.summary && (
      <PreviewSection title="Summary">
        <p className="text-[13px] leading-[1.55] text-[#0E0B1F]/85">{resume.summary}</p>
      </PreviewSection>
    )}
    {resume.skills.length > 0 && (
      <PreviewSection title="Skills">
        <ul className="space-y-1">
          {resume.skills.map((s, i) => (
            <li key={i} className="text-[13px] text-[#0E0B1F]/85">
              <span className="font-semibold">{s.group}:</span> {s.items.join(", ")}
            </li>
          ))}
        </ul>
      </PreviewSection>
    )}
    {resume.experience.length > 0 && (
      <PreviewSection title="Experience">
        <ul className="space-y-4">
          {resume.experience.map((e, i) => (
            <li key={i}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13.5px] font-semibold">
                  {e.role} <span className="font-normal text-[#0E0B1F]/65">— {e.company}</span>
                </p>
                <p className="text-[11.5px] text-[#0E0B1F]/55 shrink-0">{e.dates}</p>
              </div>
              {e.location && <p className="text-[11.5px] text-[#0E0B1F]/55">{e.location}</p>}
              <ul className="mt-1.5 space-y-1">
                {e.bullets.filter(Boolean).map((b, j) => (
                  <li key={j} className="text-[12.5px] leading-[1.5] text-[#0E0B1F]/85 pl-3 relative">
                    <span className="absolute left-0 top-[9px] w-1 h-1 rounded-full bg-[#0E0B1F]/60" />
                    {b}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </PreviewSection>
    )}
    {resume.projects.length > 0 && (
      <PreviewSection title="Projects">
        <ul className="space-y-2.5">
          {resume.projects.map((p, i) => (
            <li key={i}>
              <p className="text-[13px] font-semibold">
                {p.name}
                {p.tech.length > 0 && (
                  <span className="ml-2 font-normal text-[11.5px] text-[#0E0B1F]/55">
                    {p.tech.join(", ")}
                  </span>
                )}
              </p>
              <p className="text-[12.5px] leading-[1.5] text-[#0E0B1F]/85">
                {p.description}
                {p.impact && <span className="text-[#0E0B1F]/65"> — {p.impact}</span>}
              </p>
            </li>
          ))}
        </ul>
      </PreviewSection>
    )}
    {resume.education.length > 0 && (
      <PreviewSection title="Education">
        <ul className="space-y-2">
          {resume.education.map((e, i) => (
            <li key={i}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-semibold">{e.degree}</p>
                {e.dates && <p className="text-[11.5px] text-[#0E0B1F]/55 shrink-0">{e.dates}</p>}
              </div>
              <p className="text-[12.5px] text-[#0E0B1F]/70">{e.school}</p>
              {e.detail && <p className="text-[11.5px] text-[#0E0B1F]/55">{e.detail}</p>}
            </li>
          ))}
        </ul>
      </PreviewSection>
    )}
    {resume.achievements.length > 0 && (
      <PreviewSection title="Achievements">
        <ul className="space-y-1">
          {resume.achievements.filter(Boolean).map((a, i) => (
            <li key={i} className="text-[12.5px] leading-[1.5] text-[#0E0B1F]/85 pl-3 relative">
              <span className="absolute left-0 top-[9px] w-1 h-1 rounded-full bg-[#0E0B1F]/60" />
              {a}
            </li>
          ))}
        </ul>
      </PreviewSection>
    )}
  </div>
  );
};

const PreviewSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-6">
    <h2 className="text-[10.5px] tracking-[0.22em] uppercase font-semibold text-[#0E0B1F]/55 border-b border-[#0E0B1F]/15 pb-1.5 mb-2.5">
      {title}
    </h2>
    {children}
  </section>
);

// ===== Serializers =====

export function toPlainText(r: EditableResume): string {
  const lines: string[] = [];
  if (r.contact.name) lines.push(r.contact.name.toUpperCase());
  if (r.headline) lines.push(r.headline);
  const meta = [
    r.contact.location,
    r.contact.email,
    r.contact.phone,
    ...r.contact.links.map((l) => `${l.label}: ${l.url}`),
  ]
    .filter(Boolean)
    .join("  |  ");
  if (meta) lines.push(meta);
  lines.push("");

  if (r.summary) {
    lines.push("SUMMARY");
    lines.push(r.summary);
    lines.push("");
  }
  if (r.skills.length) {
    lines.push("SKILLS");
    r.skills.forEach((s) => lines.push(`${s.group}: ${s.items.join(", ")}`));
    lines.push("");
  }
  if (r.experience.length) {
    lines.push("EXPERIENCE");
    r.experience.forEach((x) => {
      lines.push(
        `${x.role} - ${x.company}${x.location ? `, ${x.location}` : ""} (${x.dates})`,
      );
      x.bullets.filter(Boolean).forEach((b) => lines.push(`- ${b}`));
      lines.push("");
    });
  }
  if (r.projects.length) {
    lines.push("PROJECTS");
    r.projects.forEach((p) => {
      lines.push(`${p.name}${p.tech.length ? ` - ${p.tech.join(", ")}` : ""}`);
      lines.push(`  ${p.description}${p.impact ? ` Impact: ${p.impact}` : ""}`);
    });
    lines.push("");
  }
  if (r.education.length) {
    lines.push("EDUCATION");
    r.education.forEach((ed) => {
      lines.push(`${ed.degree} - ${ed.school}${ed.dates ? ` (${ed.dates})` : ""}`);
      if (ed.detail) lines.push(`  ${ed.detail}`);
    });
    lines.push("");
  }
  if (r.achievements.length) {
    lines.push("ACHIEVEMENTS");
    r.achievements.filter(Boolean).forEach((a) => lines.push(`- ${a}`));
  }
  return lines.join("\n").trim();
}

// ----- PDF (jsPDF, ATS-friendly text) -----
// Sanitize Unicode glyphs that jsPDF's built-in WinAnsi-encoded fonts cannot render
// (₹, smart quotes, em/en dashes, middle dot, bullet, ellipsis). Rendering these
// directly produces wrong glyphs like "¹" instead of "₹".
function sanitizeForPdf(s: string): string {
  if (!s) return "";
  return s
    .replace(/\u20B9/g, "Rs.") // ₹
    .replace(/\u20AC/g, "EUR") // €  (keep $ and £ which ARE in WinAnsi)
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, "-") // – —
    .replace(/\u2022/g, "-") // bullet
    .replace(/\u00B7/g, "-") // middle dot
    .replace(/\u2026/g, "...")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function setFontSafe(
  doc: jsPDF,
  weight: "normal" | "bold",
  size: number,
  color: [number, number, number],
) {
  // Reset state that can cause double-stroked / outlined text artifacts.
  doc.setFont("helvetica", weight);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setLineWidth(0);
  doc.setDrawColor(color[0], color[1], color[2]);
  // jsPDF exposes setTextRenderingMode in newer versions; guard for safety.
  const anyDoc = doc as unknown as { setTextRenderingMode?: (m: number) => void };
  if (typeof anyDoc.setTextRenderingMode === "function") {
    anyDoc.setTextRenderingMode(0); // 0 = fill only
  }
}

function renderPdf(r: EditableResume): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 54;
  const maxW = pageW - margin * 2;
  let y = margin;

  const s = sanitizeForPdf;

  const ensureSpace = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeText = (
    text: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number } = {},
  ) => {
    const { size = 10, bold = false, color = [20, 20, 30], gap = 4 } = opts;
    setFontSafe(doc, bold ? "bold" : "normal", size, color);
    const lines = doc.splitTextToSize(s(text), maxW);
    const lineH = size * 1.25;
    ensureSpace(lines.length * lineH + gap);
    doc.text(lines, margin, y);
    y += lines.length * lineH + gap;
  };

  const sectionTitle = (title: string) => {
    y += 6;
    ensureSpace(22);
    setFontSafe(doc, "bold", 10, [80, 80, 100]);
    doc.text(s(title.toUpperCase()), margin, y);
    y += 4;
    doc.setDrawColor(200, 200, 210);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 10;
  };

  // Header — name centered
  if (r.contact.name) {
    setFontSafe(doc, "bold", 20, [15, 15, 25]);
    doc.text(s(r.contact.name), pageW / 2, y, { align: "center" });
    y += 22;
  }
  if (r.headline) {
    setFontSafe(doc, "normal", 11, [80, 80, 100]);
    doc.text(s(r.headline), pageW / 2, y, { align: "center" });
    y += 14;
  }
  const contactBits = [
    r.contact.location,
    r.contact.email,
    r.contact.phone,
    ...r.contact.links.map((l) => l.url || l.label),
  ]
    .filter(Boolean)
    .map(s);
  if (contactBits.length) {
    setFontSafe(doc, "normal", 9, [110, 110, 130]);
    doc.text(contactBits.join("  |  "), pageW / 2, y, { align: "center" });
    y += 14;
  }
  y += 4;

  if (r.summary) {
    sectionTitle("Summary");
    writeText(r.summary, { size: 10 });
  }

  if (r.skills.length) {
    sectionTitle("Skills");
    r.skills.forEach((sk) => {
      const groupLabel = `${s(sk.group)}: `;
      const itemsText = s(sk.items.join(", "));
      // Measure bold group label width, then lay out items as wrapped text starting after it.
      setFontSafe(doc, "bold", 10, [20, 20, 30]);
      const groupW = doc.getTextWidth(groupLabel);
      const lineH = 12.5;
      const firstLineMaxW = Math.max(40, maxW - groupW);
      // Wrap items: first line shorter (after label), subsequent lines full width.
      setFontSafe(doc, "normal", 10, [30, 30, 40]);
      const firstWrap = doc.splitTextToSize(itemsText, firstLineMaxW);
      const firstLine = firstWrap[0] ?? "";
      const remainder = itemsText.slice(firstLine.length).trim();
      const restLines = remainder ? doc.splitTextToSize(remainder, maxW) : [];
      const totalLines = 1 + restLines.length;
      ensureSpace(totalLines * lineH + 2);
      // Draw bold group label
      setFontSafe(doc, "bold", 10, [20, 20, 30]);
      doc.text(groupLabel, margin, y);
      // Draw items normal
      setFontSafe(doc, "normal", 10, [30, 30, 40]);
      doc.text(firstLine, margin + groupW, y);
      let yy = y + lineH;
      restLines.forEach((ln: string) => {
        doc.text(ln, margin, yy);
        yy += lineH;
      });
      y = yy + 2;
    });
  }

  if (r.experience.length) {
    sectionTitle("Experience");
    r.experience.forEach((x) => {
      ensureSpace(28);
      setFontSafe(doc, "bold", 11, [20, 20, 30]);
      const head = `${s(x.role)} - ${s(x.company)}`;
      doc.text(head, margin, y);
      if (x.dates) {
        setFontSafe(doc, "normal", 9, [110, 110, 130]);
        doc.text(s(x.dates), pageW - margin, y, { align: "right" });
      }
      y += 13;
      if (x.location) {
        setFontSafe(doc, "normal", 9, [110, 110, 130]);
        doc.text(s(x.location), margin, y);
        y += 12;
      }
      x.bullets.filter(Boolean).forEach((b) => {
        setFontSafe(doc, "normal", 10, [30, 30, 40]);
        const lines = doc.splitTextToSize(`- ${s(b)}`, maxW - 10);
        const h = lines.length * 12 + 2;
        ensureSpace(h);
        doc.text(lines, margin + 8, y);
        y += h;
      });
      y += 4;
    });
  }

  if (r.projects.length) {
    sectionTitle("Projects");
    r.projects.forEach((p) => {
      ensureSpace(24);
      setFontSafe(doc, "bold", 10.5, [20, 20, 30]);
      const pname = s(p.name);
      doc.text(pname, margin, y);
      if (p.tech.length) {
        const w = doc.getTextWidth(pname);
        setFontSafe(doc, "normal", 9, [110, 110, 130]);
        doc.text(`  ${s(p.tech.join(", "))}`, margin + w, y);
      }
      y += 13;
      const body = `${p.description}${p.impact ? ` - ${p.impact}` : ""}`;
      writeText(body, { size: 10, gap: 6 });
    });
  }

  if (r.education.length) {
    sectionTitle("Education");
    r.education.forEach((ed) => {
      ensureSpace(24);
      setFontSafe(doc, "bold", 10.5, [20, 20, 30]);
      doc.text(s(ed.degree), margin, y);
      if (ed.dates) {
        setFontSafe(doc, "normal", 9, [110, 110, 130]);
        doc.text(s(ed.dates), pageW - margin, y, { align: "right" });
      }
      y += 13;
      setFontSafe(doc, "normal", 10, [60, 60, 80]);
      doc.text(s(ed.school), margin, y);
      y += 12;
      if (ed.detail) {
        setFontSafe(doc, "normal", 9, [110, 110, 130]);
        doc.text(s(ed.detail), margin, y);
        y += 12;
      }
      y += 2;
    });
  }

  if (r.achievements.length) {
    sectionTitle("Achievements");
    r.achievements.filter(Boolean).forEach((a) => {
      setFontSafe(doc, "normal", 10, [30, 30, 40]);
      const lines = doc.splitTextToSize(`- ${s(a)}`, maxW - 10);
      const h = lines.length * 12 + 2;
      ensureSpace(h);
      doc.text(lines, margin + 8, y);
      y += h;
    });
  }

  return doc;
}

// ----- DOCX -----
function renderDocx(r: EditableResume): DocxDocument {
  const children: Paragraph[] = [];

  if (r.contact.name) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: r.contact.name, bold: true, size: 36 })],
      }),
    );
  }
  if (r.headline) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: r.headline, size: 22, color: "555770" })],
      }),
    );
  }
  const contactBits = [
    r.contact.location,
    r.contact.email,
    r.contact.phone,
    ...r.contact.links.map((l) => l.url || l.label),
  ].filter(Boolean);
  if (contactBits.length) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: contactBits.join("  ·  "), size: 18, color: "777890" }),
        ],
        spacing: { after: 200 },
      }),
    );
  }

  const sectionHeading = (title: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 100 },
      border: {
        bottom: { color: "CCCCD0", style: "single", size: 6, space: 1 },
      },
      children: [
        new TextRun({ text: title.toUpperCase(), bold: true, size: 20, color: "505070" }),
      ],
    });

  if (r.summary) {
    children.push(sectionHeading("Summary"));
    children.push(new Paragraph({ children: [new TextRun({ text: r.summary, size: 20 })] }));
  }

  if (r.skills.length) {
    children.push(sectionHeading("Skills"));
    r.skills.forEach((s) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${s.group}: `, bold: true, size: 20 }),
            new TextRun({ text: s.items.join(", "), size: 20 }),
          ],
        }),
      );
    });
  }

  if (r.experience.length) {
    children.push(sectionHeading("Experience"));
    r.experience.forEach((x) => {
      children.push(
        new Paragraph({
          spacing: { before: 120 },
          children: [
            new TextRun({ text: `${x.role} — ${x.company}`, bold: true, size: 22 }),
            ...(x.dates ? [new TextRun({ text: `   ${x.dates}`, size: 18, color: "777890" })] : []),
          ],
        }),
      );
      if (x.location) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: x.location, size: 18, color: "777890" })],
          }),
        );
      }
      x.bullets.filter(Boolean).forEach((b) => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${b}`, size: 20 })],
            indent: { left: 240 },
          }),
        );
      });
    });
  }

  if (r.projects.length) {
    children.push(sectionHeading("Projects"));
    r.projects.forEach((p) => {
      children.push(
        new Paragraph({
          spacing: { before: 100 },
          children: [
            new TextRun({ text: p.name, bold: true, size: 21 }),
            ...(p.tech.length
              ? [new TextRun({ text: `  ${p.tech.join(", ")}`, size: 18, color: "777890" })]
              : []),
          ],
        }),
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${p.description}${p.impact ? ` — ${p.impact}` : ""}`,
              size: 20,
            }),
          ],
        }),
      );
    });
  }

  if (r.education.length) {
    children.push(sectionHeading("Education"));
    r.education.forEach((ed) => {
      children.push(
        new Paragraph({
          spacing: { before: 100 },
          children: [
            new TextRun({ text: ed.degree, bold: true, size: 21 }),
            ...(ed.dates ? [new TextRun({ text: `   ${ed.dates}`, size: 18, color: "777890" })] : []),
          ],
        }),
      );
      children.push(
        new Paragraph({ children: [new TextRun({ text: ed.school, size: 20, color: "555770" })] }),
      );
      if (ed.detail) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: ed.detail, size: 18, color: "777890" })],
          }),
        );
      }
    });
  }

  if (r.achievements.length) {
    children.push(sectionHeading("Achievements"));
    r.achievements.filter(Boolean).forEach((a) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${a}`, size: 20 })],
          indent: { left: 240 },
        }),
      );
    });
  }

  return new DocxDocument({
    styles: {
      default: { document: { run: { font: "Calibri", size: 20 } } },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
          },
        },
        children,
      },
    ],
  });
}
