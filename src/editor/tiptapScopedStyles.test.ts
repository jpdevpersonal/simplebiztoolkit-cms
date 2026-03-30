import { describe, expect, it } from "vitest";
import { getTiptapScopedStyles } from "./tiptapScopedStyles";

describe("getTiptapScopedStyles", () => {
  it("uses the default legacy CTA label and omits the selected border rule", () => {
    const css = getTiptapScopedStyles({ minHeight: 240 });

    expect(css).toContain("min-height: 240px;");
    expect(css).toContain('content: "Legacy CTA block";');
    expect(css).not.toContain(".ProseMirror-selectednode");
  });

  it("supports a custom legacy CTA label and selected border rule", () => {
    const css = getTiptapScopedStyles({
      minHeight: 360,
      legacyCtaLabel: "Archived CTA",
      includeLegacySelectedBorder: true,
    });

    expect(css).toContain("min-height: 360px;");
    expect(css).toContain('content: "Archived CTA";');
    expect(css).toContain(
      '.tiptap .ProseMirror-selectednode[data-component="article-cta"]',
    );
  });
});
