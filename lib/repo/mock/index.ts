import { deriveClients } from "@/lib/domain/clients";
import {
  bookingRequestSchema,
  galleryInputSchema,
  galleryPatchSchema,
  hoursSchema,
  MIN_SUBMIT_MS,
  serviceInputSchema,
  servicePatchSchema,
  settingsPatchSchema,
  type Booking,
  type MockState,
  type Role,
  type Session,
  type Service,
} from "@/lib/domain/schemas";
import {
  durationOf,
  hasClash,
  isSlotFree,
  listOpenDays,
  generateSlots,
  nextOpenSlot,
  type Occupied,
  type SlotContext,
} from "@/lib/domain/slots";
import { salonNow, splitStart, type DateKey, type SalonNow, type StartStr } from "@/lib/domain/time";
import { RepoError } from "../errors";
import type { Direction, Repo, Unsubscribe } from "../types";
import { messages } from "./messages";
import { MockStore, SESSION_KEY, type ChannelLike, type KV } from "./store";
import type { z } from "zod";

export interface MockOptions {
  storage: KV;
  channel?: ChannelLike | null;
  now?: () => SalonNow;
  /** [min, max] milliseconds of fake latency, or null for none. */
  latency?: [number, number] | null;
  /** Browser only: runs the public route handler's checks before writing. */
  precheck?: (payload: unknown) => Promise<void>;
  /** Turns a File into a stored source. Browser only. */
  uploader?: (file: File) => Promise<string>;
  /** Session length in ms. */
  sessionMs?: number;
}

const rid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function issuesOf(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const key = i.path.length ? String(i.path[0]) : "form";
    if (!out[key]) out[key] = i.message;
  }
  return out;
}

function parse<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const r = schema.safeParse(data);
  if (!r.success) {
    const issues = issuesOf(r.error);
    throw new RepoError("VALIDATION", Object.values(issues)[0] ?? "Please check the form.", issues);
  }
  return r.data;
}

export type MockRepo = Repo & { __store: MockStore; __emitSession: () => void };

