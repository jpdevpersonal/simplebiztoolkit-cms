import { describe, expect, it } from "vitest";
import {
  sanitizeHtml,
  stripHtml,
  truncateHtml,
  validateHtmlTags,
} from "./sanitize";

describe("sanitize", () => {
  it("returns an empty string for empty HTML", () => {
    expect(sanitizeHtml("")).toBe("");
  });

  it("removes unsafe markup while preserving allowed content", () => {
    const sanitized = sanitizeHtml(
      '<p>Hello</p><script>alert("xss")</script><a href="https://example.com">safe</a>',
    );

    expect(sanitized).toContain("<p>Hello</p>");
    expect(sanitized).toContain('href="https://example.com"');
    expect(sanitized).not.toContain("<script>");
  });

  it("validates HTML by comparing the sanitized output", () => {
    expect(validateHtmlTags("<p>Safe</p>")).toBe(true);
    expect(validateHtmlTags('<p onclick="alert(1)">Unsafe</p>')).toBe(false);
  });

  it("strips HTML tags from rich content", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe(
      "Hello world",
    );
  });

  it("truncates long HTML content and leaves short content unchanged", () => {
    expect(truncateHtml("<p>Hello</p>", 20)).toBe("<p>Hello</p>");
    expect(truncateHtml("<p>Hello world</p>", 5)).toBe("Hello...");
  });

  it("preserves inline style attributes on layout elements", () => {
    const sanitized = sanitizeHtml(
      `<section style="display:grid;padding:2rem;background:#fff;"><h2 style="color:#0d5c3f;">Hero</h2></section>`,
    );

    expect(sanitized).toContain(
      `style="display:grid;padding:2rem;background:#fff;"`,
    );
    expect(sanitized).toContain(`<section`);
    expect(sanitized).toContain(`style="color:#0d5c3f;"`);
  });

  it("preserves authored style blocks for responsive CMS layouts", () => {
    const sanitized = sanitizeHtml(
      `<style>@media(min-width:860px){.sbth-wrap{grid-template-columns:1.15fr 1fr!important;background:url(javascript:alert(1));}}</style><section class="sbth-wrap">Hero</section>`,
    );

    expect(sanitized).toContain("<style>");
    expect(sanitized).toContain("@media(min-width:860px)");
    expect(sanitized).toContain(".sbth-wrap");
    expect(sanitized).toContain(`class="sbth-wrap"`);
    expect(sanitized).not.toContain("javascript:");
  });

  it("preserves inline SVG with its presentation attributes", () => {
    const sanitized = sanitizeHtml(
      `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    );

    expect(sanitized).toContain("<svg");
    expect(sanitized).toContain(`viewBox="0 0 24 24"`);
    expect(sanitized).toContain(`stroke-width="3"`);
    expect(sanitized).toContain(`<polyline`);
    expect(sanitized).toContain(`points="20 6 9 17 4 12"`);
  });

  it("strips javascript: URIs from style attributes", () => {
    const sanitized = sanitizeHtml(
      `<div style="background:url(javascript:alert(1));color:red;">hi</div>`,
    );

    expect(sanitized).not.toContain("javascript:");
    // The benign portion may or may not survive depending on DOMPurify's
    // CSS handling; the critical invariant is that the JS scheme is gone.
  });

  it("preserves aria-* and role attributes for accessibility", () => {
    const sanitized = sanitizeHtml(
      `<section aria-labelledby="hero" role="banner"><h2 id="hero">Hi</h2></section>`,
    );

    expect(sanitized).toContain(`aria-labelledby="hero"`);
    expect(sanitized).toContain(`role="banner"`);
  });
});
