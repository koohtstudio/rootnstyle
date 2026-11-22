// Takes the README screenshots. Usage: node scripts/screenshots.mjs https://rootnstyle.vercel.app
import { chromium, devices } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
mkdirSync("docs/screenshots", { recursive: true });
const browser = await chromium.launch();

async function run(label, contextOpts) {
  const ctx = await browser.newContext({ ...contextOpts, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const shot = (name, full = false) => page.screenshot({ path: `docs/screenshots/${label}-${name}.png`, fullPage: full });

  await page.goto(base);
  await page.waitForTimeout(1200);
  await shot("home");
  await page.goto(`${base}/services`);
  await page.waitForTimeout(800);
  await shot("services");

  await page.goto(`${base}/work`);
  await page.getByRole("button", { name: /^Open photo:/ }).first().click();
  await page.waitForTimeout(900);
  await shot("gallery-lightbox");
  await page.keyboard.press("Escape");

  await page.goto(`${base}/book`);
  await page.locator('select[name="service"]').selectOption({ label: "Haircuts" });
  await page.getByRole("group", { name: "Choose a day" }).locator("button:not([disabled])").first().click();
  await page.getByRole("group", { name: /^Times on/ }).locator("button:not([disabled])").first().click();
  await page.getByLabel("Name", { exact: true }).fill("Sam Lee");
  await page.getByLabel("Phone").fill("905 555 0123");
  await page.waitForTimeout(2300);
  await page.getByRole("button", { name: "Request this time" }).click();
  await page.getByTestId("booking-confirmation").waitFor();
  await page.waitForTimeout(400);
  await shot("booking-confirm");

  await page.goto(`${base}/admin/login`);
  await page.getByRole("button", { name: /Sign in as owner/ }).click();
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
  await page.waitForTimeout(800);
  await shot("admin-dashboard");
  await page.goto(`${base}/admin/requests?tab=new`);
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /Sam Lee/ }).first().click();
  await page.waitForTimeout(600);
  await shot("admin-requests");
  await ctx.close();
}

await run("desktop", { viewport: { width: 1440, height: 900 } });
await run("phone", { ...devices["Pixel 7"] });
await browser.close();
console.log("done");
