import { ALLOWED_ACCENTS } from "@/lib/resumeBuilder/templates";
import type { ResumeDocument, ResumeSettings } from "@/lib/resumeBuilder/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SettingsCard({
  doc,
  setDoc,
}: {
  doc: ResumeDocument;
  setDoc: (d: ResumeDocument) => void;
}) {
  const s = doc.settings;
  const set = (patch: Partial<ResumeSettings>) =>
    setDoc({ ...doc, settings: { ...s, ...patch } });

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-4 space-y-3">
      <div className="text-[10.5px] uppercase tracking-[0.18em] text-foreground/50">
        Appearance
      </div>

      <Row label="Font">
        <Select value={s.fontFamily} onValueChange={(v) => set({ fontFamily: v as ResumeSettings["fontFamily"] })}>
          <SelectTrigger className="h-8 text-[12.5px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Inter">Inter (sans)</SelectItem>
            <SelectItem value="Arial">Arial (sans)</SelectItem>
            <SelectItem value="Times">Times New Roman (serif)</SelectItem>
            <SelectItem value="Georgia">Georgia (serif)</SelectItem>
          </SelectContent>
        </Select>
      </Row>

      <Row label="Font size">
        <Select
          value={String(s.fontSize)}
          onValueChange={(v) => set({ fontSize: Number(v) as ResumeSettings["fontSize"] })}
        >
          <SelectTrigger className="h-8 text-[12.5px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 10.5, 11, 11.5, 12].map((n) => (
              <SelectItem key={n} value={String(n)}>{n} pt</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>

      <Row label="Spacing">
        <Select value={s.spacing} onValueChange={(v) => set({ spacing: v as ResumeSettings["spacing"] })}>
          <SelectTrigger className="h-8 text-[12.5px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compact">Compact</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="relaxed">Relaxed</SelectItem>
          </SelectContent>
        </Select>
      </Row>

      <div>
        <div className="text-[11px] text-foreground/55 mb-1.5">Accent color</div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {ALLOWED_ACCENTS.map((a) => {
            const active = s.accent.toLowerCase() === a.value.toLowerCase();
            return (
              <button
                key={a.value}
                title={a.label}
                onClick={() => set({ accent: a.value })}
                className={
                  "w-6 h-6 rounded-full border transition-all " +
                  (active
                    ? "border-foreground ring-2 ring-foreground/40 scale-110"
                    : "border-foreground/20 hover:scale-105")
                }
                style={{ background: a.value }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-2">
      <span className="text-[11.5px] text-foreground/55">{label}</span>
      {children}
    </div>
  );
}
