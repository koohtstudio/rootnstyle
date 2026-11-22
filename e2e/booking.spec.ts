import { expect, test } from "@playwright/test";
import { book, chooseSlot, fillDetails } from "./helpers";

test("booking happy path on /book", async ({ page }) => {
  await book(page, "Haircuts", "Sam Lee", "905 555 0123");
  await expect(page.getByRole("heading", { name: /You are on the book, Sam\./ })).toBeFocused();
  await expect(page.getByText("We will text (905) 555-0123 to confirm.")).toBeVisible();
  await expect(page.getByText("This is a demo, nothing was sent.")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss demo note" }).click();
  await expect(page.getByText("This is a demo, nothing was sent.")).toBeHidden();
  await page.getByRole("button", { name: "Book another time" }).click();
  await expect(page.locator('select[name="service"]')).toHaveValue("");
});

test("booking from the home page widget", async ({ page }) => {
  await page.goto("/#book");
  const section = page.locator("#book");
  await section.locator('select[name="service"]').selectOption({ label: "Facials" });
  await section.getByRole("group", { name: "Choose a day" }).locator("button:not([disabled])").first().click();
  await section.getByRole("group", { name: /^Times on/ }).locator("button:not([disabled])").first().click();
  await section.getByLabel("Name", { exact: true }).fill("Ava Chen");
  await section.getByLabel("Phone").fill("(416) 555-0188");
  await section.getByRole("textbox", { name: /^Email/ }).fill("ava@example.com");
  await section.getByRole("button", { name: "Request this time" }).click();
  await expect(section.getByTestId("booking-confirmation")).toBeVisible();
});

test("Book this pre-selects the service", async ({ page }) => {
  await page.goto("/services?cat=skin");
  await expect(page.getByRole("tab", { name: "Skin" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("link", { name: "Book this Hydrafacial" }).click();
  await expect(page).toHaveURL(/\/book\?service=hydrafacial/);
  await expect(page.locator('select[name="service"]')).toHaveValue("hydrafacial");
});

test("shows clear errors and keeps the slot picker usable", async ({ page }) => {
  await page.goto("/book");
  await chooseSlot(page);
  await fillDetails(page, "S", "123");
  await page.getByRole("button", { name: "Request this time" }).click();
  await expect(page.getByText("Please enter your name").or(page.getByText("Name is too short"))).toBeVisible();
  await expect(page.getByText(/10 digit phone number/).first()).toBeVisible();
  await expect(page.getByLabel("Name", { exact: true })).toBeFocused();
  await expect(page.getByTestId("booking-confirmation")).toBeHidden();
});

test("optional marketing box is unchecked and honeypot is hidden from people", async ({ page }) => {
  await page.goto("/book");
  await chooseSlot(page);
  await expect(page.getByRole("checkbox", { name: /occasional offers/ })).not.toBeChecked();
  await expect(page.locator('input[name="website"]')).not.toBeInViewport();
});

test("a filled honeypot looks like success but stores nothing", async ({ page, context }) => {
  await page.goto("/book");
  await chooseSlot(page);
  await fillDetails(page, "Bot Person", "905 555 0199");
  await page.locator('input[name="website"]').fill("http://spam.example", { force: true });
  await page.getByRole("button", { name: "Request this time" }).click();
  await expect(page.getByTestId("booking-confirmation")).toBeVisible();
  const admin = await context.newPage();
  await admin.goto("/admin/login");
  await admin.getByRole("button", { name: /Sign in as owner/ }).click();
  await admin.goto("/admin/requests");
  await expect(admin.getByRole("heading", { name: "Booking requests" })).toBeVisible();
  await expect(admin.getByText("Bot Person")).toHaveCount(0);
});
