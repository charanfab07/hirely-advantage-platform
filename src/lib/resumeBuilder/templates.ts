import {
  APPROVED_SECTION_NAMES,
  DEFAULT_SECTION_NAME,
  type AtsTemplateMeta,
  type ResumeDocument,
  type Section,
  type SectionType,
} from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

const blankPersonal = () => ({
  name: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  links: [] as { label: string; url: string }[],
});

const sec = (type: SectionType, name?: string): Section => ({
  id: uid(),
  type,
  name: name ?? DEFAULT_SECTION_NAME[type],
  enabled: true,
});

export const ATS_TEMPLATES: AtsTemplateMeta[] = [
  {
    id: "classic-ats",
    name: "Classic ATS",
    description:
      "The safest possible layout — black text, single column, standard headings. Works in every ATS.",
    atsSafe: true,
  },
  {
    id: "modern-ats",
    name: "Modern ATS",
    description:
      "Clean, slightly more breathable spacing with a small navy accent on headings. Still single column, no graphics.",
    atsSafe: true,
  },
  {
    id: "tech-fresher",
    name: "Tech Fresher",
    description:
      "Education and projects up top — tuned for new grads and interns applying for engineering roles.",
    atsSafe: true,
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    description:
      "Skills and experience first, with grouped technical skills (SQL, Python, BI). Optimized for analyst keywords.",
    atsSafe: true,
  },
  {
    id: "software-engineer",
    name: "Software Engineer",
    description:
      "Experience-first layout with tech stack groupings. Recruiter-friendly for SWE pipelines.",
    atsSafe: true,
  },
];

export function emptyDocument(templateId: string): ResumeDocument {
  switch (templateId) {
    case "modern-ats":
      return {
        templateId,
        sections: [
          sec("summary"),
          sec("skills"),
          sec("experience"),
          sec("projects"),
          sec("education"),
          sec("certifications"),
          sec("achievements"),
        ],
        content: emptyContent(),
        settings: {
          fontFamily: "Inter",
          fontSize: 11,
          spacing: "normal",
          accent: "#1F3A8A",
        },
      };
    case "tech-fresher":
      return {
        templateId,
        sections: [
          sec("summary"),
          sec("education"),
          sec("skills", "Technical Skills"),
          sec("projects"),
          sec("experience", "Experience"),
          sec("certifications"),
          sec("achievements"),
        ],
        content: emptyContent(),
        settings: {
          fontFamily: "Inter",
          fontSize: 11,
          spacing: "normal",
          accent: "#111827",
        },
      };
    case "data-analyst":
      return {
        templateId,
        sections: [
          sec("summary"),
          sec("skills", "Technical Skills"),
          sec("experience"),
          sec("projects"),
          sec("education"),
          sec("certifications"),
          sec("achievements"),
        ],
        content: emptyContent(),
        settings: {
          fontFamily: "Arial",
          fontSize: 11,
          spacing: "normal",
          accent: "#0E7490",
        },
      };
    case "software-engineer":
      return {
        templateId,
        sections: [
          sec("summary"),
          sec("skills", "Technical Skills"),
          sec("experience"),
          sec("projects"),
          sec("education"),
          sec("certifications"),
          sec("achievements"),
        ],
        content: emptyContent(),
        settings: {
          fontFamily: "Inter",
          fontSize: 11,
          spacing: "normal",
          accent: "#111827",
        },
      };
    case "classic-ats":
    default:
      return {
        templateId: "classic-ats",
        sections: [
          sec("summary"),
          sec("experience"),
          sec("education"),
          sec("skills"),
          sec("projects"),
          sec("certifications"),
          sec("achievements"),
        ],
        content: emptyContent(),
        settings: {
          fontFamily: "Times",
          fontSize: 11,
          spacing: "normal",
          accent: "#000000",
        },
      };
  }
}

function emptyContent() {
  return {
    personal: blankPersonal(),
    summary: "",
    skills: [{ id: uid(), name: "Core", items: [] }],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    achievements: [],
  };
}

export const ALLOWED_ACCENTS = [
  { label: "Black", value: "#000000" },
  { label: "Slate", value: "#111827" },
  { label: "Navy", value: "#1F3A8A" },
  { label: "Forest", value: "#065F46" },
  { label: "Teal", value: "#0E7490" },
  { label: "Wine", value: "#7F1D1D" },
];

export function isApprovedName(type: SectionType, name: string) {
  return APPROVED_SECTION_NAMES[type].includes(name.trim());
}

export const newId = uid;
