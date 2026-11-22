import { describe, expect, it } from "vitest";
import { createMockRepo } from "@/lib/repo/mock";
import { memoryBus, memoryKV, MockStore, STORE_KEY } from "@/lib/repo/mock/store";

describe("mock store", () => {
  it("seeds on first load and persists", () => {
    const kv = memoryKV();
    new MockStore({ storage: kv });
    const raw = JSON.parse(kv.getItem(STORE_KEY)!);
    expect(raw.version).toBe(1);
    expect(raw.services.length).toBeGreaterThan(10);
  });

  it("reseeds instead of crashing on corrupt, old or wrong shape data", () => {
    for (const bad of ["{not json", "null", JSON.stringify({ version: 0 }), JSON.stringify({ version: 1, services: "x" }), ""]) {
      const kv = memoryKV();
      kv.setItem(STORE_KEY, bad);
      const store = new MockStore({ storage: kv });
      expect(store.read().services.length).toBeGreaterThan(10);
    }
  });

  it("survives storage that throws", () => {
    const kv = { getItem: () => { throw new Error("blocked"); }, setItem: () => {}, removeItem: () => {} };
    const store = new MockStore({ storage: kv });
    expect(store.read().version).toBe(1);
  });

  it("keeps two tabs in sync and never overwrites with stale data", async () => {
    const kv = memoryKV();
    const bus = memoryBus();
    const a = createMockRepo({ storage: kv, channel: bus.create(), latency: null });
    const b = createMockRepo({ storage: kv, channel: bus.create(), latency: null });
    let heard = 0;
    b.subscribe(() => heard++);

    await a.auth.login("owner");
    await a.services.update("haircuts", { price: 70 });
    await new Promise((r) => setTimeout(r, 5));
    expect(heard).toBeGreaterThan(0);
    expect((await b.services.get("haircuts"))?.price).toBe(70);

    // b writes next, then a writes something else. Neither loses the other's change.
    await b.auth.login("owner");
    await b.services.update("facials", { price: 90 });
    await a.services.update("waxing", { price: 30 });
    expect((await a.services.get("facials"))?.price).toBe(90);
    expect((await b.services.get("waxing"))?.price).toBe(30);
    expect((await b.services.get("haircuts"))?.price).toBe(70);
  });

  it("a booking made in one tab reaches the other", async () => {
    const kv = memoryKV();
    const bus = memoryBus();
    const site = createMockRepo({ storage: kv, channel: bus.create(), latency: null });
    const admin = createMockRepo({ storage: kv, channel: bus.create(), latency: null });
    await admin.auth.login("owner");
    const before = (await admin.bookings.list({ status: "new" })).length;
    let pinged = false;
    admin.subscribe(() => (pinged = true));
    const days = await site.bookings.openDays("haircuts");
    const slot = (await site.bookings.slots("haircuts", days[0]!.dateKey)).find((s) => s.state === "open")!;
    await site.bookings.create({ serviceId: "haircuts", start: slot.start, name: "Tab Test", phone: "9055550177", elapsedMs: 9999, website: "" });
    await new Promise((r) => setTimeout(r, 5));
    expect(pinged).toBe(true);
    expect((await admin.bookings.list({ status: "new" })).length).toBe(before + 1);
  });
});
