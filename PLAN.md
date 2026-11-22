# PLAN

Roots n Style Salon & Spa. A clickable website and admin that runs on a fake backend today and swaps to Neon later by changing one config value and filling in one adapter.

## Decisions that differ from the brief (read these first)

1. **Neon instead of Supabase.** The brief says Supabase. You then asked for Neon, so the stub adapter lives in `lib/repo/neon/`, the written-but-not-applied SQL lives in `neon/`, live auth is Neon Auth (managed Better Auth), live photo storage is Neon Object Storage, and cost estimates use Neon pricing. Everything else in the brief stands.
2. **No pause after PLAN.md.** The brief says stop and wait for "go". You also said not to stop until there is a public Vercel link, so this plan is written first and the build continues straight on. Anything you want changed after reading it is a cheap edit now.
3. **The design file could not be opened.** The artifact link returned "not found" for this account, so the look is built from `CONTENT.md` section 8 (tokens), the photos, and the brief's description of the boards. See Risks.
4. **CSS Modules, not Tailwind.** Reason: the look is a custom system (arched hero, pill buttons, serif display with italic emphasis) driven by about 20 design tokens. CSS custom properties plus CSS Modules keep the tokens in one file, produce small scoped CSS with no runtime, need no config or purge step, and keep the markup readable for the next developer. A few shared primitives (`.btn`, `.chip`, `.field`) live in `globals.css`.

## Stack

Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript strict, CSS Modules, Zod 4, Vitest, Playwright plus axe, pnpm. Fonts through `next/font` (Cormorant Garamond, DM Sans). Light mode only. No UI kit.

## Folder layout

```
app/
  layout.tsx                 fonts, metadata (noindex unless allowed), nonce
  (site)/                    public: /, /services, /work, /about, /book, /visit, /privacy
  (admin)/admin/
    login/                   demo login
    (panel)/                 guarded shell: dashboard, requests, calendar, services,
                             gallery, clients, messages, settings
  api/bookings/route.ts      validate + honeypot + min time + rate limit stub
  api/health/route.ts
  robots.ts
proxy.ts                     nonce CSP and security headers
instrumentation.ts           fails loudly when live mode has missing env
components/
  ui/                        Dialog, Toast, Switch, States (Empty, Loading, Error), Stars, Icon
  site/                      UtilityBar, Nav, Hero, Marquee, ServicesSection, Gallery, Lightbox,
                             About, Reviews, BookingWidget, Visit, JoinTeam, Footer
  admin/                     Shell, StatCard, DayChart, RequestList, RequestDetail, WeekGrid, ...
lib/
  config.ts                  env parsing, mode, live checks
  domain/                    types and Zod, phone, time, slots, clients, content constants
  repo/
    types.ts                 ServicesRepo, BookingsRepo, ClientsRepo, GalleryRepo, SettingsRepo,
                             AuthPort, NotifyPort, StoragePort
    index.ts                 getRepo() picks adapter by NEXT_PUBLIC_APP_MODE
    mock/                    localStorage + BroadcastChannel adapter and mock ports
    neon/                    STUB adapter, same interfaces, NotImplemented with SQL pointers
    contract/                reusable contract suite that every adapter must pass
  hooks/                     useQuery, data hooks, useSession, useReviewMode, useSessionFlag
  mock/seed.ts             all sample data, dates relative to today
  generated/image-meta.ts    blur placeholders and sizes (made by scripts/optimize-images.mjs)
neon/
  migrations/0001_init.sql   schema, views, RLS, constraints. WRITTEN, NOT APPLIED.
  seed.sql
docs/                        ARCHITECTURE, SECURITY, MIGRATION, COSTS, CONTENT_TODO, DEMO-SCRIPT
e2e/                         Playwright specs
tests/                       Vitest specs
```

## Data layer

- Domain types are Zod schemas in `lib/domain/schemas.ts`. Types are inferred from them. Every write goes through a schema and unknown fields are rejected (`.strict()`).
- All times are **salon wall-clock strings** (`2026-11-24T14:30`, America/Toronto). No timezone maths in the booking path, so no DST bugs. "Now" is read in the Toronto zone through `Intl`.
- Slot logic is one pure module (`lib/domain/slots.ts`). Both the mock adapter and the future Neon adapter call it, so the rules cannot drift.
- Availability: only **confirmed** bookings block a slot. New requests do not, so the demo moment "confirm it and watch the slot disappear" works. A slot that is already confirmed cannot be requested, and confirming a clashing request is refused. Capacity is one chair until staff exist in the data.
- Public reads never see PII: the repo exposes `availability()` (slots only), not the bookings list, to the public site.
- Services have `price` and `durationMin` as nullable. The salon has not published prices or times, so the public site shows "Price on request" and hides duration until the owner types a value. Under `?review=1` it shows `From $[price] [price to confirm]` and `[time]`. Slot maths uses 60 minutes when a duration is empty.
- Components never touch `localStorage`, `fetch` or Neon. They call hooks in `lib/hooks`, which call the repo. An ESLint rule enforces it for `app/` (except `app/api`) and `components/`.

