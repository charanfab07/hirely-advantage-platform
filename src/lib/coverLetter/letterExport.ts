// Export helpers for the cover letter flow: build plain text, copy to
// clipboard, save TXT / PDF / DOCX. Keeps all jsPDF + docx imports out of
// the page component so the editor itself stays small.
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import {
  DOCX_ALIGN,
  DOCX_FONT,
  PDF_FONT,
  type LetterDoc,
  type TypoSettings,
} from "./types";

export function buildPlainLetter(doc: LetterDoc, cleanExports: boolean): string {
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
  const signOff = [doc.signOff.trim() || "Sincerely,", doc.senderName]
    .filter(Boolean)
    .join("\n\n");
  if (signOff) parts.push(signOff);

  if (!cleanExports) {
    parts.push(
      "— — —\nGenerated with Hirely Free · hirely.app\nUpgrade to Pro to remove this watermark.",
    );
  }

  return parts.join("\n\n");
}

export function fileBase(doc: LetterDoc): string {
  const c = (doc.companyName || "company").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const n = (doc.senderName || "applicant").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return `cover-letter-${n}-${c}`;
}

export async function copyLetter(doc: LetterDoc, cleanExports: boolean) {
  await navigator.clipboard.writeText(buildPlainLetter(doc, cleanExports));
}

export function downloadTxt(doc: LetterDoc, cleanExports: boolean) {
  const blob = new Blob([buildPlainLetter(doc, cleanExports)], {
    type: "text/plain;charset=utf-8",
  });
  saveAs(blob, `${fileBase(doc)}.txt`);
}

export function downloadPdf(
  doc: LetterDoc,
  typo: TypoSettings,
  cleanExports: boolean,
): boolean {
  if (
    !cleanExports &&
    !confirm(
      "Free plan exports are watermarked. Upgrade to Pro for clean PDF/DOCX. Continue with watermark?",
    )
  ) {
    return false;
  }
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 72;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;

  const fontSizePt = Math.round(typo.fontSize * 0.85);
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

  const sender = [doc.senderName, doc.senderEmail, doc.senderPhone, doc.senderLocation]
    .filter((s) => s && s.trim())
    .join("\n");
  writeBlock(sender, { bold: true });

  writeBlock(doc.date);

  const recipient = [doc.hiringManager, doc.companyName, doc.companyAddress]
    .filter((s) => s && s.trim())
    .join("\n");
  writeBlock(recipient);

  writeBlock(doc.salutation);

  for (const p of doc.body.split(/\n\s*\n/)) writeBlock(p);

  writeBlock(doc.signOff || "Sincerely,");
  writeBlock(doc.senderName);

  if (!cleanExports) {
    const totalPages = (pdf as unknown as {
      internal: { getNumberOfPages: () => number };
    }).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      const prevSize = pdf.getFontSize();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(64);
      const gs = pdf as unknown as {
        GState: new (o: { opacity: number }) => unknown;
        setGState: (g: unknown) => void;
      };
      try {
        gs.setGState(new gs.GState({ opacity: 0.08 }));
      } catch (_e) { /* noop */ }
      pdf.setTextColor(120, 120, 120);
      pdf.text("HIRELY FREE", pageWidth / 2, pageHeight / 2, {
        align: "center",
        angle: -30,
      });
      try {
        gs.setGState(new gs.GState({ opacity: 1 }));
      } catch (_e) { /* noop */ }
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        "Generated with Hirely Free · upgrade to Pro to remove this watermark",
        pageWidth / 2,
        pageHeight - 36,
        { align: "center" },
      );
      pdf.setFontSize(prevSize);
    }
  }

  pdf.save(`${fileBase(doc)}.pdf`);
  return true;
}

export async function downloadDocx(
  doc: LetterDoc,
  typo: TypoSettings,
  cleanExports: boolean,
): Promise<{ ok: boolean; reason?: string }> {
  if (!cleanExports) {
    return {
      ok: false,
      reason:
        "Clean DOCX export is a Pro feature. Use the watermarked PDF or upgrade.",
    };
  }
  const docxFont = DOCX_FONT[typo.font];
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

  const senderLines = [
    doc.senderName,
    doc.senderEmail,
    doc.senderPhone,
    doc.senderLocation,
  ].filter((s) => s && s.trim());
  senderLines.forEach((l, i) => children.push(para(l, { bold: i === 0 })));
  if (senderLines.length) children.push(blank());

  if (doc.date.trim()) {
    children.push(para(doc.date.trim()));
    children.push(blank());
  }

  const recipientLines = [doc.hiringManager, doc.companyName, doc.companyAddress].filter(
    (s) => s && s.trim(),
  );
  if (recipientLines.length) {
    recipientLines.forEach((l) => children.push(para(l)));
    children.push(blank());
  }

  if (doc.salutation.trim()) children.push(para(doc.salutation.trim()));

  const bodyParas = doc.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  for (const p of bodyParas) children.push(para(p));

  children.push(para(doc.signOff || "Sincerely,"));
  children.push(blank());
  if (doc.senderName.trim()) children.push(para(doc.senderName.trim(), { bold: true }));

  const docx = new DocxDocument({
    styles: {
      default: { document: { run: { font: docxFont, size: sizeHalfPt } } },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(docx);
  saveAs(blob, `${fileBase(doc)}.docx`);
  return { ok: true };
}
