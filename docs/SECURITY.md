# Security and privacy

## In place today (mock mode too)

- **Headers** from `proxy.ts`: nonce based CSP (`default-src 'self'`, scripts need the nonce, images and fonts from self, `frame-ancestors 'none'`, `object-src 'none'`), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (no camera, microphone, location, payment), `X-Frame-Options`, HSTS in production.
  - `style-src` keeps `'unsafe-inline'` because server rendered pages use style attributes (chart bars, image placeholders). Scripts do not.
  - `img-src` allows `blob:` and `data:` for the mock photo upload and image placeholders only.
- **Validation**: Zod on every write. Schemas are strict, so unknown fields are rejected. Same schema in the browser form, the repo and `POST /api/bookings`.
- **Bot guards**: a hidden honeypot field (filled means silent success and nothing stored), a minimum time to submit, and an in-memory rate limit stub on `/api/bookings`.
- **No tracking**: no analytics, no pixels, no third-party scripts, no external image hosts, no cookies. The demo session lives in `localStorage` and expires after 8 hours.
- **No personal data in logs**: the API route logs nothing. The audit trigger in the SQL strips phone, email and notes.
- **Indexing off**: `noindex, nofollow` in the page and the `X-Robots-Tag` header, and `robots.txt` disallows everything until `NEXT_PUBLIC_ALLOW_INDEXING=true`.
- **CASL**: booking confirmations are transactional. Offers need an unchecked opt in, stored as `marketingOptIn`, with a plain way to stop.
- **Public reads see no personal data**: availability is returned as slots only. In Neon the public site reads views that expose visible rows only.

## What live auth must add

The demo login has no password and is for looking around only. Before real data:

1. **Neon Auth** (managed Better Auth) for the owner and front desk. Email and password with a strong policy, or magic link. Turn on MFA for the owner.
2. **Roles in `public.profiles`** (`owner`, `frontdesk`). The RLS policies in `neon/migrations/0001_init.sql` read the role from there using `auth.user_id()`. Front desk cannot edit services, prices, hours or settings, and cannot read the audit log.
3. **Server-only writes for bookings.** Browsers never insert bookings. `POST /api/bookings` validates, checks the slot, and inserts as the `app_service` role. There is deliberately no insert policy for `anonymous` or `authenticated`.
4. **Audit log.** Triggers already record inserts, updates and deletes of bookings, services, gallery, hours and settings. Staff cannot edit or delete the log. Set `app.actor` per request so entries name who did it.
5. **Session timeout.** Short idle timeout for admin (for example 30 minutes) and a full re-sign in after 12 hours.
6. **Shared rate limit.** Replace `lib/rateLimit.ts` with a shared store. Add the same limit to the login route.
7. **Secrets.** Only on Vercel and in Neon. Never in the repo. `.env.example` lists every name.
8. **Backups.** Neon point in time restore is on by default. Test a restore once before launch.

## Uploaded photos in live mode

- Accept JPEG, PNG and WebP only. Check the real file type on the server, not just the extension.
- Limit size (8 MB in, resized to at most 2000 px on the long side).
- **Strip EXIF**, including GPS location, by re-encoding. The mock does this already by drawing to a canvas.
- Store in Neon Object Storage with a random key. Serve through the app, never hotlink.
- Record that the client agreed to share the photo (`gallery_photos.consent_ok`). The public view only shows photos where it is true.

## Reporting

Send security reports to the salon email on the Visit page. Do not post details publicly.
