import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Type,
  Download,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FONT_LABELS,
  type FontKey,
  type TypoSettings,
} from "@/lib/coverLetter/types";

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

/**
 * Toolbar for the fullscreen editor. Pure presentational — receives the
 * typography state and a small set of callbacks.
 */
export function FullscreenToolbar({
  typo,
  updateTypo,
  hasLetter,
  onPdf,
  onDocx,
  onTxt,
  onExit,
}: {
  typo: TypoSettings;
  updateTypo: <K extends keyof TypoSettings>(key: K, value: TypoSettings[K]) => void;
  hasLetter: boolean;
  onPdf: () => void;
  onDocx: () => void;
  onTxt: () => void;
  onExit: () => void;
}) {
  return (
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
          onClick={onPdf}
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
          onClick={onDocx}
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
          onClick={onTxt}
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
          onClick={onExit}
          className="inline-flex items-center gap-1.5 rounded-md border border-foreground/[0.1] bg-foreground/[0.03] px-2.5 py-1.5 text-[12px] font-medium tracking-tight text-foreground/80 hover:bg-foreground/[0.06] transition-colors"
          title="Exit full screen (Esc)"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          Exit
        </button>
      </div>
    </div>
  );
}

export default FullscreenToolbar;
