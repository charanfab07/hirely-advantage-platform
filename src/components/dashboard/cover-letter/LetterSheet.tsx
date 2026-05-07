import { cn } from "@/lib/utils";
import {
  FONT_STACKS,
  toTitleCaseName,
  type LetterDoc,
  type TypoSettings,
} from "@/lib/coverLetter/types";

const EditableLine = ({
  value,
  onChange,
  placeholder,
  accentBold,
  onBlurTransform,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  accentBold?: boolean;
  onBlurTransform?: (v: string) => string;
}) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onBlur={(e) => {
      if (!onBlurTransform) return;
      const next = onBlurTransform(e.target.value);
      if (next !== e.target.value) onChange(next);
    }}
    placeholder={placeholder}
    className={cn(
      "block w-full bg-transparent border-0 outline-none px-0 py-0.5 text-foreground placeholder:text-foreground/35 focus:bg-foreground/[0.03] rounded-sm transition-colors",
      accentBold && "font-semibold",
    )}
    style={{ font: "inherit", color: "inherit", textAlign: "inherit" }}
  />
);

/**
 * Editable letterhead-style sheet. Renders an empty placeholder when no
 * letter has been generated yet. Used both inline (compact) on the
 * generator page and full-bleed inside the fullscreen editor.
 */
export const LetterSheet = ({
  doc,
  update,
  hasLetter,
  isEmpty = false,
  typo,
  compact,
}: {
  doc: LetterDoc;
  update: <K extends keyof LetterDoc>(key: K, value: LetterDoc[K]) => void;
  hasLetter: boolean;
  isEmpty?: boolean;
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

  if (isEmpty) {
    return (
      <div
        className={cn(
          "mx-auto bg-background border border-dashed border-foreground/15 rounded-md text-foreground/50 flex items-center justify-center text-center",
          maxW,
          padX,
        )}
        style={{ minHeight: compact ? 360 : 560 }}
      >
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground/70">
            Your cover letter will appear here
          </p>
          <p className="text-xs text-foreground/45">
            Paste a job description on the left, then click Generate.
          </p>
        </div>
      </div>
    );
  }

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
      <div>
        <EditableLine
          value={doc.senderName}
          onChange={(v) => update("senderName", v)}
          onBlurTransform={toTitleCaseName}
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

export default LetterSheet;