export function createMockRepo(opts: MockOptions): MockRepo {
  const now = opts.now ?? (() => salonNow());
  const store = new MockStore({ storage: opts.storage, channel: opts.channel ?? null, now });
  const sessionMs = opts.sessionMs ?? 8 * 60 * 60 * 1000;

  const wait = async () => {
    if (!opts.latency) return;
    const [min, max] = opts.latency;
    const ms = min + Math.random() * (max - min);
    await new Promise((r) => setTimeout(r, ms));
  };

  // ----- session -----
  const sessionListeners = new Set<() => void>();
  let sessionRaw: string | null | undefined;
  let sessionCache: Session | null = null;

  function getSession(): Session | null {
    let raw: string | null = null;
    try {
      raw = opts.storage.getItem(SESSION_KEY);
    } catch {
      raw = null;
    }
    if (raw !== sessionRaw) {
      sessionRaw = raw;
      try {
        const s = raw ? (JSON.parse(raw) as Session) : null;
        sessionCache = s && typeof s.expiresAt === "number" && s.expiresAt > Date.now() ? s : null;
      } catch {
        sessionCache = null;
      }
    } else if (sessionCache && sessionCache.expiresAt <= Date.now()) {
      sessionCache = null;
    }
    return sessionCache;
  }

  const emitSession = () => sessionListeners.forEach((cb) => cb());

  function requireSession(role?: Role): Session {
    const s = getSession();
    if (!s) throw new RepoError("FORBIDDEN", "Please sign in to do that.");
    if (role === "owner" && s.role !== "owner") throw new RepoError("FORBIDDEN", "Only the owner can do that.");
    return s;
  }

  // ----- helpers -----
  const state = () => store.read();
  const serviceOf = (s: MockState, id: string): Service | undefined => s.services.find((x) => x.id === id);

  function ctxOf(s: MockState, excludeId?: string): SlotContext {
    const occupied: Occupied[] = s.bookings
      .filter((b) => b.status === "confirmed" && b.id !== excludeId)
      .map((b) => ({ id: b.id, start: b.start, durationMin: durationOf(serviceOf(s, b.serviceId)) }));
    return { hours: s.hours, occupied, now: now() };
  }

  // The mock "sends" by writing to the Sent log. No latency here: outbound messages are fire and forget.
  const pushMessages = (list: Parameters<Repo["notify"]["send"]>[0][]) =>
    store.mutate((s) => {
      const made = list.map((input) => ({ ...input, id: rid("msg"), createdAt: new Date().toISOString() }));
      for (const m of made) s.sent.unshift(m);
      if (s.sent.length > 200) s.sent.length = 200;
      return made;
    });

  const notifyAll = async (list: Parameters<Repo["notify"]["send"]>[0][]) => {
    if (list.length > 0) pushMessages(list);
  };

  const msgCtx = (b: Booking) => {
    const s = state();
    return { booking: b, service: serviceOf(s, b.serviceId), settings: s.settings };
  };

  function mustFind(s: MockState, id: string): Booking {
    const b = s.bookings.find((x) => x.id === id);
    if (!b) throw new RepoError("NOT_FOUND", "We could not find that booking.");
    return b;
  }

  function assertNoClash(s: MockState, b: Booking, start: StartStr) {
    const dur = durationOf(serviceOf(s, b.serviceId));
    const occupied = ctxOf(s, b.id).occupied;
    if (hasClash(start, dur, occupied)) {
      throw new RepoError("SLOT_TAKEN", "That time is already confirmed for someone else.");
    }
  }

  // ----- ports -----
  const notify: Repo["notify"] = {
    async send(input) {
      const [msg] = pushMessages([input]);
      return msg!;
    },
  };

  const auth: Repo["auth"] = {
    async login(role) {
      await wait();
      const session: Session = {
        role,
        name: role === "owner" ? "Owner (demo)" : "Front desk (demo)",
        expiresAt: Date.now() + sessionMs,
      };
      opts.storage.setItem(SESSION_KEY, JSON.stringify(session));
      emitSession();
      return session;
    },
    async logout() {
      opts.storage.removeItem(SESSION_KEY);
      emitSession();
    },
    getSession,
    subscribe(cb) {
      sessionListeners.add(cb);
      return () => sessionListeners.delete(cb);
    },
  };

  const storage: Repo["storage"] = {
    note: "Demo only: photos are shrunk and kept in this browser, nothing is uploaded. Live mode stores them in Neon object storage.",
    async upload(file) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new RepoError("STORAGE", "Use a JPG, PNG or WebP photo.");
      if (file.size > 8 * 1024 * 1024) throw new RepoError("STORAGE", "That photo is over 8 MB. Choose a smaller one.");
      if (!opts.uploader) throw new RepoError("STORAGE", "Uploads need a browser.");
      await wait();
      return { src: await opts.uploader(file) };
    },
  };

  // ----- repos -----
  const services: Repo["services"] = {
    async listCategories() {
      await wait();
      return [...state().categories].sort((a, b) => a.sort - b.sort);
    },
    async list(o) {
      await wait();
      if (o?.includeHidden) requireSession();
      return state()
        .services.filter((s) => o?.includeHidden || s.visible)
        .sort((a, b) => a.sort - b.sort);
    },
    async get(id) {
      await wait();
      const s = serviceOf(state(), id);
      if (!s) return null;
      if (!s.visible && !getSession()) return null;
      return s;
    },
    async create(input) {
      requireSession("owner");
      const data = parse(serviceInputSchema, input);
      await wait();
      return store.mutate((s) => {
        const max = Math.max(0, ...s.services.filter((x) => x.category === data.category).map((x) => x.sort));
        const svc: Service = { ...data, id: rid("svc"), sort: max + 10 };
        s.services.push(svc);
        return svc;
      });
    },
    async update(id, patch) {
      requireSession("owner");
      const data = parse(servicePatchSchema, patch);
      await wait();
      return store.mutate((s) => {
        const svc = serviceOf(s, id);
        if (!svc) throw new RepoError("NOT_FOUND", "We could not find that service.");
        Object.assign(svc, data);
        return svc;
      });
    },
    async move(id, direction) {
      requireSession("owner");
      await wait();
      store.mutate((s) => swapNeighbour(s.services, id, direction, (x) => x.category));
    },
  };

  const bookings: Repo["bookings"] = {
    async list(filter) {
      requireSession();
      await wait();
      const statuses = filter?.status ? (Array.isArray(filter.status) ? filter.status : [filter.status]) : null;
      return state()
        .bookings.filter((b) => {
          if (statuses && !statuses.includes(b.status)) return false;
          const d = splitStart(b.start).dateKey;
          if (filter?.fromDate && d < filter.fromDate) return false;
          if (filter?.toDate && d > filter.toDate) return false;
          return true;
        })
        .sort((a, b) => (a.start < b.start ? -1 : 1));
    },
    async get(id) {
      requireSession();
      await wait();
      return state().bookings.find((b) => b.id === id) ?? null;
    },
    async create(input) {
      const data = parse(bookingRequestSchema, input);
      if (data.website && data.website.trim() !== "") {
        // Honeypot tripped. Look successful, store nothing.
        return {
          id: "bk_ignored", serviceId: data.serviceId, start: data.start, name: data.name, phone: data.phone,
          marketingOptIn: false, status: "new", createdAt: new Date().toISOString(),
        };
      }
      if (data.elapsedMs < MIN_SUBMIT_MS) throw new RepoError("TOO_FAST", "That was quick. Please check your details and send again.");
      if (opts.precheck) await opts.precheck(input);
      await wait();
      const s0 = state();
      if (!s0.settings.acceptOnline) throw new RepoError("CLOSED", "Online requests are paused right now. Please call us to book.");
      const svc = serviceOf(s0, data.serviceId);
      if (!svc || !svc.visible) throw new RepoError("NOT_FOUND", "That service is not available to book online.", { serviceId: "Choose another service" });
      if (!isSlotFree(data.start, durationOf(svc), ctxOf(s0))) {
        throw new RepoError("SLOT_TAKEN", "Sorry, that time was just taken. Please pick another.", { start: "Pick another time" });
      }
      const booking = store.mutate((s) => {
        const status: Booking["status"] = s.settings.autoConfirm ? "confirmed" : "new";
        const b: Booking = {
          id: rid("bk"),
          serviceId: data.serviceId,
          start: data.start,
          name: data.name,
          phone: data.phone,
          marketingOptIn: data.marketingOptIn,
          status,
          createdAt: new Date().toISOString(),
        };
        if (data.email) b.email = data.email;
        if (data.note) b.note = data.note;
        s.bookings.push(b);
        return b;
      });
      const c = msgCtx(booking);
      await notifyAll(booking.status === "confirmed" ? messages.confirmation(c) : messages.requestReceived(c));
      if (c.settings.notifyOwner) await notifyAll([messages.ownerAlert(c)]);
      return booking;
    },
    async confirm(id) {
      requireSession();
      await wait();
      const b = store.mutate((s) => {
        const x = mustFind(s, id);
        if (x.status === "confirmed") return x;
        assertNoClash(s, x, x.start);
        x.status = "confirmed";
        delete x.suggestedStart;
        return x;
      });
      await notifyAll(messages.confirmation(msgCtx(b)));
      return b;
    },
    async decline(id) {
      requireSession();
      await wait();
      const b = store.mutate((s) => {
        const x = mustFind(s, id);
        x.status = "declined";
        return x;
      });
      await notifyAll(messages.decline(msgCtx(b)));
      return b;
    },
    async complete(id) {
      requireSession();
      await wait();
      return store.mutate((s) => {
        const x = mustFind(s, id);
        x.status = "done";
        return x;
      });
    },
    async cancel(id) {
      requireSession();
      await wait();
      const b = store.mutate((s) => {
        const x = mustFind(s, id);
        x.status = "cancelled";
        return x;
      });
      await notifyAll(messages.cancellation(msgCtx(b)));
      return b;
    },
    async move(id, start) {
      requireSession();
      parse(bookingRequestSchema.pick({ start: true }), { start });
      await wait();
      const b = store.mutate((s) => {
        const x = mustFind(s, id);
        if (x.status === "confirmed") assertNoClash(s, x, start);
        x.start = start;
        delete x.suggestedStart;
        return x;
      });
      await notifyAll(messages.moved(msgCtx(b)));
      return b;
    },
    async suggest(id, start) {
      requireSession();
      parse(bookingRequestSchema.pick({ start: true }), { start });
      await wait();
      const b = store.mutate((s) => {
        const x = mustFind(s, id);
        x.suggestedStart = start;
        return x;
      });
      await notifyAll(messages.suggestion(msgCtx(b), start));
      return b;
    },
    async openDays(serviceId) {
      await wait();
      const s = state();
      return listOpenDays(ctxOf(s), durationOf(serviceId ? serviceOf(s, serviceId) : null));
    },
    async slots(serviceId, dateKey: DateKey) {
      await wait();
      const s = state();
      return generateSlots(dateKey, durationOf(serviceId ? serviceOf(s, serviceId) : null), ctxOf(s));
    },
    async nextOpenSlot(serviceId) {
      await wait();
      const s = state();
      return nextOpenSlot(ctxOf(s), durationOf(serviceId ? serviceOf(s, serviceId) : null));
    },
  };

  const clients: Repo["clients"] = {
    async list() {
      requireSession();
      await wait();
      return deriveClients(state().bookings, now().dateKey);
    },
  };

  const gallery: Repo["gallery"] = {
    async list(o) {
      await wait();
      if (o?.includeHidden) requireSession();
      return state()
        .gallery.filter((p) => o?.includeHidden || p.visible)
        .sort((a, b) => a.sort - b.sort);
    },
    async add(input) {
      requireSession();
      const data = parse(galleryInputSchema, input);
      await wait();
      try {
        return store.mutate((s) => {
          const max = Math.max(0, ...s.gallery.map((p) => p.sort));
          const photo = { ...data, id: rid("ph"), sort: max + 10 };
          s.gallery.push(photo);
          return photo;
        });
      } catch (e) {
        if (e instanceof Error && e.message === "QUOTA") {
          throw new RepoError("STORAGE", "This browser is out of demo storage. Hide or reset some photos and try again.");
        }
        throw e;
      }
    },
    async update(id, patch) {
      requireSession();
      const data = parse(galleryPatchSchema, patch);
      await wait();
      return store.mutate((s) => {
        const p = s.gallery.find((x) => x.id === id);
        if (!p) throw new RepoError("NOT_FOUND", "We could not find that photo.");
        Object.assign(p, data);
        return p;
      });
    },
    async move(id, direction) {
      requireSession();
      await wait();
      store.mutate((s) => swapNeighbour(s.gallery, id, direction, () => "all"));
    },
  };

  const settings: Repo["settings"] = {
    async get() {
      await wait();
      return state().settings;
    },
    async update(patch) {
      requireSession("owner");
      const data = parse(settingsPatchSchema, patch);
      await wait();
      return store.mutate((s) => {
        s.settings = { ...s.settings, ...data, contact: data.contact ?? s.settings.contact };
        return s.settings;
      });
    },
    async getHours() {
      await wait();
      return [...state().hours].sort((a, b) => a.day - b.day);
    },
    async setHours(hours) {
      requireSession("owner");
      if (hours.length !== 7) throw new RepoError("VALIDATION", "Hours need all seven days.");
      const parsed = hours.map((h) => parse(hoursSchema, h));
      await wait();
      return store.mutate((s) => {
        s.hours = parsed;
        return s.hours;
      });
    },
  };

  const sent: Repo["sent"] = {
    async list() {
      requireSession();
      await wait();
      return [...state().sent];
    },
  };

  const demo: Repo["demo"] = {
    async reset() {
      await wait();
      store.reset();
    },
  };

  const subscribe = (cb: () => void): Unsubscribe => store.subscribe(cb);

  const repo: MockRepo = {
    __emitSession: emitSession,
    mode: "mock",
    services,
    bookings,
    clients,
    gallery,
    settings,
    sent,
    auth,
    notify,
    storage,
    demo,
    subscribe,
    __store: store,
  };
  return repo;
}

function swapNeighbour<T extends { id: string; sort: number }>(
  list: T[],
  id: string,
  direction: Direction,
  group: (x: T) => string,
): void {
  const item = list.find((x) => x.id === id);
  if (!item) throw new RepoError("NOT_FOUND", "We could not find that item.");
  const peers = list.filter((x) => group(x) === group(item)).sort((a, b) => a.sort - b.sort);
  const i = peers.findIndex((x) => x.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  const other = peers[j];
  if (!other) return;
  const tmp = item.sort;
  item.sort = other.sort;
  other.sort = tmp;
}