### Repo contract

`getRepo()` returns `{ services, bookings, clients, gallery, settings, sent, auth, notify, storage, demo, subscribe }`. `subscribe(cb)` fires on any change, local or from another tab. The contract suite (`lib/repo/contract/contract.ts`) is imported by the mock adapter test and by the Neon adapter test, which stays skipped until the adapter exists.

## Mock store

- One localStorage key, `rns-mock-v1`, holding `{ version, rev, services, categories, bookings, gallery, hours, settings, sent }`. Loaded and checked with Zod. Corrupt, old or wrong version: reseed, never crash.
- Every mutation re-reads storage first (so two tabs never overwrite each other with stale data), applies the change, writes, then posts on `BroadcastChannel("rns-mock")`. The `storage` event is a fallback where BroadcastChannel is missing. Listeners refetch.
- Seed is built relative to today so there are always upcoming open days, pre-booked (confirmed) slots, and a few new requests.
- Latency 150 to 400 ms on repo calls. `NEXT_PUBLIC_MOCK_LATENCY=off` disables it (used by tests).
- Notify port: confirmation and alert messages are written to the **Sent messages** log, never sent.
- Auth port: demo session in `rns-session-v1` (owner or front desk role, 8 hour expiry). No cookies.
- Storage port: a mock upload is resized in the browser to a small JPEG and kept as a data URL inside the mock store, so it survives refresh. It says so on screen. Live mode uses Neon Object Storage with type and size limits and EXIF stripping.
- "Reset demo data" in Settings and in the sidebar: confirm dialog, then reseed and broadcast.

## Routes

Public: `/`, `/services` (`?cat=hair|skin|brows|makeup`), `/work`, `/about`, `/book` (`?service=<id>`), `/visit`, `/privacy`. Home sections carry ids: `#services #work #about #reviews #book #visit #join`.

Admin: `/admin/login`, `/admin`, `/admin/requests` (`?id=`), `/admin/calendar`, `/admin/services`, `/admin/gallery`, `/admin/clients`, `/admin/messages`, `/admin/settings`.

API: `POST /api/bookings` (validates the payload with the same Zod schema, honeypot, minimum time to submit, in-memory rate limit stub), `GET /api/health`.

Role gating: unauthenticated users go to the login page. The **front desk** demo role cannot open Services and prices or Settings. The **owner** can open everything.

## Security (applies in mock mode too)

`proxy.ts` sets a per-request nonce CSP (`default-src 'self'`, images and fonts from self, `blob:` and `data:` for images only for mock uploads and blur placeholders, `frame-ancestors 'none'`), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `X-Robots-Tag` while indexing is off. Pages are dynamic so the nonce can be applied. No analytics, no third-party scripts, no external image hosts. See `docs/SECURITY.md`.

## What is real versus faked

| Real | Faked |
| --- | --- |
| UI, routing, forms, Zod validation, slot logic, security headers, CSP, tests, Neon schema file | Database (browser localStorage), cross-tab sync (BroadcastChannel, same browser only), login, texts and emails (Sent log), photo upload, rate limiting (in memory), Google rating (copied from CONTENT.md) |

Important consequence: a booking made on the owner's phone does **not** appear in the admin on her laptop, because the data lives in each browser. For the walkthrough, do both steps in the same browser (two tabs). The live Neon adapter removes this limit. This is stated in the README, in DEMO-SCRIPT, and in the admin banner.

## Build order

1. Scaffold, tokens, fonts, images, config, proxy.
2. Domain, slots, seed, mock store, contract tests.
3. Public site and booking widget.
4. Admin.
5. Neon SQL, adapter stub, docs.
6. Playwright, axe, link crawler, Lighthouse.
7. GitHub push, Vercel deploy, screenshots.

## Risks

- **Design file unreadable.** The look is rebuilt from tokens and brief, so it may differ in detail from the boards. Fix: send the file again or export the boards as PNG and I will adjust spacing and layout.
- **Nonce CSP forces dynamic rendering.** Costs a little TTFB versus static pages. Public pages render seed data on the server so LCP stays fast.
- **localStorage quota.** Mock photo uploads are resized and capped; a quota error shows a friendly message.
- **Cross-device demo not possible in mock mode** (see above).
- **Placeholder facts.** Prices, durations, team, reviews, unit number and hours stay as neutral wording or `[confirm]` markers. Nothing is invented.
- **Lighthouse on a nonce-CSP dynamic app** may lose a point or two on TTFB. Measured and reported after deploy.
