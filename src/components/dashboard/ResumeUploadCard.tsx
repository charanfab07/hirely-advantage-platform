import { useRef, useState } from "react";
import { Loader2, Upload, FileText, X, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SectionCard } from "./SectionCard";
import {
  ACCEPTED_EXTS,
  ACCEPTED_MIME,
  MAX_FILE_BYTES,
  extToMime,
  extractResumeText,
} from "@/lib/resumeParser";
import { cn } from "@/lib/utils";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PLAN_LABEL } from "@/lib/entitlements";

type Stage = "idle" | "extracting" | "uploading" | "analyzing";

type Props = {
  userId: string;
  onAnalyzed: (analysisId: string) => void;
  className?: string;
};

export const ResumeUploadCard = ({ userId, onAnalyzed, className }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const ent = useEntitlements();
  const uploadAllowed = ent.can("resume_uploads");
  const analysisAllowed = ent.can("analyses");
  const blocked = !ent.loading && (!uploadAllowed || !analysisAllowed);

  const stageLabel: Record<Stage, string> = {
    idle: "",
    extracting: "Reading resume…",
    uploading: "Uploading…",
    analyzing: "AI is reviewing — this takes ~10s",
  };

  const reset = () => {
    setStage("idle");
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    if (blocked) {
      toast.error(`Your ${PLAN_LABEL[ent.plan]} plan limit is reached. Upgrade for more uploads.`);
      return;
    }
    try {
      // Validate
      if (file.size > MAX_FILE_BYTES) {
        toast.error("File too large. Max 10 MB.");
        return;
      }
      const mime = file.type || extToMime(file.name) || "";
      if (!ACCEPTED_MIME.includes(mime)) {
        toast.error("Unsupported file. Use PDF, DOCX or TXT.");
        return;
      }
      setFileName(file.name);

      // 1) Extract text in browser
      setStage("extracting");
      const text = await extractResumeText(file);
      if (!text || text.length < 80) {
        toast.error("Couldn't read enough text. Try a different file.");
        reset();
        return;
      }

      // 2) Upload original to storage
      setStage("uploading");
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${userId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("resumes")
        .upload(path, file, { contentType: mime, upsert: false });
      if (upErr) throw upErr;

      // 3) Insert resume row
      const { data: resumeRow, error: insErr } = await supabase
        .from("resumes")
        .insert({
          user_id: userId,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: mime,
          raw_text: text,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      // 4) Analyze
      setStage("analyzing");
      const { data: fnData, error: fnErr } = await supabase.functions.invoke(
        "analyze-resume",
        {
          body: {
            resume_id: resumeRow.id,
            raw_text: text,
            target_role: targetRole.trim() || undefined,
          },
        },
      );
      if (fnErr) {
        // Try to extract a useful error message
        const msg =
          (fnErr as { message?: string })?.message || "Analysis failed";
        throw new Error(msg);
      }
      if (fnData?.error) throw new Error(fnData.error);

      const analysisId = fnData?.analysis?.id as string | undefined;
      if (!analysisId) throw new Error("No analysis returned");

      toast.success("Resume analyzed.");
      onAnalyzed(analysisId);
      reset();
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
      reset();
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (stage !== "idle") return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const busy = stage !== "idle";

  return (
    <SectionCard className={cn("p-0 overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        disabled={busy}
        className={cn(
          "w-full text-left p-6 sm:p-7 transition-colors",
          dragOver ? "bg-foreground/[0.03]" : "bg-transparent",
          busy && "cursor-default",
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center",
              busy
                ? "bg-foreground/5"
                : "bg-gradient-to-br from-[#0E0B1F] to-[#3a2d5e] text-white",
            )}
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin text-foreground/70" />
            ) : fileName ? (
              <FileText className="w-4 h-4" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium">
              {busy ? "Working" : "Upload your resume"}
            </p>
            <p className="mt-1 text-[16px] leading-snug font-medium tracking-tight text-foreground truncate">
              {busy
                ? stageLabel[stage]
                : fileName ?? "Drop a PDF, DOCX or TXT — or click to browse"}
            </p>
            <p className="mt-1 text-[12px] text-foreground/55">
              {busy
                ? "Hang tight. This is a real review, not a checkbox."
                : "We extract skills, experience, projects, and run an ATS check."}
            </p>
          </div>
          {fileName && !busy && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              className="shrink-0 w-7 h-7 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/60"
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {busy && (
          <div className="mt-4 h-[3px] rounded-full bg-foreground/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full animate-pulse"
              style={{
                width: stage === "extracting" ? "30%" : stage === "uploading" ? "60%" : "92%",
                background: "linear-gradient(90deg,#0E0B1F,#6D54B3)",
                transition: "width 600ms ease",
              }}
            />
          </div>
        )}
      </button>

      <div className="border-t border-foreground/[0.06] px-6 sm:px-7 py-3 flex items-center gap-3">
        <span className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/45 font-medium shrink-0">
          Target role
        </span>
        <input
          type="text"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          disabled={busy}
          placeholder="e.g. Senior PM at Linear (optional — sharpens job-match %)"
          className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-foreground/35 outline-none tracking-tight"
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTS.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </SectionCard>
  );
};
