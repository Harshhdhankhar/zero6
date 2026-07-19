# ZERO6 Landing Redesign TODO

- [ ] Replace `src/app/page.tsx` landing component markup with a premium modern sports-community layout.
- [ ] Ensure only public landing page (`/`) changes; do not modify auth/dashboard routes, middleware, Supabase, APIs.
- [ ] Remove/stop using old landing active sections and styles from `src/app/page.tsx` (old `z6-*` markup) and avoid reusing any old landing imagery.
- [ ] Add new local images usage from `public/landing/` via `next/image` (fallback to CSS composition if images are missing).
- [ ] Implement required sections: sticky navbar, full-screen hero, headline, CTA buttons, marquee, city discovery, running map preview, how it works, discord-inspired preview, real upcoming events, runner goals/achievements, organizer features, final signup CTA, premium footer.
- [ ] Use real public data where available (reuse existing `/api/clubs` and `/api/events` feed). Show honest empty states.
- [ ] Ensure all buttons use existing working routes (`/signup`, `/explore`, `/maps`, `/events`, etc.).
- [ ] Update landing-specific styling in `src/app/globals.css` (scoped to landing wrapper) to remove old look.
- [ ] Run: `npm run dev`, open `/` at 1440px + 390px (manual check).
- [ ] Run `npm run lint`.
- [ ] Run `npm run build` and fix any TS/ESLint/build errors.
- [ ] Report exact files changed.

