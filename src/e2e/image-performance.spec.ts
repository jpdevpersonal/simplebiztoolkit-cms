/**
 * Image Performance Tests
 *
 * Validates that images on key public pages:
 *  1. Decode successfully (complete + naturalWidth > 0)
 *  2. Meet LCP thresholds at natural localhost speed (a proxy for image-size
 *     optimisation – file-size problems surface even on localhost)
 *  3. Meet LCP and per-image transfer duration thresholds under simulated
 *     Fast 3G (CDP network throttling)
 *
 * ── Thresholds ────────────────────────────────────────────────────────────
 * LCP_UNTHROTTLED_MS = 2500   Google PageSpeed "Good" target
 * LCP_THROTTLED_MS   = 5000   Acceptable under Fast 3G constraint
 * IMAGE_TRANSFER_MS  = 3000   Max transfer time per image under Fast 3G
 *
 * ── API guard ─────────────────────────────────────────────────────────────
 * Several pages are SSG routes whose content is pre-rendered from the backend.
 * Tests that depend on that content call the Next.js /api/ proxy routes (not
 * the backend directly), so the same check works both locally and in CI where
 * NEXT_PUBLIC_API_URL is set to the Azure test environment. If the Next.js
 * dev server is running but the backend is unavailable, API-dependent tests
 * are skipped with an explanatory message rather than failing.
 *
 * ── Known slugs ───────────────────────────────────────────────────────────
 * Stable SSG slugs from the last production build are used as constants so
 * that static-page tests do not require a live API. Update these constants if
 * the corresponding content is removed from the CMS.
 *
 * ── Self-validation ───────────────────────────────────────────────────────
 * Suite 4 injects a known-404 image into a live page and asserts the
 * getAllImages helper reports it as broken. If this test fails, the integrity
 * checks in suites 1–3 may be silently passing broken images.
 */

import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import type { CDPSession } from "playwright-core";

// ── Performance thresholds ────────────────────────────────────────────────────

/** Google PageSpeed "Good" LCP on a fast local connection */
const LCP_UNTHROTTLED_MS = 2500;

/** Acceptable LCP under simulated Fast 3G – file-size limited, not network speed */
const LCP_THROTTLED_MS = 5000;

/** Max transfer time for a single image under Fast 3G */
const IMAGE_TRANSFER_MS = 3000;

// ── Message used when API-dependent tests are skipped ─────────────────────────

const API_SKIP_MESSAGE =
  "Backend API not available via localhost:3000 proxy – start the Next.js " +
  "dev/start server and ensure NEXT_PUBLIC_API_URL points to a running backend";

// ── Known stable SSG slugs (from last production build output) ────────────────
// These pages are always pre-rendered so they exist without a live API.

const KNOWN_CATEGORY_SLUG = "accounting-ledger";
const KNOWN_PRODUCT_SLUG = "fillable-printable-accounting-ledger-pdf";
const KNOWN_ARTICLE_SLUG = "bookkeeping-made-simple-without-expensive-software";
const KNOWN_PAGES_SLUG = "articles"; // renders at /pages/articles

// ── Fast 3G CDP parameters (matches Chrome DevTools "Fast 3G" preset) ─────────

const FAST_3G_CONDITIONS = {
  offline: false,
  downloadThroughput: Math.floor((1.6 * 1024 * 1024) / 8), // ≈204 KB/s
  uploadThroughput: Math.floor((750 * 1024) / 8), //  ≈94 KB/s
  latency: 150, // ms
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether the Next.js proxy API is responding.
 * Uses a relative URL so it works with the configured Playwright baseURL and
 * in CI where the baseURL points to the production-built app.
 */
async function isApiAvailable(request: APIRequestContext): Promise<boolean> {
  try {
    // /api/menuitems supports GET through the Next.js proxy (unlike /api/products/categories
    // which is POST-only on the Next.js side). This endpoint works both locally and in CI.
    const resp = await request.get("/api/menuitems", {
      timeout: 8_000,
    });
    return resp.ok();
  } catch {
    return false;
  }
}

/**
 * Inject a PerformanceObserver that tracks the latest LCP candidate value into
 * window.__lcpValue. Must be called BEFORE page.goto() so the script runs on
 * the very first navigation.
 */
async function injectLCPObserver(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as Record<string, unknown>).__lcpValue = 0;
    try {
      const obs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          (window as unknown as Record<string, unknown>).__lcpValue =
            entries[entries.length - 1].startTime;
        }
      });
      obs.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // LCP PerformanceObserver not supported in this environment
    }
  });
}

