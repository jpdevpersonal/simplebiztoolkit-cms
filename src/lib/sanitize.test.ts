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
});
