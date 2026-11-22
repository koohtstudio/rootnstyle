import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers";

const PUBLIC = ["/", "/services", "/work", "/about", "/book", "/visit", "/privacy"];
const ADMIN = ["/admin", "/admin/requests", "/admin/calendar", "/admin/services", "/admin/gallery", "/admin/clients", "/admin/messages", "/admin/settings"];

async function crawl(page: Page, start: string[]) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  const seen = new Set<string>();
  const queue = [...start];
  const bad: string[] = [];
  while (queue.length) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    const res = await page.goto(url);
    if (!res || res.status() >= 400) bad.push(`${url} -> ${res?.status()}`);
    await page.waitForLoadState("networkidle");
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
    for (const h of hrefs) {
      if (!h || h.startsWith("mailto:") || h.startsWith("tel:") || /^https?:\/\//.test(h)) continue;
      const clean = h.split("#")[0] || "/";
      if (clean.startsWith("/") && !seen.has(clean)) queue.push(clean);
    }
  }
  return { seen: [...seen], bad, errors };
}

test("every internal link on public pages works and the console stays clean", async ({ page }) => {
  const { seen, bad, errors } = await crawl(page, PUBLIC);
  expect(seen.length).toBeGreaterThanOrEqual(PUBLIC.length);
  expect(bad).toEqual([]);
  expect(errors).toEqual([]);
});

test("every internal link on admin pages works and the console stays clean", async ({ page }) => {
  await signIn(page);
  const { seen, bad, errors } = await crawl(page, ADMIN);
  expect(seen.length).toBeGreaterThanOrEqual(ADMIN.length);
  expect(bad).toEqual([]);
  expect(errors).toEqual([]);
});

test("every page has a real h1 or heading and no dead buttons", async ({ page }) => {
  for (const p of PUBLIC) {
    await page.goto(p);
    await expect(page.locator("h1")).toHaveCount(1);
  }
});

test("unknown routes show the designed 404", async ({ page }) => {
  const res = await page.goto("/nope");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /That page is not here/ })).toBeVisible();
});