/**
 * Read the most-recent LCP value written by the observer.
 * Call after waitForLoadState("networkidle") and a brief settle pause.
 */
async function getLCP(page: Page): Promise<number> {
  // 500 ms settle after networkidle to allow the final LCP entry to be emitted
  await page.waitForTimeout(500);
  return page.evaluate(() => {
    const val = (window as unknown as { __lcpValue?: number }).__lcpValue;
    return typeof val === "number" ? val : 0;
  });
}

interface ImageTiming {
  url: string;
  duration: number;
  transferSize: number;
}

/**
 * Return PerformanceResourceTiming data for image requests.
 * Covers both plain <img> initiators and Next.js /_next/image optimised URLs.
 * Only includes entries with transferSize > 0 (actual network transfer, not
 * cache hits) so timings reflect real download cost.
 */
async function getImageResourceTimings(page: Page): Promise<ImageTiming[]> {
  return page.evaluate((): ImageTiming[] => {
    return (
      performance.getEntriesByType("resource") as PerformanceResourceTiming[]
    )
      .filter(
        (e) =>
          e.transferSize > 0 &&
          (e.initiatorType === "img" ||
            e.name.includes("/_next/image") ||
            /\.(jpg|jpeg|png|webp|avif|gif)(\?|$)/i.test(e.name)),
      )
      .map((e) => ({
        url: e.name,
        duration: e.duration,
        transferSize: e.transferSize,
      }));
  });
}

interface ImageInfo {
  src: string;
  complete: boolean;
  naturalWidth: number;
}

/**
 * Return completion state for every <img> element on the page.
 * Filters out data: URIs (inline SVGs, base64 blur placeholders) and blank
 * src attributes – these are not loaded images and would produce false
 * positives in integrity checks.
 */
async function getAllImages(page: Page): Promise<ImageInfo[]> {
  return page.evaluate((): ImageInfo[] =>
    Array.from(document.querySelectorAll("img"))
      .map((img) => ({
        src: img.currentSrc || img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
      }))
      .filter((info) => info.src !== "" && !info.src.startsWith("data:")),
  );
}

/**
 * Enable Fast 3G network throttling for the given page via CDP.
 * Returns the CDP session so the caller can detach it in afterEach.
 */
async function setupFast3G(page: Page): Promise<CDPSession> {
  const session = await page.context().newCDPSession(page);
  await session.send("Network.emulateNetworkConditions", FAST_3G_CONDITIONS);
  return session;
}

/**
 * Remove throttling and detach the CDP session.
 * Silently ignores errors in case the test failed before setup completed.
 */
