import { expect, test } from "@playwright/test";
import { findBooking, signIn } from "./helpers";

test("role gating: signed out goes to login, front desk cannot open owner pages", async ({ page }) => {
  await page.goto("/admin/settings");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fsettings/);
  await page.getByRole("button", { name: /Sign in as front desk/ }).click();
  await expect(page).toHaveURL(/\/admin\/settings$/);
  await expect(page.getByRole("heading", { name: /That page is for the owner/ })).toBeVisible();
  await page.goto("/admin/services");
  await expect(page.getByRole("heading", { name: /That page is for the owner/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);
  await page.goto("/admin/requests");
  await expect(page.getByRole("heading", { name: "Booking requests" })).toBeVisible();
});

test("sign out returns to login", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("price edit shows on the public site in another tab", async ({ context }) => {
  const pub = await context.newPage();
  await pub.goto("/services");
  await expect(pub.getByRole("listitem").filter({ hasText: "Haircuts" }).getByText("Price on request")).toBeVisible();

  const admin = await context.newPage();
  await signIn(admin, "owner", "/admin/services");
  const price = admin.getByLabel("Haircuts price");
  await price.fill("85");
  await price.press("Enter");
  await expect(admin.getByTestId("service-haircuts").getByText("Saved")).toBeVisible();
  const mins = admin.getByLabel("Haircuts duration in minutes");
  await mins.fill("45");
  await mins.press("Enter");

  const card = pub.getByRole("listitem").filter({ hasText: "Haircuts" });
  await expect(card.getByText("From $85")).toBeVisible({ timeout: 1500 });
  await expect(card.getByText("45 min")).toBeVisible();

  await admin.reload();
  await expect(admin.getByLabel("Haircuts price")).toHaveValue("85");
});

test("hiding a service removes it from the site and the booking picker", async ({ context }) => {
  const pub = await context.newPage();
  await pub.goto("/book");
  await expect(pub.locator('select[name="service"] option', { hasText: "Facials" })).toHaveCount(1);

  const admin = await context.newPage();
  await signIn(admin, "owner", "/admin/services");
  await admin.getByRole("switch", { name: "Show Facials on the website" }).click();
  await expect(admin.getByRole("switch", { name: "Show Facials on the website" })).toHaveAttribute("aria-checked", "false");

  await expect(pub.locator('select[name="service"] option', { hasText: /^Facials$/ })).toHaveCount(0, { timeout: 1500 });
  await pub.goto("/services?cat=skin");
  await expect(pub.getByRole("heading", { name: "Facials", exact: true })).toHaveCount(0);
});

test("add and reorder a service", async ({ page }) => {
  await signIn(page, "owner", "/admin/services");
  await page.getByRole("button", { name: "Add a service" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Scalp treatment");
  await page.getByLabel("Price ($)").fill("40");
  await page.getByRole("button", { name: "Add service", exact: true }).click();
  await expect(page.getByTestId(/^service-svc_/).filter({ hasText: "Scalp treatment" })).toBeVisible();
  await page.getByRole("button", { name: "Move Scalp treatment up" }).click();
  const names = await page.locator('[data-testid^="service-"] strong').allTextContents();
  expect(names.indexOf("Scalp treatment")).toBeLessThan(names.indexOf("Keratin and hair botox"));
});

test("gallery: hide a photo and change its tag, public site follows", async ({ context }) => {
  const pub = await context.newPage();
  await pub.goto("/work");
  await expect(pub.getByRole("button", { name: "Open photo: Rich red layers" })).toBeVisible();
  const admin = await context.newPage();
  await signIn(admin, "owner", "/admin/gallery");
  await expect(admin.getByText("Only upload photos the client has agreed to share.").first()).toBeVisible();
  await admin.getByRole("switch", { name: "Show Rich red layers on the website" }).click();
  await expect(pub.getByRole("button", { name: "Open photo: Rich red layers" })).toHaveCount(0, { timeout: 1500 });
  await admin.getByLabel("Filter tag for Soft brown curls").selectOption("cuts");
  await pub.getByRole("button", { name: /^Cuts/ }).click();
  await expect(pub.getByRole("button", { name: "Open photo: Soft brown curls" })).toBeVisible({ timeout: 1500 });
});

test("gallery: add a photo with a mock upload", async ({ page }) => {
  await signIn(page, "owner", "/admin/gallery");
  await page.getByRole("button", { name: "Add a photo" }).click();
  await page.getByLabel(/^Photo \(JPG/).setInputFiles("public/images/work-red.jpg");
  await expect(page.getByAltText("Preview of the photo you chose")).toBeVisible();
  await page.getByLabel("Title").fill("Fresh red");
  await page.getByLabel(/Describe the photo/).fill("A fresh red colour result");
  await page.getByRole("button", { name: "Add photo", exact: true }).click();
  await expect(page.getByText("Please confirm the client agreed")).toBeVisible();
  await page.getByRole("checkbox", { name: /agreed to share/ }).check();
  await page.getByRole("button", { name: "Add photo", exact: true }).click();
  await expect(page.getByTestId(/^photo_?-?ph_/).filter({ hasText: "Fresh red" })).toBeVisible();
  await page.reload();
  await expect(page.locator("strong", { hasText: "Fresh red" })).toBeVisible();
});

test("settings: pause online requests, then reset demo data restores everything", async ({ context }) => {
  const pub = await context.newPage();
  await pub.goto("/book");
  await expect(pub.locator('select[name="service"]')).toBeVisible();
  const admin = await context.newPage();
  await signIn(admin, "owner", "/admin/settings");
  await admin.getByRole("switch", { name: "Accept online requests" }).click();
  await expect(pub.getByRole("heading", { name: "Online requests are paused" })).toBeVisible({ timeout: 1500 });

  await admin.getByRole("main").getByRole("button", { name: "Reset demo data" }).click();
  await admin.getByRole("button", { name: "Yes, reset everything" }).click();
  await expect(admin.getByText("Demo data reset.")).toBeVisible();
  await expect(pub.locator('select[name="service"]')).toBeVisible({ timeout: 1500 });
});

test("sidebar reset asks first and then reseeds", async ({ page }) => {
  await signIn(page, "owner", "/admin/services");
  const price = page.getByLabel("Waxing price");
  await price.fill("30");
  await price.press("Enter");
  await expect(page.getByTestId("service-waxing").getByText("Saved")).toBeVisible();
  await page.getByRole("complementary").getByRole("button", { name: "Reset demo data" }).click();
  await page.getByRole("button", { name: "Keep my changes" }).click();
  await expect(page.getByLabel("Waxing price")).toHaveValue("30");
  await page.getByRole("complementary").getByRole("button", { name: "Reset demo data" }).click();
  await page.getByRole("button", { name: "Yes, reset everything" }).click();
  await expect(page.getByLabel("Waxing price")).toHaveValue("");
});

test("request actions: confirm, suggest, decline, done and calendar cancel", async ({ page }) => {
  await signIn(page, "owner", "/admin/requests?tab=new");
  await page.getByRole("button", { name: /Zara H\./ }).click();
  await page.getByRole("button", { name: "Suggest another time" }).click();
  await page.getByRole("group", { name: "Choose a day" }).locator("button:not([disabled])").first().click();
  await page.getByRole("group", { name: /^Times on/ }).locator("button:not([disabled])").first().click();
  await page.getByRole("button", { name: "Send suggestion" }).click();
  await expect(page.getByText(/Suggestion sent/)).toBeVisible();

  await page.getByRole("button", { name: /Devon L\./ }).click();
  await page.getByRole("button", { name: "Decline" }).click();
  await expect(page.getByText(/Declined\./)).toBeVisible();

  await page.getByRole("button", { name: /Anika P\./ }).click();
  await page.getByRole("button", { name: /Confirm and text/ }).click();
  await expect(page.getByText(/Confirmed\./)).toBeVisible();
  await page.getByRole("tab", { name: /^Confirmed/ }).click();
  await page.getByRole("button", { name: /Anika P\./ }).click();
  await page.getByRole("button", { name: "Mark done" }).click();
  await page.getByRole("tab", { name: /^Done/ }).click();
  await expect(page.getByRole("button", { name: /Anika P\./ })).toBeVisible();

  await page.goto("/admin/calendar");
  const first = await findBooking(page, /Amrit K\./);
  await first.click();
  await page.getByRole("button", { name: "Cancel booking" }).click();
  await page.getByRole("button", { name: "Yes, cancel it" }).click();
  await expect(page.getByText(/Cancelled\. The slot is open again/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Amrit K\./ })).toHaveCount(0);
});

test("calendar: move a booking", async ({ page }) => {
  await signIn(page, "owner", "/admin/calendar");
  await (await findBooking(page, /Simran G\./)).click();
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await page.getByRole("group", { name: "Choose a day" }).locator("button:not([disabled])").last().click();
  await page.getByRole("group", { name: /^Times on/ }).locator("button:not([disabled])").first().click();
  await page.getByRole("button", { name: "Move booking" }).click();
  await expect(page.getByText(/Moved\. The client was texted/)).toBeVisible();
});

test("clients list is built from bookings and searchable", async ({ page }) => {
  await signIn(page, "owner", "/admin/clients");
  await expect(page.getByRole("row", { name: /Priya S\./ })).toBeVisible();
  await page.getByLabel("Search clients").fill("zzzz");
  await expect(page.getByText("No one matches that")).toBeVisible();
});

test("state survives a refresh", async ({ page }) => {
  await signIn(page, "owner", "/admin/settings");
  await page.getByRole("switch", { name: "Auto-confirm open times" }).click();
  await page.reload();
  await expect(page.getByRole("switch", { name: "Auto-confirm open times" })).toHaveAttribute("aria-checked", "true");
});

test("corrupt local data reseeds instead of crashing", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("rns-mock-v1", "{broken"));
  await page.goto("/services");
  await expect(page.getByRole("heading", { name: "Haircuts", exact: true })).toBeVisible();
  await page.goto("/admin/login");
  await page.getByRole("button", { name: /Sign in as owner/ }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
