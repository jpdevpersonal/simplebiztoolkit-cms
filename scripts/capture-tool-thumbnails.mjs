// Captures a focused thumbnail for each featured tool - just the tool's own
// "output" widget (a results panel / live document preview / example report
// mockup), not a screenshot of the whole page (no site header, nav,
// breadcrumb, or hero banner). Saved as optimized .webp into
// public/images/tools/featured/.
//
// Requirements: local dev server running on http://localhost:3000
//   npm run dev
//
// Usage:
//   node scripts/capture-tool-thumbnails.mjs
//
// To add a new tool once it has its own /tools/<slug> page, add a capture
// function below (fill in sample data if needed, then screenshot just the
// element that best represents the tool's output) and an entry in TOOLS.

import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.CAPTURE_BASE_URL ?? "http://localhost:3000";
const OUTPUT_DIR = path.resolve(__dirname, "../public/images/tools/featured");

const VIEWPORT = { width: 1600, height: 1600 };
const OUTPUT_MAX_WIDTH = 1000;

async function newPage(browser) {
  return browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });
}

// The site header is `position: fixed`. When Playwright captures an element
// taller than the viewport it scrolls and stitches tiles together, which
// duplicates/ghosts any fixed-position element into the result. Hiding it
// (and the mobile sticky CTA bar) avoids that artifact entirely.
async function hidePageChrome(page) {
  await page.addStyleTag({
    content: ".sb-site-header, .sb-sticky-cta { display: none !important; }",
  });
}

// Builds a clip rect (in viewport coordinates) that starts at the top of
// `containerSelector` and ends just past the bottom of `anchorSelector` -
// i.e. "include everything down to this element, then stop". Used so we
// capture a compact, fully-relevant image instead of a tall card with empty
// placeholder rows or excess whitespace at the bottom.
async function clipToInclude(page, containerSelector, anchorSelector, paddingBottom = 24) {
  const container = page.locator(containerSelector);
  const anchor = page.locator(anchorSelector);
  await container.scrollIntoViewIfNeeded();

  const containerBox = await container.boundingBox();
  const anchorBox = await anchor.boundingBox();
  if (!containerBox || !anchorBox) {
    throw new Error(
      `Could not measure ${containerSelector} / ${anchorSelector}`,
    );
  }

  const height = Math.min(
    containerBox.height,
    anchorBox.y + anchorBox.height - containerBox.y + paddingBottom,
  );

  return {
    x: containerBox.x,
    y: containerBox.y,
    width: containerBox.width,
    height,
  };
}

// Profit Calculator - fill in a realistic example, calculate, then capture
// just the Results card (recommended price + fee/profit breakdown).
async function captureProfitCalculator(browser) {
  const page = await newPage(browser);
  await page.goto(`${BASE_URL}/tools/profit-calculator`, {
    waitUntil: "networkidle",
  });
  await hidePageChrome(page);

  await page.fill("#sellingPrice", "24.99");
  await page.fill("#materials", "4.00");
  await page.fill("#packaging", "1.20");
  await page.fill("#labour", "5.00");
  await page.fill("#postage", "3.50");
  await page.fill("#other", "0.50");
  await page.click('#calc-form button[type="submit"]');
  await page.locator("#results-content").waitFor({ state: "visible" });
  await page.waitForTimeout(300);

  // Stop after the headline + a couple of fee rows - showing all 11 rows
  // would be illegible at thumbnail size and makes the source image far
  // too tall (object-fit: contain would letterbox it down to a sliver).
  const clip = await clipToInclude(page, ".results-card", "#r-payment", 10);
  const buffer = await page.screenshot({ clip });
  await page.close();
  return buffer;
}

// Estimate & Quote PDF Generator - fill in a sample client + line item, then
// capture just the Live Preview document (no form fields).
async function captureEstimateGenerator(browser) {
  const page = await newPage(browser);
  await page.goto(`${BASE_URL}/tools/estimate-quote-generator`, {
    waitUntil: "networkidle",
  });
  await hidePageChrome(page);

  await page.fill("#bizName", "Sunny Studio Co.");
  await page.fill("#clientName", "Maple & Co. Designs");
  await page.fill(".li-desc", "Logo & brand identity design");
  await page.fill(".li-qty", "1");
  await page.fill(".li-price", "450");
  await page.waitForTimeout(300);

  // Stop right after the Total row so the thumbnail always ends on the
  // document's bottom line instead of being cut off mid-document. Scoped to
  // .preview-wrap because the form column also has its own ".grand" total.
  const clip = await clipToInclude(
    page,
    ".preview-wrap",
    ".preview-wrap .grand",
    28,
  );
  const buffer = await page.screenshot({ clip });
  await page.close();
  return buffer;
}

// Etsy CSV Profit Calculator - the hero already has a static "example output"
// mockup card, so just capture that directly (no form filling needed).
async function captureCsvCalculator(browser) {
  const page = await newPage(browser);
  await page.goto(`${BASE_URL}/tools/csv-profit-calculator`, {
    waitUntil: "networkidle",
  });
  await hidePageChrome(page);

  await page.locator(".hero-preview-frame").waitFor({ state: "visible" });
  await page.waitForTimeout(300);

  const buffer = await page.locator(".hero-preview-frame").screenshot();
  await page.close();
  return buffer;
}

const TOOLS = [
  { slug: "profit-calculator", capture: captureProfitCalculator },
  { slug: "estimate-quote-generator", capture: captureEstimateGenerator },
  { slug: "csv-profit-calculator", capture: captureCsvCalculator },
];

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  try {
    for (const tool of TOOLS) {
      console.log(`Capturing ${tool.slug} ...`);
      const pngBuffer = await tool.capture(browser);

      const outputPath = path.join(OUTPUT_DIR, `${tool.slug}.webp`);
      await sharp(pngBuffer)
        .resize({ width: OUTPUT_MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outputPath);

      console.log(`  -> saved ${path.relative(process.cwd(), outputPath)}`);
    }
  } finally {
    await browser.close();
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
