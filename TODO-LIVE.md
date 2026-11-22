# From mock to live

An ordered checklist. Each step is small. Do them in order and keep `main` deployable after each one.

1. **Create the Neon project.** One project, a `main` branch for production and a branch per preview if you like. Pick the Toronto-nearest region.
2. **Enable the Neon Data API** on the branch (gives `auth.user_id()` and the `anonymous` and `authenticated` roles) and **create the `app_service` login role** in the console.
3. **Apply the schema.** Run `neon/migrations/0001_init.sql`, then `neon/seed.sql`. `bash scripts/verify-neon-sql.sh` proves the same files on a throwaway local Postgres first.
4. **Import the real data.** Follow `docs/MIGRATION.md` for the service menu, prices and photos.
5. **Turn on Neon Auth** (managed Better Auth). Create the owner, then insert her row in `profiles` with role `owner`. Add front desk users the same way. See `docs/SECURITY.md`.
6. **Write the Neon adapter** in `lib/repo/neon/index.ts`. Every method already names the SQL to run. Use `@neondatabase/serverless` from route handlers only, as `app_service`.
7. **Run the contract suite against it.** Set `NEON_CONTRACT_URL` to a scratch Neon branch and run `pnpm test`. `tests/repo.neon.contract.test.ts` runs the exact suite the mock adapter passes.
8. **Add the sync.** The mock uses BroadcastChannel. Live mode needs the admin lists to refresh for other devices: poll every few seconds, or use Neon Realtime. The `subscribe()` method on the repo is the only place to change.
9. **Wire the ports.** `NotifyPort`: Twilio for text, Resend for email, and write each send to `sent_messages`. `StoragePort`: Neon Object Storage with the limits in `docs/SECURITY.md`. `AuthPort`: Neon Auth.
10. **Replace the in-memory rate limit** in `lib/rateLimit.ts` with a shared store.
11. **Set env vars on Vercel** (see `.env.example`) and set `NEXT_PUBLIC_APP_MODE=live`. The app refuses to start if a key is missing.
12. **Preview, test with the owner, then launch.** Set `NEXT_PUBLIC_ALLOW_INDEXING=true`, point the domain, and clear every item in `docs/CONTENT_TODO.md`.
