import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Curated list of common target roles, grouped by domain.
 * Users can still type freely — this is just to give them a head start.
 */
const ROLE_GROUPS: { label: string; roles: string[] }[] = [
  {
    label: "Product",
    roles: [
      "Associate Product Manager",
      "Product Manager",
      "Senior Product Manager",
      "Group Product Manager",
      "Director of Product",
      "Technical Product Manager",
      "Growth Product Manager",
    ],
  },
  {
    label: "Engineering",
    roles: [
      "Software Engineer",
      "Senior Software Engineer",
      "Staff Software Engineer",
      "Frontend Engineer",
      "Backend Engineer",
      "Full-Stack Engineer",
      "Mobile Engineer (iOS / Android)",
      "DevOps / SRE Engineer",
      "Engineering Manager",
    ],
  },
  {
    label: "Data & AI",
    roles: [
      "Data Analyst",
      "Data Scientist",
      "Senior Data Scientist",
      "Machine Learning Engineer",
      "AI / ML Research Engineer",
      "Data Engineer",
      "Analytics Engineer",
    ],
  },
  {
    label: "Design",
    roles: [
      "Product Designer",
      "Senior Product Designer",
      "UX Designer",
      "UI Designer",
      "UX Researcher",
      "Design Lead",
    ],
  },
  {
    label: "Marketing & Growth",
    roles: [
      "Marketing Manager",
      "Growth Marketer",
      "Content Marketer",
      "Performance Marketing Manager",
      "Product Marketing Manager",
      "SEO Specialist",
    ],
  },
  {
    label: "Business & Ops",
    roles: [
      "Business Analyst",
      "Strategy & Operations Manager",
      "Program Manager",
      "Project Manager",
      "Consultant (Management / Strategy)",
      "Operations Manager",
    ],
  },
  {
    label: "Sales & CS",
    roles: [
      "Account Executive",
      "Sales Development Representative",
      "Customer Success Manager",
      "Solutions Engineer",
      "Account Manager",
    ],
  },
  {
    label: "Finance & People",
    roles: [
      "Financial Analyst",
      "Investment Banking Analyst",
      "FP&A Manager",
      "HR Business Partner",
      "Recruiter / Talent Partner",
    ],
  },
];

const ALL_ROLES = ROLE_GROUPS.flatMap((g) => g.roles);

type Props = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Show a small list of "popular" chips above the input. */
  showQuickChips?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
};

/**
 * Text input with an inline dropdown of curated target-role suggestions.
 * - Click / focus → opens the panel
 * - Typing filters across all groups
 * - Clicking a suggestion fills the input and closes the panel
 * - User can still freely type any role
 */
export function RoleSuggestInput({
  value,
  onChange,
  disabled,
  placeholder,
  showQuickChips = false,
  className,
  inputClassName,
  id,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click — checks both the wrapper and the portaled panel.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const filteredGroups = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return ROLE_GROUPS;
    return ROLE_GROUPS
      .map((g) => ({
        ...g,
        roles: g.roles.filter((r) => r.toLowerCase().includes(q)),
      }))
      .filter((g) => g.roles.length > 0);
  }, [value]);

  const popular = ["Senior Product Manager", "Software Engineer", "Data Analyst", "Product Designer"];

  const dropdown = open && !disabled ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[80] max-h-[min(320px,42vh)] overflow-y-auto rounded-xl border border-foreground/[0.08] bg-background/95 backdrop-blur shadow-xl shadow-black/10"
        >
          <div className="sticky top-0 z-10 px-3 py-2 border-b border-foreground/[0.06] bg-background/95 backdrop-blur flex items-center gap-2 text-[11px] tracking-tight text-foreground/50">
            <Search className="w-3 h-3" />
            <span>
              {value.trim()
                ? `Matching "${value.trim()}"`
                : "Suggestions — pick one or keep typing"}
            </span>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="px-3 py-6 text-center text-[12px] text-foreground/50">
              No matches. You can use{" "}
              <span className="font-medium text-foreground/80">"{value.trim()}"</span> as your role.
            </div>
          ) : (
            <div className="py-1">
              {filteredGroups.map((g) => (
                <div key={g.label} className="py-1">
                  <div className="px-3 pt-1.5 pb-1 text-[10px] tracking-[0.18em] uppercase text-foreground/40 font-medium">
                    {g.label}
                  </div>
                  <ul>
                    {g.roles.map((r) => {
                      const active = value.trim().toLowerCase() === r.toLowerCase();
                      return (
                        <li key={r}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={active}
                            onMouseDown={(e) => {
                              // Prevent input blur from closing before we run.
                              e.preventDefault();
                              onChange(r);
                              setOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-1.5 text-[13px] tracking-tight transition-colors",
                              active
                                ? "bg-foreground/[0.07] text-foreground"
                                : "text-foreground/80 hover:bg-foreground/[0.05]",
                            )}
                          >
                            {r}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null;

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      {showQuickChips && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {popular.map((r) => {
            const active = value.trim().toLowerCase() === r.toLowerCase();
            return (
              <button
                key={r}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange(r);
                  setOpen(false);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium tracking-tight transition-colors border",
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-foreground/[0.03] border-foreground/[0.06] text-foreground/70 hover:bg-foreground/[0.06]",
                )}
              >
                {r}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          className={cn(
            "w-full bg-foreground/[0.03] border border-foreground/[0.06] rounded-lg px-3 py-2 pr-9 text-[13px] text-foreground placeholder:text-foreground/35 outline-none focus:border-foreground/20 transition-colors",
            inputClassName,
          )}
        />
        <Sparkles
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/35"
        />
      </div>

      {dropdown}
    </div>
  );
}

export { ALL_ROLES, ROLE_GROUPS };
export default RoleSuggestInput;
