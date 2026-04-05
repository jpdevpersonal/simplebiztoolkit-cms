import { expect, test } from "@playwright/test";

test.describe("Smoke", () => {
  test("home page loads core content", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /templates/i }).first(),
    ).toBeVisible();
  });

  test("templates page is reachable", async ({ page }) => {
    await page.goto("/templates");
    await expect(page).toHaveURL(/\/templates/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("legacy products page redirects to templates", async ({ page }) => {
    await page.goto("/products");
    await expect(page).toHaveURL(/\/templates/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("admin login page is reachable", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
