# Use the `hirely · ai` lockup in the dashboard sidebar

## What changes

Replace the current sidebar brand row (a black rounded `H` tile + "Hirely" wordmark) with the existing `LogoLockup` component already used in the landing navbar and footer — so the dashboard matches the marketing site exactly.

### File: `src/components/dashboard/Sidebar.tsx`
- Remove the `H` tile `<div>` and the standalone `Hirely` `<span>` from `SidebarBody`
- Import `LogoLockup` from `@/components/landing/Logo`
- Render `<LogoLockup size="text-[17px]" />` in the brand slot, sized to sit comfortably in the 280px-wide rail
- Keep the same top spacing (`mb-9 px-2`) so nothing else shifts
- Applies to both the desktop `DashboardSidebar` and the `MobileSidebar` drawer (they share `SidebarBody`)

## What stays the same
- No edits to `Logo.tsx` — same lockup, same gradient dot, same `ai` tag
- Sidebar width, padding, nav items, and the sky-blue active dot are untouched
- Favicon / landing pages unchanged

## Files touched
- `src/components/dashboard/Sidebar.tsx`
