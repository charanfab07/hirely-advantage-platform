## Logo Plan — Hirely AI Geometric Monogram

### Concept
A custom geometric **'H'** mark built as an inline SVG component. Two vertical bars connected by an angled crossbar that doubles as an upward stroke — quietly suggesting career ascent without being literal. Filled with a subtle aurora gradient (lilac → ethereal blue → blush) that nods to the parallax background, on a dark slate-ink rounded-square tile so it reads cleanly at any size.

### Visual spec
- **Container**: 32×32 rounded square (`rounded-xl`), bg `slate-ink` (#1A1D27) — matches current navbar tile size
- **Mark**: SVG 'H' inside, ~60% of tile, stroke-based for crispness at small sizes
- **Left bar**: full height vertical
- **Right bar**: full height vertical
- **Crossbar**: not horizontal — angled diagonally upward left-to-right (~15°), suggesting trajectory
- **Accent**: a small dot/spark at the top-right of the right bar (subtle AI cue)
- **Color**: white strokes with a soft aurora gradient overlay (lilac → blue) applied via SVG `linearGradient`
- **Hover**: gentle 1.05 scale + gradient shift (reuse existing `group-hover:scale-105`)

### Files to change
1. **Create `src/components/landing/Logo.tsx`** — reusable component exporting `<LogoMark />` (the tile+H, sized via prop) and `<LogoLockup />` (mark + "Hirely" wordmark + "AI" tag) so Navbar and Footer share one source of truth.
2. **`src/components/landing/Navbar.tsx`** — replace the `<Sparkles>`-in-tile block with `<LogoMark size={32} />`; keep wordmark + AI badge as-is (or swap entire anchor for `<LogoLockup />`).
3. **`src/components/landing/Footer.tsx`** — same swap in the footer brand block.
4. Remove now-unused `Sparkles` imports from both files.

### Out of scope (this plan)
- Favicon, OG image, exportable PNG/SVG to `/mnt/documents/` — not requested. Easy follow-ups later.

### Why this works
- One SVG component → consistent everywhere, easy to iterate
- Geometric 'H' scales perfectly to favicon size later
- Aurora gradient ties the brand mark to the signature parallax background
- Stays within the existing minimal, premium design language (no new fonts, no new color tokens)
