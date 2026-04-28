import { LogoLockup } from "./Logo";

const cols = [
  {
    title: "Product",
    links: ["ATS Simulator", "Outreach Engine", "Voice Coach", "Skill Roadmap"],
  },
  { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
];

export const Footer = () => {
  return (
    <footer className="px-4 pb-10">
      <div className="mx-auto max-w-6xl glass rounded-3xl p-10 md:p-14">
        <div className="grid md:grid-cols-5 gap-10">
          <div className="md:col-span-2">
            <LogoLockup size={32} />

            <p className="mt-4 text-sm text-foreground/60 max-w-xs leading-relaxed">
              Reverse-engineering the hiring process for the world's most ambitious candidates.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-foreground/50 mb-4">
                {c.title}
              </p>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-foreground/75 hover:text-foreground transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-foreground/50">© 2026 Hirely AI. All rights reserved.</p>
          <p className="text-xs text-foreground/50">Crafted for top-tier candidates.</p>
        </div>
      </div>
    </footer>
  );
};
