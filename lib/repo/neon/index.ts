import { RepoError } from "../errors";
import type { Repo } from "../types";

/**
 * STUB. The Neon adapter, same interfaces as the mock adapter.
 *
 * Every method throws NotImplemented and points at the SQL it will run. To finish live mode:
 *   1. Apply neon/migrations/0001_init.sql to a Neon branch.
 *   2. Fill in these methods (server side only, through route handlers, never from the browser).
 *   3. Run the shared contract suite against it: tests/repo.neon.contract.test.ts.
 *   4. Set NEXT_PUBLIC_APP_MODE=live. See TODO-LIVE.md.
 */
const todo = (what: string, sql: string): never => {
  throw new RepoError("NOT_IMPLEMENTED", `Neon adapter: ${what} is not written yet. TODO: ${sql}`);
};

export function createNeonRepo(): Repo {
  return {
    mode: "live",
    services: {
      listCategories: () => todo("services.listCategories", "SELECT * FROM public.service_categories ORDER BY sort"),
      list: () => todo("services.list", "SELECT * FROM public.public_services (visible only) or public.services for staff"),
      get: () => todo("services.get", "SELECT * FROM public.services WHERE id = $1"),
      create: () => todo("services.create", "INSERT INTO public.services ... (owner role)"),
      update: () => todo("services.update", "UPDATE public.services SET ... WHERE id = $1 (owner role)"),
      move: () => todo("services.move", "swap sort values in one transaction"),
    },
    bookings: {
      list: () => todo("bookings.list", "SELECT * FROM public.bookings (staff role)"),
      get: () => todo("bookings.get", "SELECT * FROM public.bookings WHERE id = $1"),
      create: () => todo("bookings.create", "POST /api/bookings: validate, then INSERT INTO public.bookings with the app role; the unique index bookings_no_double_confirm rejects clashes"),
      confirm: () => todo("bookings.confirm", "UPDATE public.bookings SET status = 'confirmed' (clash index guards it); then NotifyPort"),
      decline: () => todo("bookings.decline", "UPDATE public.bookings SET status = 'declined'"),
      complete: () => todo("bookings.complete", "UPDATE public.bookings SET status = 'done'"),
      cancel: () => todo("bookings.cancel", "UPDATE public.bookings SET status = 'cancelled'"),
      move: () => todo("bookings.move", "UPDATE public.bookings SET start_at = $2"),
      suggest: () => todo("bookings.suggest", "UPDATE public.bookings SET suggested_start = $2; then NotifyPort"),
      openDays: () => todo("bookings.openDays", "SELECT * FROM public.open_slots(...) then lib/domain/slots.ts"),
      slots: () => todo("bookings.slots", "SELECT start_at, duration_min FROM public.busy_intervals WHERE day = $1 (no personal data)"),
      nextOpenSlot: () => todo("bookings.nextOpenSlot", "same as slots across the booking window"),
    },
    clients: {
      list: () => todo("clients.list", "SELECT * FROM public.clients_with_visits (staff role)"),
    },
    gallery: {
      list: () => todo("gallery.list", "SELECT * FROM public.public_gallery_photos, or the table for staff"),
      add: () => todo("gallery.add", "upload through StoragePort, then INSERT INTO public.gallery_photos"),
      update: () => todo("gallery.update", "UPDATE public.gallery_photos SET ..."),
      move: () => todo("gallery.move", "swap sort values in one transaction"),
    },
    settings: {
      get: () => todo("settings.get", "SELECT * FROM public.settings WHERE id = 1"),
      update: () => todo("settings.update", "UPDATE public.settings SET ... WHERE id = 1 (owner role)"),
      getHours: () => todo("settings.getHours", "SELECT * FROM public.hours ORDER BY day"),
      setHours: () => todo("settings.setHours", "UPSERT INTO public.hours in one transaction (owner role)"),
    },
    sent: {
      list: () => todo("sent.list", "SELECT * FROM public.sent_messages ORDER BY created_at DESC (staff role)"),
    },
    auth: {
      login: () => todo("auth.login", "Neon Auth (managed Better Auth) sign in, then read role from public.profiles"),
      logout: () => todo("auth.logout", "Neon Auth sign out"),
      getSession: () => null,
      subscribe: () => () => {},
    },
    notify: {
      send: () => todo("notify.send", "Twilio for sms, Resend for email, then INSERT INTO public.sent_messages"),
    },
    storage: {
      note: "Photos are stored in Neon object storage.",
      upload: () => todo("storage.upload", "presigned PUT to Neon object storage, type and size limits, strip EXIF"),
    },
    demo: {
      reset: () => todo("demo.reset", "not offered in live mode"),
    },
    subscribe: () => () => {},
  };
}
