# Roots n Style Salon & Spa

A clickable website and admin for a Brampton salon and spa. It runs on a **fake backend** today (the browser's own storage) and is built so a real **Neon** Postgres backend replaces it later by changing one setting and finishing one adapter.

- **Public site:** home, services, our work, about, book online, visit.
- **Booking flow:** choose a service, a day and a time, add a name and phone, get a clear confirmation.
- **Admin:** dashboard, booking requests, calendar, services and prices, gallery, clients, sent messages, settings.

Live preview: see the Vercel link the team shared. Plan and decisions: [PLAN.md](PLAN.md).

## Run it

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. The admin is at `/admin` (demo login, no password).

| Command | What it does |
| --- | --- |
| `pnpm dev` | Local development |
| `pnpm build` and `pnpm start` | Production build and server |
| `pnpm typecheck` | TypeScript, strict |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest: slot logic, schemas, repo contract |
| `pnpm test:e2e` | Playwright: flows, link crawler, axe on every page, desktop and phone |
| `pnpm images` | Regenerate image blur placeholders |
| `bash scripts/verify-neon-sql.sh` | Check the Neon SQL on a throwaway local Postgres |

Playwright installs its browser with `pnpm exec playwright install chromium`.

## Environment variables

See [.env.example](.env.example). The important ones:

| Name | Default | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_MODE` | `mock` | `mock` fake backend, `live` Neon. In `live` the server refuses to start if keys are missing. |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `false` | Keep false while sample data shows. True at launch. |
| `NEXT_PUBLIC_MOCK_LATENCY` | `on` | Fake 150 to 400 ms delay. `off` for tests. |
| `NEXT_PUBLIC_MIN_SUBMIT_MS` | `2000` | Minimum time on the booking form, a bot guard. |

## Mock versus live

**Mock (today).** Data lives in the browser under `rns-mock-v1`. Refreshing keeps it. Two tabs in the same browser stay in sync within a second. Texts and emails are written to **Sent messages** and never sent. A booking made on one device does **not** appear on another device.

**Live (later).** Neon Postgres, Neon Auth, Neon Object Storage, Twilio and Resend. The schema and row level security are written in `neon/migrations` but **not applied**. Follow [TODO-LIVE.md](TODO-LIVE.md).

## Reset demo data

Admin sidebar or **Settings, Demo data, Reset demo data**. Confirm, and everything goes back to the starting sample. If the stored data is ever corrupt the site reseeds by itself.

## Where content lives

| What | Where |
| --- | --- |
| Facts, copy, tokens, confirm list | `CONTENT.md` |
| Constants used by the site | `lib/domain/content.ts` |
| Sample services, photos, bookings | `lib/mock/seed.ts` |
| Photos | `public/images` |
| Booking message wording | `lib/repo/mock/messages.ts` |
| Design tokens | `app/globals.css` |
| Things still to confirm | `docs/CONTENT_TODO.md` (add `?review=1` to see them on the page) |

## What is faked

The database, login, texts and emails, photo upload storage, the rate limit, and cross-device sync. Everything else (screens, validation, slot rules, security headers, tests) is real. Details in [PLAN.md](PLAN.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Deploy to Vercel

1. Push to GitHub (`koohtstudio/rootnstyle`).
2. In Vercel, import the repo. Framework: Next.js. No build settings to change.
3. Leave `NEXT_PUBLIC_APP_MODE` unset (mock). Production deploys from `main`. Every branch gets a preview URL.
4. Optional: add a custom domain, then set `NEXT_PUBLIC_ALLOW_INDEXING=true` only when real content is in.

## Docs

[Architecture](docs/ARCHITECTURE.md), [Security](docs/SECURITY.md), [Migration](docs/MIGRATION.md), [Costs](docs/COSTS.md), [Content to confirm](docs/CONTENT_TODO.md), [Demo script](docs/DEMO-SCRIPT.md), [Mock to live](TODO-LIVE.md).
