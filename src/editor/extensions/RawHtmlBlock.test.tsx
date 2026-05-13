/**
 * Round-trip tests for RawHtmlBlock.
 *
 * These confirm that the editor preserves complex layout HTML byte-for-byte
 * (modulo predictable whitespace) when content moves from raw HTML →
 * Tiptap document → raw HTML again. Without this guarantee, switching the
 * admin UI to Tiptap silently destroys hero sections, SVG decorations,
 * inline-styled layout divs, etc.
 */

import { generateHTML, generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";
import { RawHtmlBlock, unwrapRawHtmlPlaceholders } from "./RawHtmlBlock";
import { PreserveAttributes } from "./PreserveAttributes";

const EXTENSIONS = [StarterKit, RawHtmlBlock, PreserveAttributes];

function roundTrip(html: string): string {
  const json = generateJSON(html, EXTENSIONS);
  const out = generateHTML(json, EXTENSIONS);
  return unwrapRawHtmlPlaceholders(out);
}

function normalise(html: string): string {
  // Tolerate whitespace differences introduced by the HTML parser:
  //  - inter-tag whitespace (indentation between sibling block elements)
  //    is collapsed away by ProseMirror's DOM parser before our `getAttrs`
  //    sees the element, so we can't preserve original indentation.
  //  - we still verify that styles, attributes, tag structure, and text
  //    content are byte-identical.
  return html.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();
}

describe("RawHtmlBlock round-trip", () => {
  it("preserves a top-level <section> with inline styles and nested children", () => {
    const input = `<section style="display:grid;padding:2rem;background:#fff;">
  <h1 style="color:#0d5c3f;">Hero heading</h1>
  <p style="font-size:1rem;">Lead copy.</p>
</section>`;

    const output = roundTrip(input);
    expect(normalise(output)).toBe(normalise(input));
  });

  it("preserves <aside> blocks containing inline SVG", () => {
    const input = `<aside style="display:grid;gap:0.6rem;">
  <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
  <span style="font-weight:600;">Badge</span>
</aside>`;

    const output = roundTrip(input);
    expect(normalise(output)).toBe(normalise(input));
  });

  it("captures a styled <div> as one opaque block (no descent into children)", () => {
    const input = `<div style="background:#f1f3f6;padding:8px;"><div style="font-weight:700;">Nested</div></div>`;

    const output = roundTrip(input);
    expect(normalise(output)).toBe(normalise(input));
  });

  it("preserves mixed siblings: paragraph + raw block + paragraph", () => {
    const input = `<p>Before</p><section style="margin:1rem 0;"><h2>Inside</h2></section><p>After</p>`;

    const output = roundTrip(input);
    // Sibling order is preserved and paragraphs round-trip through StarterKit.
    expect(output).toContain("<p>Before</p>");
    expect(output).toContain('<section style="margin:1rem 0;">');
    expect(output).toContain("<h2>Inside</h2>");
    expect(output).toContain("</section>");
    expect(output).toContain("<p>After</p>");
    expect(output.indexOf("Before")).toBeLessThan(output.indexOf("Inside"));
    expect(output.indexOf("Inside")).toBeLessThan(output.indexOf("After"));
  });

  it("preserves the attached hero example byte-for-byte (modulo whitespace)", () => {
    // A compressed but representative slice of the user-supplied attachment.
    const input = `<section aria-labelledby="hero-heading" style="display:grid;grid-template-columns:1.15fr 1fr;gap:2.25rem;padding:2.5rem 2.25rem;background:radial-gradient(600px 320px at 100% 0%, rgba(26,127,90,0.08), transparent 65%),linear-gradient(135deg,#ffffff 0%,#fbfdfc 100%);border:1px solid #e2e5ea;border-radius:22px;"><div aria-hidden="true" style="position:absolute;inset:0;"></div><div style="display:grid;gap:1.1rem;"><h1 id="hero-heading" style="font-size:clamp(1.85rem,3.2vw + 0.6rem,2.6rem);color:#414556;">Turn Your Etsy CSV Into a Clear <span style="background:linear-gradient(135deg,#1a7f5a 0%,#0d5c3f 100%);-webkit-background-clip:text;color:transparent;">Monthly Profit Report</span></h1><a href="#uploadCard" style="background:linear-gradient(135deg,#1a7f5a 0%,#0d5c3f 100%);color:#fff;">Upload Your Etsy CSV<svg width="16" height="16" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line></svg></a></div></section>`;

    const output = roundTrip(input);
    expect(normalise(output)).toBe(normalise(input));
  });

  it("does not opaque-wrap bare <div> elements without styles", () => {
    const input = `<div><p>plain content</p></div>`;

    const output = roundTrip(input);
    // Bare divs are not in our schema; the inner paragraph survives and the
    // wrapper is dropped (StarterKit default behavior). We assert the
    // important invariant: no `data-raw-html-block` placeholder leaks out.
    expect(output).not.toContain("data-raw-html-block");
    expect(output).toContain("<p>plain content</p>");
  });

  it("does not leak placeholder markers into the final HTML", () => {
    const input = `<section style="padding:1rem;"><p>hi</p></section>`;
    const output = roundTrip(input);
    expect(output).not.toContain("data-raw-html-block");
    expect(output).not.toContain("data-html=");
  });
});

describe("unwrapRawHtmlPlaceholders", () => {
  it("is a no-op when no placeholder is present", () => {
    expect(unwrapRawHtmlPlaceholders("<p>hello</p>")).toBe("<p>hello</p>");
  });

  it("decodes a placeholder produced by encodeURIComponent", () => {
    const raw = '<section style="color:red">hi</section>';
    const placeholder = `<div data-raw-html-block="true" data-html="${encodeURIComponent(raw)}"></div>`;
    expect(unwrapRawHtmlPlaceholders(placeholder)).toContain(
      '<section style="color:red">',
    );
    expect(unwrapRawHtmlPlaceholders(placeholder)).not.toContain(
      "data-raw-html-block",
    );
  });
});
