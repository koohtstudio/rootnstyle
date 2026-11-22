# Architecture

One idea: **screens talk to hooks, hooks talk to a repo, the repo talks to a backend.** Swap the backend and nothing above it changes.

```
components and pages  ->  lib/hooks  ->  getRepo()  ->  mock adapter (today)
                                                     ->  Neon adapter (later)
```

## Layers

| Layer | Where | Rule |
| --- | --- | --- |
| Domain | `lib/domain` | Zod schemas, types, time, phone and slot maths. Pure functions. No storage, no network. |
| Repo interfaces | `lib/repo/types.ts` | `ServicesRepo`, `BookingsRepo`, `ClientsRepo`, `GalleryRepo`, `SettingsRepo`, plus the ports `AuthPort`, `NotifyPort`, `StoragePort`. |
| Adapters | `lib/repo/mock`, `lib/repo/neon` | Same interfaces. The mock is complete. The Neon one is a stub that names the SQL for each method. |
| Contract | `lib/repo/contract/contract.ts` | One test suite every adapter must pass. |
| Hooks | `lib/hooks` | `useQuery` runs a repo call and re-runs it whenever data changes anywhere. |
| UI | `components`, `app` | Never touch `localStorage`, `fetch` or the database. ESLint enforces it. |

`getRepo()` picks the adapter from `NEXT_PUBLIC_APP_MODE` (`mock` by default, `live`). In live mode with missing keys, `instrumentation.ts` stops the server at start.

## The mock store

- One JSON document in `localStorage` under `rns-mock-v1`, checked with Zod on load. Corrupt, old or wrong shape: reseed, never crash.
- Every write re-reads the stored document first, applies the change, writes it back and posts on `BroadcastChannel("rns-mock")`. Two tabs never overwrite each other with stale data. The `storage` event is a fallback.
- The seed (`lib/mock/seed.ts`) is built relative to today so there are always upcoming days, pre-booked times and a few new requests.
- Fake latency of 150 to 400 ms on repo calls. `NEXT_PUBLIC_MOCK_LATENCY=off` turns it off.
- Outbound texts and emails are written to the Sent log. Nothing is sent.

## Slots

`lib/domain/slots.ts` is the single source of truth. Only **confirmed** bookings block a slot. A new request does not, so the owner can compare requests. A booking blocks from its start for the length of its service (60 minutes when the service has no length yet). Creating or confirming a booking re-checks for a clash. In Neon the same rule is enforced by an exclusion constraint.

Times are plain salon wall clock strings (`2026-11-24T14:30`). There is no timezone arithmetic in the booking path.

## Pages and rendering

Every page is rendered per request, because `proxy.ts` gives each response a fresh CSP nonce. Public pages render the seed content on the server (services, gallery, hours) so the first paint is real, then follow the store in the browser. The admin renders a skeleton, then the data.

## Routes

Public: `/`, `/services`, `/work`, `/about`, `/book`, `/visit`, `/privacy`. Admin: `/admin/login`, `/admin`, `/admin/requests`, `/admin/calendar`, `/admin/services`, `/admin/gallery`, `/admin/clients`, `/admin/messages`, `/admin/settings`. API: `POST /api/bookings`, `GET /api/health`.

## Why CSS Modules

The look is a custom system driven by about twenty tokens (see `app/globals.css`). CSS custom properties plus CSS Modules keep the tokens in one place, scope styles per component, add no runtime, and need no config. A few shared pieces (`.btn`, `.chip`, `.field`) live in `globals.css`.
