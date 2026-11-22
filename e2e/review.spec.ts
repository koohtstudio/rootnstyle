import { expect, test } from "@playwright/test";

test("unconfirmed facts only show with ?review=1", async ({ page }) => {
  await page.goto("/services");
  await expect(page.getByText("[price to confirm]")).toHaveCount(0);
  await expect(page.getByText(/\[confirm/)).toHaveCount(0);
  await page.goto("/services?review=1");
  await expect(page.getByText("[price to confirm]").first()).toBeVisible();
  await expect(page.getByText("[time]").first()).toBeVisible();
  await page.getByRole("link", { name: "Visit" }).first().click();
  await expect(page.getByText(/\[confirm: unit number\]/).first()).toBeVisible();
  await page.goto("/about");
  await expect(page.getByText("[name to confirm]").first()).toBeVisible();
  await page.goto("/services?review=0");
  await expect(page.getByText(/\[confirm/)).toHaveCount(0);
});

test("reviews are labelled placeholders and nothing is invented", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByText("4.6").first()).toBeVisible();
  await expect(page.getByText(/359 reviews/).first()).toBeVisible();
  await expect(page.getByText("Placeholder")).toHaveCount(3);
  await expect(page.getByRole("link", { name: /Read reviews on Google/ })).toHaveAttribute("href", /google\.com\/maps/);
});

test("site is noindex and robots disallows while it shows sample data", async ({ page, request }) => {
  const res = await page.goto("/");
  expect(res?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /");
});

test("security headers and nonce CSP are set", async ({ page }) => {
  const res = await page.goto("/");
  const h = res!.headers();
  expect(h["content-security-policy"]).toMatch(/script-src 'self' 'nonce-/);
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["content-security-policy"]).toContain("img-src 'self' blob: data:");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBeTruthy();
  expect(h["permissions-policy"]).toContain("camera=()");
});

test("booking API validates, rejects unknown fields and honours the honeypot", async ({ request }) => {
  const ok = { serviceId: "haircuts", start: "2026-12-01T10:00", name: "Sam Lee", phone: "905 555 0123", website: "", elapsedMs: 5000 };
  expect((await request.post("/api/bookings", { data: ok })).status()).toBe(200);
  expect((await request.post("/api/bookings", { data: { ...ok, phone: "12" } })).status()).toBe(422);
  expect((await request.post("/api/bookings", { data: { ...ok, role: "admin" } })).status()).toBe(422);
  const trap = await request.post("/api/bookings", { data: { ...ok, website: "x" } });
  expect((await trap.json()).ignored).toBe(true);
  expect((await request.post("/api/bookings", { data: Buffer.from("{bad json"), headers: { "content-type": "application/json" } })).status()).toBe(400);
  expect((await request.get("/api/bookings")).status()).toBe(405);
});

test("no third-party requests on any public page", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (!["localhost", "127.0.0.1"].includes(u.hostname) && !u.protocol.startsWith("data") && !u.protocol.startsWith("blob")) external.push(r.url());
  });
  for (const p of ["/", "/services", "/work", "/about", "/book", "/visit"]) await page.goto(p);
  expect(external).toEqual([]);
});

test("the marquee stops under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const anim = await page.getByTestId("marquee-track").evaluate((el) => getComputedStyle(el).animationName);
  expect(anim).toBe("none");
});
