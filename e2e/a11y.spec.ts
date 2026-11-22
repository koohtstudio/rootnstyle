import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { chooseSlot, signIn } from "./helpers";

const PUBLIC = ["/", "/services", "/services?cat=skin", "/work", "/about", "/book", "/visit", "/privacy", "/nope"];
const ADMIN = ["/admin", "/admin/requests", "/admin/calendar", "/admin/services", "/admin/gallery", "/admin/clients", "/admin/messages", "/admin/settings"];

async function scan(page: import("@playwright/test").Page) {
  await page.waitForLoadState("load");
  await page.waitForTimeout(300);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
}

for (const path of PUBLIC) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await scan(page);
  });
}

test("axe: booking widget filled in and lightbox open", async ({ page }) => {
  await page.goto("/book");
  await chooseSlot(page);
  await scan(page);
  await page.goto("/work");
  await page.getByRole("button", { name: /^Open photo:/ }).first().click();
  await scan(page);
});

test("axe: booking confirmation", async ({ page }) => {
  await page.goto("/book");
  await chooseSlot(page);
  await page.getByLabel("Name", { exact: true }).fill("Sam Lee");
  await page.getByLabel("Phone").fill("905 555 0123");
  await page.getByRole("button", { name: "Request this time" }).click();
  await expect(page.getByTestId("booking-confirmation")).toBeVisible();
  await scan(page);
});

test("axe: login", async ({ page }) => {
  await page.goto("/admin/login");
  await scan(page);
});

for (const path of ADMIN) {
  test(`axe: ${path}`, async ({ page }) => {
    await signIn(page, "owner", path);
    await expect(page.getByRole("main")).toBeVisible();
    await page.waitForTimeout(150);
    await scan(page);
  });
}