async function teardownThrottling(session: CDPSession | null): Promise<void> {
  if (!session) return;
  try {
    await session.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });
    await session.detach();
  } catch {
    // Session may already be detached if the test failed mid-flight
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 – Image integrity (unthrottled)
//
// Validates that every <img> on each page actually loads.
// Failures here indicate: broken image paths, wrong domain in next.config.ts
// remotePatterns, misconfigured next/image, or a missing static file.
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Image integrity (unthrottled)", () => {
  test("home page – all images decoded", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const images = await getAllImages(page);
    expect(
      images.length,
      "Home page should render at least one <img>",
    ).toBeGreaterThan(0);

    const broken = images.filter(
      (img) => !img.complete || img.naturalWidth === 0,
    );
    expect(
      broken,
      `Broken images on home:\n${broken.map((i) => `  ${i.src}`).join("\n")}`,
    ).toHaveLength(0);
  });

  test("home page – LCP within unthrottled threshold", async ({ page }) => {
    await injectLCPObserver(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const lcp = await getLCP(page);
    test.info().annotations.push({
      type: "LCP (unthrottled)",
      description: `${lcp.toFixed(0)} ms  (threshold: ${LCP_UNTHROTTLED_MS} ms)`,
    });
    expect(
      lcp,
      `LCP ${lcp.toFixed(0)} ms exceeds threshold of ${LCP_UNTHROTTLED_MS} ms`,
    ).toBeLessThan(LCP_UNTHROTTLED_MS);
  });

  test("templates index – LCP within unthrottled threshold", async ({
    page,
    request,
  }) => {
    const available = await isApiAvailable(request);
    test.skip(!available, API_SKIP_MESSAGE);

    await injectLCPObserver(page);
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const lcp = await getLCP(page);
    test.info().annotations.push({
      type: "LCP (unthrottled)",
      description: `${lcp.toFixed(0)} ms`,
    });
    expect(lcp).toBeLessThan(LCP_UNTHROTTLED_MS);
  });

  test("templates index – all images decoded", async ({ page, request }) => {
    const available = await isApiAvailable(request);
    test.skip(!available, API_SKIP_MESSAGE);

    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const images = await getAllImages(page);
    const broken = images.filter(
      (img) => !img.complete || img.naturalWidth === 0,
    );
    expect(
      broken,
      `Broken images on /templates:\n${broken.map((i) => `  ${i.src}`).join("\n")}`,
    ).toHaveLength(0);
  });

  test("category page – all images decoded", async ({ page, request }) => {
    const available = await isApiAvailable(request);
    test.skip(!available, API_SKIP_MESSAGE);

    await page.goto(`/templates/${KNOWN_CATEGORY_SLUG}`);
    await page.waitForLoadState("networkidle");

    const images = await getAllImages(page);
    const broken = images.filter(
      (img) => !img.complete || img.naturalWidth === 0,
    );
    expect(
      broken,
      `Broken images on /templates/${KNOWN_CATEGORY_SLUG}:\n${broken.map((i) => `  ${i.src}`).join("\n")}`,
    ).toHaveLength(0);
  });

  test("product detail page – all images decoded", async ({
    page,
    request,
  }) => {
    const available = await isApiAvailable(request);
    test.skip(!available, API_SKIP_MESSAGE);

    await page.goto(`/templates/${KNOWN_CATEGORY_SLUG}/${KNOWN_PRODUCT_SLUG}`);
    await page.waitForLoadState("networkidle");

    const images = await getAllImages(page);
    const broken = images.filter(
      (img) => !img.complete || img.naturalWidth === 0,
    );
    expect(
      broken,
      `Broken images on product detail:\n${broken.map((i) => `  ${i.src}`).join("\n")}`,
    ).toHaveLength(0);
  });

  test("article page – all images decoded", async ({ page }) => {
    await page.goto(`/${KNOWN_ARTICLE_SLUG}`);
    await page.waitForLoadState("networkidle");

    const images = await getAllImages(page);
    const broken = images.filter(
      (img) => !img.complete || img.naturalWidth === 0,
    );
    expect(
      broken,
      `Broken images on /${KNOWN_ARTICLE_SLUG}:\n${broken.map((i) => `  ${i.src}`).join("\n")}`,
    ).toHaveLength(0);
  });

  test("CMS pages section – all images decoded", async ({ page, request }) => {
    const available = await isApiAvailable(request);
    test.skip(!available, API_SKIP_MESSAGE);

    await page.goto(`/pages/${KNOWN_PAGES_SLUG}`);
    await page.waitForLoadState("networkidle");

    const images = await getAllImages(page);
    const broken = images.filter(
      (img) => !img.complete || img.naturalWidth === 0,
    );
    expect(
      broken,
      `Broken images on /pages/${KNOWN_PAGES_SLUG}:\n${broken.map((i) => `  ${i.src}`).join("\n")}`,
    ).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 – Image performance under Fast 3G throttling
//
// These tests expose image file-size problems: an unoptimised PNG will fail
// here even though the server is localhost. This is the most reliable LOCAL
// signal for real-world image performance issues before they reach staging.
//
// The test timeout is raised to 60 s to accommodate the throttled downloads.
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Image performance – Fast 3G", () => {
  let cdpSession: CDPSession | null = null;

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60_000);
    cdpSession = await setupFast3G(page);
  });

  test.afterEach(async () => {
    await teardownThrottling(cdpSession);
    cdpSession = null;
  });

  test("home page – LCP within throttled threshold", async ({ page }) => {
    await injectLCPObserver(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const lcp = await getLCP(page);
    test.info().annotations.push({
      type: "LCP (Fast 3G)",
      description: `${lcp.toFixed(0)} ms  (threshold: ${LCP_THROTTLED_MS} ms)`,
    });
    expect(
      lcp,
      `LCP ${lcp.toFixed(0)} ms exceeds Fast 3G threshold of ${LCP_THROTTLED_MS} ms`,
    ).toBeLessThan(LCP_THROTTLED_MS);
  });

  test("home page – each image transfers within per-image budget", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const timings = await getImageResourceTimings(page);
    test.info().annotations.push({
      type: "Image timings (Fast 3G)",
      description: timings
        .map((t) => {
          let pathname = t.url;
          try {
            pathname = new URL(t.url).pathname.slice(0, 70);
          } catch {
            /* non-absolute url, use as-is */
          }
          return `${pathname}: ${t.duration.toFixed(0)} ms (${(t.transferSize / 1024).toFixed(1)} KB)`;
        })
        .join(" | "),
    });

    const slow = timings.filter((t) => t.duration > IMAGE_TRANSFER_MS);
    expect(
      slow,
      `Images exceeding ${IMAGE_TRANSFER_MS} ms on home:\n${slow.map((t) => `  ${t.url} — ${t.duration.toFixed(0)} ms`).join("\n")}`,
    ).toHaveLength(0);
  });

  test("templates index – LCP within throttled threshold", async ({
    page,
    request,
  }) => {
    const available = await isApiAvailable(request);
    test.skip(!available, API_SKIP_MESSAGE);

    await injectLCPObserver(page);
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const lcp = await getLCP(page);
    test.info().annotations.push({
      type: "LCP (Fast 3G)",
      description: `${lcp.toFixed(0)} ms`,
    });
    expect(lcp).toBeLessThan(LCP_THROTTLED_MS);
  });

  test("templates index – product images transfer within per-image budget", async ({
    page,
    request,
  }) => {
    const available = await isApiAvailable(request);
    test.skip(!available, API_SKIP_MESSAGE);

    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const timings = await getImageResourceTimings(page);
    const slow = timings.filter((t) => t.duration > IMAGE_TRANSFER_MS);
    expect(
      slow,
      `Images exceeding ${IMAGE_TRANSFER_MS} ms on /templates:\n${slow.map((t) => `  ${t.url} — ${t.duration.toFixed(0)} ms`).join("\n")}`,
    ).toHaveLength(0);
  });

  test("category page – LCP within throttled threshold", async ({
    page,
    request,
  }) => {
    const available = await isApiAvailable(request);
    test.skip(!available, API_SKIP_MESSAGE);

    await injectLCPObserver(page);
    await page.goto(`/templates/${KNOWN_CATEGORY_SLUG}`);
    await page.waitForLoadState("networkidle");

    const lcp = await getLCP(page);
    test.info().annotations.push({
      type: "LCP (Fast 3G)",
      description: `${lcp.toFixed(0)} ms`,
    });
    expect(lcp).toBeLessThan(LCP_THROTTLED_MS);
  });

  test("product detail page – LCP within throttled threshold", async ({
    page,
    request,
  }) => {
    const available = await isApiAvailable(request);
    test.skip(!available, API_SKIP_MESSAGE);

    await injectLCPObserver(page);
    await page.goto(`/templates/${KNOWN_CATEGORY_SLUG}/${KNOWN_PRODUCT_SLUG}`);
    await page.waitForLoadState("networkidle");

    const lcp = await getLCP(page);
    test.info().annotations.push({
      type: "LCP (Fast 3G)",
      description: `${lcp.toFixed(0)} ms`,
    });
    expect(lcp).toBeLessThan(LCP_THROTTLED_MS);
  });

  test("article page – LCP within throttled threshold", async ({ page }) => {
    await injectLCPObserver(page);
    await page.goto(`/${KNOWN_ARTICLE_SLUG}`);
    await page.waitForLoadState("networkidle");

    const lcp = await getLCP(page);
    test.info().annotations.push({
      type: "LCP (Fast 3G)",
      description: `${lcp.toFixed(0)} ms`,
    });
    expect(lcp).toBeLessThan(LCP_THROTTLED_MS);
  });

  test("CMS pages section – LCP within throttled threshold", async ({
    page,
    request,
  }) => {
    const available = await isApiAvailable(request);
    test.skip(!available, API_SKIP_MESSAGE);

    await injectLCPObserver(page);
    await page.goto(`/pages/${KNOWN_PAGES_SLUG}`);
    await page.waitForLoadState("networkidle");

    const lcp = await getLCP(page);
    test.info().annotations.push({
      type: "LCP (Fast 3G)",
      description: `${lcp.toFixed(0)} ms`,
    });
    expect(lcp).toBeLessThan(LCP_THROTTLED_MS);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 – Dynamically discovered pages (requires live API proxy)
//
// Fetches the first available category, product, and menu-item slugs from the
// running Next.js proxy API and tests those pages. This catches regressions on
// content added or changed after the last static build.
//
// All tests in this suite are skipped (not failed) if the API is unavailable.
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Image performance – dynamically discovered pages", () => {
  let discoveredCategorySlug = "";
  let discoveredProductSlug = "";
  let discoveredMenuItemSlug = "";
  let apiOnline = false;
  let cdpSession: CDPSession | null = null;

  test.beforeAll(async ({ request }) => {
    try {
      // Use /api/menuitems as the health-check – it supports GET via the proxy.
      const menuResp = await request.get("/api/menuitems", { timeout: 8_000 });
      if (!menuResp.ok()) return;

      apiOnline = true;

      const items: Array<{ title?: string }> = await menuResp.json();
      if (Array.isArray(items) && items.length > 0) {
        const slugify = (s: string) =>
          s
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        discoveredMenuItemSlug = slugify(items[0].title ?? "");
      }

      // Categories need a POST to the proxy – call the backend directly via
      // the same base URL that Next.js uses (NEXT_PUBLIC_API_URL or localhost:5117).
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5117";
      const catResp = await request.get(
        `${apiBase.replace(/\/api$/, "")}/api/products/categories`,
        { timeout: 8_000 },
      );
      if (catResp.ok()) {
        const json = await catResp.json();
        // The backend wraps results in { data: [...] }
        const categories: Array<{
          slug?: string;
          items?: Array<{ slug?: string }>;
        }> = Array.isArray(json) ? json : (json?.data ?? []);
        if (Array.isArray(categories) && categories.length > 0) {
          discoveredCategorySlug = categories[0].slug ?? "";
          if (
            Array.isArray(categories[0].items) &&
            categories[0].items.length > 0
          ) {
            discoveredProductSlug = categories[0].items[0].slug ?? "";
          }
        }
      }
    } catch {
      apiOnline = false;
    }
  });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60_000);
    cdpSession = await setupFast3G(page);
  });

  test.afterEach(async () => {
    await teardownThrottling(cdpSession);
    cdpSession = null;
  });

  test("discovered category – LCP and integrity under Fast 3G", async ({
    page,
  }) => {
    test.skip(!apiOnline || !discoveredCategorySlug, API_SKIP_MESSAGE);

    await injectLCPObserver(page);
    await page.goto(`/templates/${discoveredCategorySlug}`);
    await page.waitForLoadState("networkidle");

    const lcp = await getLCP(page);
    test.info().annotations.push({
      type: "LCP (Fast 3G)",
      description: `${lcp.toFixed(0)} ms  — /templates/${discoveredCategorySlug}`,
    });
    expect(lcp).toBeLessThan(LCP_THROTTLED_MS);

    const images = await getAllImages(page);
    const broken = images.filter(
      (img) => !img.complete || img.naturalWidth === 0,
    );
    expect(
      broken,
      `Broken: ${broken.map((i) => i.src).join(", ")}`,
    ).toHaveLength(0);
  });

  test("discovered product – LCP and integrity under Fast 3G", async ({
    page,
  }) => {
    test.skip(
      !apiOnline || !discoveredCategorySlug || !discoveredProductSlug,
      API_SKIP_MESSAGE,
    );

    await injectLCPObserver(page);
    await page.goto(
      `/templates/${discoveredCategorySlug}/${discoveredProductSlug}`,
    );
    await page.waitForLoadState("networkidle");

    const lcp = await getLCP(page);
    test.info().annotations.push({
      type: "LCP (Fast 3G)",
      description: `${lcp.toFixed(0)} ms  — /templates/${discoveredCategorySlug}/${discoveredProductSlug}`,
    });
    expect(lcp).toBeLessThan(LCP_THROTTLED_MS);

    const images = await getAllImages(page);
    const broken = images.filter(
      (img) => !img.complete || img.naturalWidth === 0,
    );
    expect(
      broken,
      `Broken: ${broken.map((i) => i.src).join(", ")}`,
    ).toHaveLength(0);
  });

  test("discovered menu-item page – LCP and integrity under Fast 3G", async ({
    page,
  }) => {
    test.skip(!apiOnline || !discoveredMenuItemSlug, API_SKIP_MESSAGE);

    await injectLCPObserver(page);
    await page.goto(`/pages/${discoveredMenuItemSlug}`);
    await page.waitForLoadState("networkidle");

    const lcp = await getLCP(page);
    test.info().annotations.push({
      type: "LCP (Fast 3G)",
      description: `${lcp.toFixed(0)} ms  — /pages/${discoveredMenuItemSlug}`,
    });
    expect(
      lcp,
      `LCP ${lcp.toFixed(0)} ms exceeds threshold of ${LCP_THROTTLED_MS} ms`,
    ).toBeLessThan(LCP_THROTTLED_MS);

    const images = await getAllImages(page);
    const broken = images.filter(
      (img) => !img.complete || img.naturalWidth === 0,
    );
    expect(
      broken,
      `Broken: ${broken.map((i) => i.src).join(", ")}`,
    ).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 – Self-validation of the integrity helper
//
// Injects a known-404 image URL into a live page and confirms getAllImages
// reports it with naturalWidth === 0. This test proves the integrity checks
// above are not silently passing broken images due to a helper bug.
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Self-validation – integrity helper", () => {
  test("getAllImages correctly identifies a broken image (naturalWidth === 0)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Append a broken image to the DOM
    const probeSelector = "playwright-broken-img-probe-12345";
    await page.evaluate((id: string) => {
      const img = document.createElement("img");
      img.id = id;
      img.src = "/playwright-probe-image-does-not-exist-12345.png";
      document.body.appendChild(img);
    }, probeSelector);

    // Allow time for the failed image request to complete
    await page.waitForTimeout(1_500);

    const images = await getAllImages(page);
    const probe = images.find((i) =>
      i.src.includes("playwright-probe-image-does-not-exist"),
    );

    expect(
      probe,
      "Probe image should appear in getAllImages output",
    ).toBeDefined();
    expect(
      probe?.naturalWidth,
      "Broken image must report naturalWidth === 0; integrity helper is not detecting broken images",
    ).toBe(0);
  });
});
