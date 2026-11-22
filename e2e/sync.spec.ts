import { expect, test } from "@playwright/test";
import { book, chooseSlot, signIn } from "./helpers";

test("a request sent on the site shows up in the admin in another tab within a second", async ({ context }) => {
  const admin = await context.newPage();
  await signIn(admin, "owner", "/admin/requests");
  await expect(admin.getByRole("heading", { name: "Booking requests" })).toBeVisible();
  await expect(admin.getByText("Zed Tester")).toHaveCount(0);

  const dash = await context.newPage();
  await signIn(dash, "owner", "/admin");
  const before = Number(await dash.getByTestId("stat-new").textContent());

  const site = await context.newPage();
  await book(site, "Haircuts", "Zed Tester", "905 555 0144");

  await expect(admin.getByText("Zed Tester")).toBeVisible({ timeout: 1000 });
  await expect(dash.getByTestId("stat-new")).toHaveText(String(before + 1), { timeout: 1000 });
});

test("confirming in admin removes the slot on the public page in another tab", async ({ context }) => {
  const site = await context.newPage();
  await site.goto("/book");
  await site.locator('select[name="service"]').selectOption({ label: "Haircuts" });
  await site.getByRole("group", { name: "Choose a day" }).locator("button:not([disabled])").nth(1).click();
  const times = site.getByRole("group", { name: /^Times on/ });
  const target = times.locator("button:not([disabled])").nth(2);
  const label = (await target.textContent())!.trim();
  const same = times.getByRole("button", { name: label, exact: true });
  await expect(same).toBeEnabled();

  // someone else books that exact time
  const other = await context.newPage();
  await other.goto("/book");
  await chooseSlot(other, "Haircuts", { dayIndex: 1, timeIndex: 2 });
  await other.getByLabel("Name", { exact: true }).fill("Pat Booker");
  await other.getByLabel("Phone").fill("905 555 0166");
  await other.getByRole("button", { name: "Request this time" }).click();
  await expect(other.getByTestId("booking-confirmation")).toBeVisible();

  // a pending request does not block the slot
  await expect(same).toBeEnabled();

  const admin = await context.newPage();
  await signIn(admin, "owner", "/admin/requests?tab=new");
  await admin.getByRole("button", { name: /Pat Booker/ }).click();
  await admin.getByRole("button", { name: /Confirm and text/ }).click();
  await expect(admin.getByText(/Confirmed\. The text is in Sent messages/)).toBeVisible();

  await expect(times.getByRole("button", { name: `${label}, taken` })).toBeDisabled({ timeout: 1500 });

  await admin.goto("/admin/messages");
  await expect(admin.getByTestId("sent-message").filter({ hasText: "Pat" }).first()).toContainText("Not actually sent");
});
