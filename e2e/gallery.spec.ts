import { expect, test } from "@playwright/test";

test("filter the gallery and use the lightbox with the keyboard", async ({ page }) => {
  await page.goto("/work");
  const tiles = page.getByRole("button", { name: /^Open photo:/ });
  await expect(tiles).toHaveCount(4);
  await page.getByRole("button", { name: /^Colour/ }).click();
  await expect(tiles).toHaveCount(2);
  await page.getByRole("button", { name: /^All/ }).click();
  await expect(tiles).toHaveCount(4);

  const first = tiles.first();
  await first.focus();
  await page.keyboard.press("Enter");
  const viewer = page.getByRole("dialog", { name: "Photo viewer" });
  await expect(viewer).toBeVisible();
  await expect(viewer.getByText("Photo 1 of 4")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(viewer.getByText("Photo 2 of 4")).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(viewer.getByText("Photo 4 of 4")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  await expect(first).toBeFocused();
});

test("lightbox is a bottom sheet on phones", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/work");
  await page.getByRole("button", { name: /^Open photo:/ }).first().click();
  const box = await page.getByRole("dialog", { name: "Photo viewer" }).boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(388);
  expect(box!.y + box!.height).toBeGreaterThan(830);
  await page.getByRole("button", { name: "Close photo viewer" }).click();
});

test("filter chips scroll sideways on a small phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/services");
  const row = page.getByRole("tablist", { name: "Service categories" });
  const overflow = await row.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(overflow).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
