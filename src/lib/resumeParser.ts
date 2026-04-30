// Client-side resume text extraction. Runs entirely in the browser.
import * as pdfjsLib from "pdfjs-dist";
// @ts-expect-error - bundler resolves the worker URL
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
export const ACCEPTED_EXTS = [".pdf", ".docx", ".txt"];

export const extToMime = (name: string): string | null => {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower.endsWith(".txt")) return "text/plain";
  return null;
};

export async function extractResumeText(file: File): Promise<string> {
  const mime = file.type || extToMime(file.name) || "";

  if (mime === "text/plain") {
    return (await file.text()).trim();
  }

  if (
    mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return (result.value || "").trim();
  }

  if (mime === "application/pdf") {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const parts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        // @ts-expect-error - pdfjs item shape
        .map((it) => ("str" in it ? it.str : ""))
        .join(" ");
      parts.push(pageText);
    }
    return parts.join("\n\n").trim();
  }

  throw new Error("Unsupported file type. Use PDF, DOCX or TXT.");
}
