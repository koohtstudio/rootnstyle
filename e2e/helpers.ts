import { expect, type Page } from "@playwright/test";

export async function signIn(page: Page, role: "owner" | "frontdesk" = "owner", next = "/admin") {
  await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
  // If another tab already signed in, the login page redirects by itself before we can click.
  await page.getByRole("button", { name: role === "owner" ? /Sign in as owner/ : /Sign in as front desk/ }).click({ timeout: 3000 }).catch(() => {});
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[/?=&]/g, "\\$&")}$`));
}

/** Picks service, first open day and first open time. Returns the chosen time label. */
export async function chooseSlot(page: Page, service = "Haircuts", opts: { dayIndex?: number; timeIndex?: number } = {}) {
  await page.locator('select[name="service"]').selectOption({ label: service });
  const days = page.getByRole("group", { name: "Choose a day" }).locator("button:not([disabled])");
  await days.nth(opts.dayIndex ?? 0).click();
  const times = page.getByRole("group", { name: /^Times on/ }).locator("button:not([disabled])");
  await expect(times.first()).toBeVisible();
  const t = times.nth(opts.timeIndex ?? 0);
  const label = (await t.textContent())?.trim() ?? "";
  await t.click();
  return label;
}

export async function fillDetails(page: Page, name = "Sam Lee", phone = "905 555 0123") {
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Phone").fill(phone);
}

export async function book(page: Page, service = "Haircuts", name = "Sam Lee", phone = "905 555 0123", opts: { dayIndex?: number; timeIndex?: number } = {}) {
  await page.goto("/book");
  const label = await chooseSlot(page, service, opts);
  await fillDetails(page, name, phone);
  await page.getByRole("button", { name: "Request this time" }).click();
  await expect(page.getByTestId("booking-confirmation")).toBeVisible();
  return label;
}

/** The calendar shows one week at a time. Step forward until the booking is on screen. */
export async function findBooking(page: Page, name: RegExp) {
  for (let i = 0; i < 4; i++) {
    const hit = page.getByRole("button", { name }).first();
    if (await hit.isVisible().catch(() => false)) return hit;
    await page.getByRole("button", { name: "Next week" }).click();
    await page.waitForTimeout(200);
  }
  return page.getByRole("button", { name }).first();
}
