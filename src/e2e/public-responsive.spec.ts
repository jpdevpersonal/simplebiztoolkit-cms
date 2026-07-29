import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

const viewports = [
  { name: "mobile-320", width: 320, height: 700 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1024", width: 1024, height: 900 },
  { name: "desktop-1440", width: 1440, height: 900 },
] as const;

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    pageWidth: document.documentElement.scrollWidth,
  }));

  expect(
    dimensions.pageWidth,
    `Page width ${dimensions.pageWidth}px exceeds viewport ${dimensions.viewportWidth}px`,
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

async function isApiAvailable(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get("/api/menuitems", { timeout: 8_000 });
    return response.ok();
  } catch {
    return false;
  }
}

test.describe("Public responsive design", () => {
  for (const viewport of viewports) {
    test(`homepage is stable at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");

      await expect(
        page.getByRole("heading", {
          level: 1,
          name: /simple business templates & toolsthat keep work moving/i,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /browse all templates/i }).first(),
      ).toBeVisible();
      await expect(page.locator(".sb-site-header")).toBeVisible();
      await expectNoHorizontalOverflow(page);

      const trustSection = await page
        .locator(".sb-hero-trust-section")
        .boundingBox();
      expect(
        trustSection,
        "Trust section should be rendered after the hero",
      ).not.toBeNull();
      expect(
        trustSection?.y ?? Number.POSITIVE_INFINITY,
        "The first viewport should hint at the trust section below the hero",
      ).toBeLessThan(viewport.height);

      const mobileMenuButton = page.getByRole("button", { name: "Open menu" });
      if (viewport.width < 992) {
        await expect(mobileMenuButton).toBeVisible();
        await mobileMenuButton.click();
        await expect(
          page.getByRole("dialog", { name: "Site navigation" }),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(
          page.getByRole("dialog", { name: "Site navigation" }),
        ).toBeHidden();
        await expect(mobileMenuButton).toBeFocused();
      } else {
        await expect(mobileMenuButton).toBeHidden();
        await expect(page.locator(".sb-site-nav")).toBeVisible();
      }

      const screenshotPath = test
        .info()
        .outputPath(`homepage-${viewport.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await test.info().attach(`homepage-${viewport.name}`, {
        path: screenshotPath,
        contentType: "image/png",
      });
    });
  }

  for (const route of ["/templates", "/faq"] as const) {
    for (const viewport of [viewports[1], viewports[4]]) {
      test(`${route} is stable at ${viewport.width}px`, async ({
        page,
        request,
      }) => {
        test.skip(
          !(await isApiAvailable(request)),
          "Backend API is unavailable through the local Next.js proxy",
        );

        await page.setViewportSize(viewport);
        await page.goto(route);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoHorizontalOverflow(page);

        const screenshotPath = test
          .info()
          .outputPath(`${route.slice(1)}-${viewport.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        await test.info().attach(`${route.slice(1)}-${viewport.name}`, {
          path: screenshotPath,
          contentType: "image/png",
        });
      });
    }
  }
});
