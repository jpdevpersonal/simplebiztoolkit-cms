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
});
