# MRID - My Rider Identity Dashboard

A mobile-first, iOS-minimalist web dashboard that shows an online ojek (ride-hailing) rider's identity to passengers. Built with Next.js (App Router), Tailwind CSS, and Supabase.

## What it is

MRID is a single-page dashboard a rider pulls up so passengers can see who's picking them up - photo, name, status, motor specs, basecamp, hobbies, and a quick passenger feedback form.

**Zero hallucination:** every field comes from `src/config/rider.ts` or the Supabase `drivers` table. Empty fields render as `-`; nothing is ever fabricated.

## Design

| Token | Value | Reason |
|-------|-------|--------|
| Canvas | `slate-100` (light) / `slate-900/80` (dark) | Neutral soft slate, no pure-white glare |
| Primary accent | Black (`#000000`) | High contrast on slate-100, vibrant without color noise |
| Accent hover | `#0a0a0a` | Slight lift on interaction |
| Dark-mode button bg | `#262626` | Visible on dark cards, not invisible |
| Text | `slate-900` / `slate-100` | High contrast, readable |
| Radius | `rounded-2xl` / `rounded-3xl` | iOS widget feel |
| Accent contrast | White on black = 21:1 | WCAG AAA, exceeds 4.5:1 minimum |

Copywriting is casual Gen-Z Indonesian, polite to passengers.

## Core sections

1. **Profile card** - avatar, name, status, plate number
2. **Garage** - motor type, plate, CVT / engine / undercarriage setup
3. **Basecamp & side quest** - favorite hangout, notes, current side quest
4. **Passenger feedback** - quick form submitted via Supabase
5. **Guest gallery** - passenger photos from admin
6. **Today's motivation** - realtime marquee of passenger quotes

## Tech stack

- **Framework:** Next.js (App Router) + Tailwind CSS
- **Backend:** Supabase (database + realtime)
- **Language:** TypeScript

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Run dev server
npm run dev

# 4. Open http://localhost:3000
```

Admin setup lives at `/admin` and writes to the `drivers` table.

## Data rules

- Rider data comes only from `src/config/rider.ts` or Supabase `drivers` - never hardcoded or invented
- Empty fields render `-` as fallback
- Use `src/utils/supabase/client.ts` (Client Component) or `src/utils/supabase/server.ts` (Server Component) - do not change Supabase import structure

## Git workflow

Feature branches only. No direct commits to `main`.

```bash
git checkout -b feature/nama-fitur
# do the work
git push origin feature/nama-fitur
# request merge approval to main
```

Merge to `main` requires explicit approval (`--no-ff` to preserve branch history).

---

MRID - built for riders, readable for passengers.