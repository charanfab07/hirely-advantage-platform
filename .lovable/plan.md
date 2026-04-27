## Hirely AI — Premium Landing Page

A single, immersive landing page that sells Hirely AI as an elite, AI-driven career acceleration platform. Focus is purely on the marketing site (no auth, no app yet) with a living gradient background, glassmorphism, and refined scroll choreography.

---

### Visual Foundation

**Animated fluid mesh gradient background (full-screen, fixed)**
- Base canvas: soft pearl `#FAFAFC`
- 4 large, heavily blurred radial gradient orbs:
  - Ethereal blue `#E1EFFF`
  - Soft lilac `#F3E8FF`
  - Warm blush `#FDE9EE`
  - Dawn orange `#FFF0E5`
- Each orb slowly drifts on its own infinite loop (organic, non-repeating feel via different durations + easing)
- Sits behind all content; subtle grain overlay for premium texture

**Glassmorphism system**
- Containers: semi-transparent white (~55–65% opacity)
- `backdrop-filter: blur(14px)` with saturate boost
- 1px semi-transparent white inner border (top-edge light)
- Layered soft shadows (close + far) for floating depth

**Typography**
- Primary: SF Pro Display (Apple system stack) for headings — falls back gracefully
- Body: Inter (variable weight)
- Text color: deep slate `#1A1D27` (never pure black)
- Generous letter-spacing tightening on large display text

---

### Page Sections (top to bottom)

1. **Sticky glass navbar** — Hirely AI wordmark, nav links (Features, How it Works, Roadmap, Pricing), "Get Started" CTA pill. Becomes more opaque on scroll.

2. **Hero**
   - Eyebrow chip: "AI-Powered Career Acceleration"
   - Massive headline: *"Reverse-engineer the hiring process."*
   - Subhead explaining Hirely turns standard job seekers into top-tier candidates
   - Dual CTAs: "Start Free Analysis" (primary) + "Watch Demo" (ghost)
   - Floating glass "preview card" mockup showing a Market Readiness Score gauge
   - Trust row: "Trained on 1M+ job descriptions" / logos placeholder

3. **Stats strip** — 3–4 glass tiles with animated count-up on scroll (e.g., "94% interview rate", "3.2× more callbacks", "50K+ resumes optimized").

4. **Core Features (3 marquee sections, alternating layout)**
   - **ATS Simulator & Resume Architect** — visual of a Market Readiness Score dial + "Impact Rewrite" before/after card
   - **Contextual Pitch & Outreach Engine** — stacked glass cards: Cover Letter / LinkedIn DM / Follow-Up Email
   - **Immersive Behavioral Voice Coach** — waveform visual + STAR breakdown + filler-word counter
   - Each enters with parallax + fade-up as the user scrolls

5. **The Sticky Bonus — Skill Gap Roadmap** — full-width feature block showing a month-by-month timeline visual ("Where you are → Where you'll be in 3 years"). Highlighted as the retention moat.

6. **How It Works** — 4-step horizontal flow (Upload → Analyze → Optimize → Land the role) with numbered glass nodes connected by a soft animated gradient line.

7. **Testimonials** — 3 glass cards, gentle horizontal drift on scroll.

8. **Final CTA** — oversized glass panel: *"Your next role is closer than you think."* + email capture + primary CTA.

9. **Footer** — minimal glass strip: logo, columns (Product, Company, Legal), socials, copyright.

---

### Scroll Animations (premium, restrained)

- Hero text: staggered fade + slight upward translate on load
- Section reveals: IntersectionObserver triggers fade-up + soft scale (0.98 → 1)
- Feature mockups: subtle parallax (translateY based on scroll position)
- Stat counters: animate from 0 to target when in view
- Background orbs: continuous independent motion, unaffected by scroll
- Gradient connector line in "How It Works": draws in as section enters viewport
- Navbar: shadow + opacity intensify after 40px scroll
- All easing: custom cubic-bezier for that iOS-like glide; respects `prefers-reduced-motion`

---

### Technical Notes

- New design tokens added to `index.css` (HSL): pearl, ethereal-blue, soft-lilac, warm-blush, dawn-orange, slate-ink
- Tailwind config extended with: glass utilities, custom shadows, new keyframes (`orb-drift-1..4`, `fade-up`, `draw-line`, `count-up` helpers), and font families
- Fonts loaded via system stack first (`-apple-system, BlinkMacSystemFont, "SF Pro Display"`) with Inter from Google Fonts as fallback for non-Apple devices
- New components in `src/components/landing/`: `MeshGradient.tsx`, `Navbar.tsx`, `Hero.tsx`, `Stats.tsx`, `FeatureBlock.tsx`, `RoadmapSection.tsx`, `HowItWorks.tsx`, `Testimonials.tsx`, `FinalCTA.tsx`, `Footer.tsx`, `GlassCard.tsx`
- Reusable hook: `useInView.ts` for scroll reveals (no heavy library needed)
- `src/pages/Index.tsx` rewritten to compose the landing page
- No backend, no routes added — pure landing page
