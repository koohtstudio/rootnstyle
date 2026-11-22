import { beforeEach, describe, expect, it } from "vitest";
import type { BookingRequest } from "@/lib/domain/schemas";
import type { Slot } from "@/lib/domain/slots";
import { isRepoError, type RepoErrorCode } from "../errors";
import type { Repo } from "../types";

export interface ContractHarness {
  repo: Repo;
}

/**
 * The shared repo contract. Every adapter (mock, Neon) must pass this suite unchanged.
 * `make` must return a repo that starts from the standard seed and is signed out.
 */
export function runRepoContract(name: string, make: () => Promise<ContractHarness> | ContractHarness): void {
  describe(`repo contract: ${name}`, () => {
    let repo: Repo;

    beforeEach(async () => {
      repo = (await make()).repo;
    });

    const signInOwner = () => repo.auth.login("owner");

    async function freeSlot(serviceId: string, dayIndex = 0, slotIndex = 0): Promise<Slot> {
      const days = await repo.bookings.openDays(serviceId);
      const day = days.filter((d) => d.free > 2)[dayIndex];
      if (!day) throw new Error("no open day in window");
      const slots = (await repo.bookings.slots(serviceId, day.dateKey)).filter((s) => s.state === "open");
      const slot = slots[slotIndex];
      if (!slot) throw new Error("no open slot");
      return slot;
    }

    const req = (slot: Slot, over: Partial<BookingRequest> = {}): BookingRequest => ({
      serviceId: "haircuts",
      start: slot.start,
      name: "Test Person",
      phone: "905 555 0199",
      marketingOptIn: false,
      website: "",
      elapsedMs: 60_000,
      ...over,
    });

    async function code(p: Promise<unknown>): Promise<RepoErrorCode | "OK"> {
      try {
        await p;
        return "OK";
      } catch (e) {
        if (isRepoError(e)) return e.code;
        throw e;
      }
    }

    describe("services", () => {
      it("lists visible services publicly, grouped by category order", async () => {
        const list = await repo.services.list();
        expect(list.length).toBeGreaterThanOrEqual(13);
        expect(list.every((s) => s.visible)).toBe(true);
        const cats = await repo.services.listCategories();
        expect(cats.map((c) => c.id)).toEqual(["hair", "skin", "brows", "makeup"]);
      });

      it("keeps hidden services off the public list and the booking picker", async () => {
        await signInOwner();
        await repo.services.update("facials", { visible: false });
        await repo.auth.logout();
        const list = await repo.services.list();
        expect(list.find((s) => s.id === "facials")).toBeUndefined();
        expect(await code(repo.services.list({ includeHidden: true }))).toBe("FORBIDDEN");
        const slot = await freeSlot("haircuts");
        expect(await code(repo.bookings.create(req(slot, { serviceId: "facials" })))).toBe("NOT_FOUND");
      });

      it("edits price and duration, rejects bad values, and needs the owner", async () => {
        expect(await code(repo.services.update("haircuts", { price: 50 }))).toBe("FORBIDDEN");
        await repo.auth.login("frontdesk");
        expect(await code(repo.services.update("haircuts", { price: 50 }))).toBe("FORBIDDEN");
        await signInOwner();
        const s = await repo.services.update("haircuts", { price: 65, durationMin: 45 });
        expect(s.price).toBe(65);
        expect(s.durationMin).toBe(45);
        expect(await code(repo.services.update("haircuts", { price: -5 }))).toBe("VALIDATION");
        expect(await code(repo.services.update("haircuts", { nope: 1 } as never))).toBe("VALIDATION");
      });

      it("creates and reorders inside a category", async () => {
        await signInOwner();
        const created = await repo.services.create({ category: "hair", name: "Scalp treatment" });
        const hair = (await repo.services.list()).filter((s) => s.category === "hair");
        expect(hair[hair.length - 1]?.id).toBe(created.id);
        await repo.services.move(created.id, "up");
        const after = (await repo.services.list()).filter((s) => s.category === "hair");
        expect(after[after.length - 2]?.id).toBe(created.id);
      });
    });

    describe("bookings", () => {
      it("creates a new request that does not block the slot", async () => {
        const slot = await freeSlot("haircuts");
        const b = await repo.bookings.create(req(slot));
        expect(b.status).toBe("new");
        expect(b.phone).toBe("9055550199");
        const again = await repo.bookings.slots("haircuts", slot.start.slice(0, 10));
        expect(again.find((s) => s.start === slot.start)?.state).toBe("open");
      });

      it("rejects invalid input with field messages", async () => {
        const slot = await freeSlot("haircuts");
        try {
          await repo.bookings.create(req(slot, { phone: "123", name: "" }));
          throw new Error("should have failed");
        } catch (e) {
          expect(isRepoError(e) && e.code).toBe("VALIDATION");
          if (isRepoError(e)) {
            expect(e.issues.phone).toBeTruthy();
            expect(e.issues.name).toBeTruthy();
          }
        }
        expect(await code(repo.bookings.create({ ...req(slot), extra: "x" } as never))).toBe("VALIDATION");
      });

      it("treats a filled honeypot as a bot and stores nothing", async () => {
        await signInOwner();
        const before = (await repo.bookings.list()).length;
        const slot = await freeSlot("haircuts");
        await repo.bookings.create(req(slot, { website: "http://spam.example" }));
        expect((await repo.bookings.list()).length).toBe(before);
      });

      it("refuses a submit that is too fast", async () => {
        const slot = await freeSlot("haircuts");
        expect(await code(repo.bookings.create(req(slot, { elapsedMs: 5 })))).toBe("TOO_FAST");
      });

      it("removes the slot once the owner confirms, and refuses a clashing confirm", async () => {
        const slot = await freeSlot("haircuts");
        const a = await repo.bookings.create(req(slot, { name: "Person A" }));
        const b = await repo.bookings.create(req(slot, { name: "Person B", phone: "905 555 0198" }));
        await signInOwner();
        await repo.bookings.confirm(a.id);
        await repo.auth.logout();
        const day = await repo.bookings.slots("haircuts", slot.start.slice(0, 10));
        expect(day.find((s) => s.start === slot.start)?.state).toBe("booked");
        expect(await code(repo.bookings.create(req(slot, { name: "Person C", phone: "905 555 0197" })))).toBe("SLOT_TAKEN");
        await signInOwner();
        expect(await code(repo.bookings.confirm(b.id))).toBe("SLOT_TAKEN");
      });

      it("frees the slot again when a confirmed booking is cancelled", async () => {
        const slot = await freeSlot("haircuts");
        const a = await repo.bookings.create(req(slot));
        await signInOwner();
        await repo.bookings.confirm(a.id);
        await repo.bookings.cancel(a.id);
        const day = await repo.bookings.slots("haircuts", slot.start.slice(0, 10));
        expect(day.find((s) => s.start === slot.start)?.state).toBe("open");
      });

      it("moves a confirmed booking and updates availability on both days", async () => {
        const first = await freeSlot("haircuts", 0, 0);
        const second = await freeSlot("haircuts", 1, 0);
        const a = await repo.bookings.create(req(first));
        await signInOwner();
        await repo.bookings.confirm(a.id);
        await repo.bookings.move(a.id, second.start);
        const d1 = await repo.bookings.slots("haircuts", first.start.slice(0, 10));
        const d2 = await repo.bookings.slots("haircuts", second.start.slice(0, 10));
        expect(d1.find((s) => s.start === first.start)?.state).toBe("open");
        expect(d2.find((s) => s.start === second.start)?.state).toBe("booked");
      });

      it("auto-confirms when the setting is on", async () => {
        await signInOwner();
        await repo.settings.update({ autoConfirm: true });
        await repo.auth.logout();
        const slot = await freeSlot("haircuts");
        const b = await repo.bookings.create(req(slot));
        expect(b.status).toBe("confirmed");
        const day = await repo.bookings.slots("haircuts", slot.start.slice(0, 10));
        expect(day.find((s) => s.start === slot.start)?.state).toBe("booked");
      });

      it("pauses online requests when acceptOnline is off", async () => {
        await signInOwner();
        await repo.settings.update({ acceptOnline: false });
        await repo.auth.logout();
        const slot = await freeSlot("haircuts");
        expect(await code(repo.bookings.create(req(slot)))).toBe("CLOSED");
      });

      it("writes to the Sent log and never anywhere else", async () => {
        const slot = await freeSlot("haircuts");
        const b = await repo.bookings.create(req(slot, { email: "test@example.com" }));
        await signInOwner();
        const log = await repo.sent.list();
        const mine = log.filter((m) => m.bookingId === b.id);
        expect(mine.some((m) => m.kind === "request-received" && m.channel === "sms")).toBe(true);
        expect(mine.some((m) => m.kind === "request-received" && m.channel === "email")).toBe(true);
        expect(mine.some((m) => m.kind === "owner-alert")).toBe(true);
        await repo.bookings.confirm(b.id);
        expect((await repo.sent.list()).some((m) => m.bookingId === b.id && m.kind === "confirmation")).toBe(true);
        const other = await freeSlot("haircuts", 1, 2);
        const c = await repo.bookings.create(req(other, { phone: "905 555 0150" }));
        await repo.bookings.suggest(c.id, (await freeSlot("haircuts", 2, 1)).start);
        expect((await repo.sent.list()).some((m) => m.bookingId === c.id && m.kind === "suggestion")).toBe(true);
      });

      it("keeps bookings private from signed out callers", async () => {
        expect(await code(repo.bookings.list())).toBe("FORBIDDEN");
        expect(await code(repo.clients.list())).toBe("FORBIDDEN");
        expect(await code(repo.sent.list())).toBe("FORBIDDEN");
        expect(await code(repo.bookings.confirm("bk_seed_14"))).toBe("FORBIDDEN");
      });

      it("never offers Monday", async () => {
        const days = await repo.bookings.openDays(null);
        expect(days.length).toBe(14);
        for (const d of days) {
          const dow = new Date(`${d.dateKey}T12:00:00Z`).getUTCDay();
          expect(dow).not.toBe(1);
        }
      });
    });

    describe("clients", () => {
      it("builds the client list from bookings", async () => {
        await signInOwner();
        const list = await repo.clients.list();
        expect(list.length).toBeGreaterThan(3);
        const priya = list.find((c) => c.name.startsWith("Priya"));
        expect(priya?.visits).toBeGreaterThanOrEqual(2);
      });
    });

    describe("gallery", () => {
      it("hides photos from the public list and lets staff change tags", async () => {
        await signInOwner();
        const all = await repo.gallery.list({ includeHidden: true });
        const first = all[0]!;
        await repo.gallery.update(first.id, { visible: false, tag: "cuts" });
        await repo.auth.logout();
        expect((await repo.gallery.list()).find((p) => p.id === first.id)).toBeUndefined();
        await signInOwner();
        expect((await repo.gallery.list({ includeHidden: true })).find((p) => p.id === first.id)?.tag).toBe("cuts");
      });

      it("adds a photo", async () => {
        await signInOwner();
        const p = await repo.gallery.add({ title: "New work", tag: "colour", src: "/images/work-red.jpg", alt: "A new colour result" });
        expect((await repo.gallery.list()).some((x) => x.id === p.id)).toBe(true);
      });
    });

    describe("settings and hours", () => {
      it("changes opening hours and the slots follow", async () => {
        await signInOwner();
        const hours = await repo.settings.getHours();
        expect(hours.find((h) => h.day === 1)?.closed).toBe(true);
        const next = hours.map((h) => (h.day === 0 ? { ...h, closed: true } : h));
        await repo.settings.setHours(next);
        const days = await repo.bookings.openDays(null);
        for (const d of days) expect(new Date(`${d.dateKey}T12:00:00Z`).getUTCDay()).not.toBe(0);
      });

      it("rejects closing before opening", async () => {
        await signInOwner();
        const hours = await repo.settings.getHours();
        const bad = hours.map((h) => (h.day === 2 ? { ...h, open: "18:00", close: "09:00" } : h));
        expect(await code(repo.settings.setHours(bad))).toBe("VALIDATION");
      });
    });

    describe("demo reset", () => {
      it("restores the seed", async () => {
        await signInOwner();
        await repo.services.update("haircuts", { price: 99 });
        await repo.demo.reset();
        expect((await repo.services.get("haircuts"))?.price).toBeNull();
      });
    });
  });
}
