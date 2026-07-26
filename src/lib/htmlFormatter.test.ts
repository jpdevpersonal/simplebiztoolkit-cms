import { describe, expect, it } from "vitest";
import { compactHtmlForStorage, formatHtmlForEditing } from "./htmlFormatter";

describe("htmlFormatter", () => {
  it("formats HTML for editing with indentation", () => {
    expect(
      formatHtmlForEditing(
        "<div><p>Hello</p><p><strong>World</strong></p></div>",
      ),
    ).toBe(
      [
        "<div>",
        "  <p>Hello</p>",
        "  <p><strong>World</strong></p>",
        "</div>",
      ].join("\n"),
    );
  });

  it("compacts formatted block HTML for storage", () => {
    expect(
      compactHtmlForStorage(
        [
          "<div>",
          "  <p>Hello</p>",
          "  <p><strong>World</strong></p>",
          "</div>",
        ].join("\n"),
      ),
    ).toBe("<div><p>Hello</p><p><strong>World</strong></p></div>");
  });

  it("preserves inline spaces and preformatted content while compacting", () => {
    expect(
      compactHtmlForStorage(
        "<p>Hello <strong>world</strong> again</p><pre><code>line 1\n  line 2</code></pre>",
      ),
    ).toBe(
      "<p>Hello <strong>world</strong> again</p><pre><code>line 1\n  line 2</code></pre>",
    );
  });

  // ─── Word-wrap behaviour ────────────────────────────────────────────────────

  it("keeps short paragraphs on a single line", () => {
    expect(formatHtmlForEditing("<p>Short text.</p>")).toBe(
      "<p>Short text.</p>",
    );
  });

  it("word-wraps a paragraph whose inline text exceeds 150 characters", () => {
    // Build text that is definitely > 150 chars when combined with the <p> tags
    const words = Array.from({ length: 30 }, (_, i) => `word${i + 1}`);
    const longText = words.join(" ");
    const result = formatHtmlForEditing(`<p>${longText}</p>`);

    // The result must span multiple lines
    const lines = result.split("\n");
    expect(lines.length).toBeGreaterThan(1);

    // Every line must be ≤ 150 characters
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(150);
    }

    // Round-tripping through compactHtmlForStorage must restore the original text
    const compacted = compactHtmlForStorage(result);
    expect(compacted).toBe(`<p>${longText}</p>`);
  });

  it("word-wraps a bare text node longer than 150 characters", () => {
    const words = Array.from({ length: 30 }, (_, i) => `word${i + 1}`);
    const longText = words.join(" ");
    const result = formatHtmlForEditing(longText);

    const lines = result.split("\n");
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(150);
    }
  });

  it("does not word-wrap content inside <pre> blocks", () => {
    const longLine = "x".repeat(200);
    const html = `<pre><code>${longLine}</code></pre>`;
    const result = formatHtmlForEditing(html);
    // The long line must be preserved verbatim inside <pre>
    expect(result).toContain(longLine);
  });

  it("falls back to block layout when an inlined element would exceed 150 characters", () => {
    const words = Array.from({ length: 20 }, (_, i) => `word${i + 1}`);
    const longText = words.join(" ");
    // A div containing a paragraph whose inline form would be > 150 chars
    const html = `<div><p>${longText}</p></div>`;
    const result = formatHtmlForEditing(html);

    // Every line must be ≤ 150 characters
    for (const line of result.split("\n")) {
      expect(line.length).toBeLessThanOrEqual(150);
    }

    // Content must survive a compact round-trip
    expect(compactHtmlForStorage(result)).toBe(`<div><p>${longText}</p></div>`);
  });
});
