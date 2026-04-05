import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HtmlCodeEditor from "./HtmlCodeEditor";

describe("HtmlCodeEditor", () => {
  it("renders without internal scrollbars and exposes a bottom scrollbar", () => {
    render(
      <HtmlCodeEditor
        value={'<div class="hero">\n  <p>Hello</p>\n</div>'}
        onChange={vi.fn()}
        rows={8}
      />,
    );

    expect(screen.getByTestId("html-code-editor-highlight")).toHaveStyle({
      overflow: "hidden",
    });
    expect(screen.getByTestId("html-code-editor-textarea")).toHaveStyle({
      overflowY: "hidden",
      resize: "none",
    });
    expect(
      screen.getByTestId("html-code-editor-highlight-content"),
    ).toHaveStyle({ minWidth: "100%" });
    expect(
      screen.getByTestId("html-code-editor-horizontal-scrollbar"),
    ).toBeInTheDocument();
  });

  it("syncs the highlighted content with the bottom horizontal scrollbar", () => {
    render(
      <HtmlCodeEditor
        value={
          '<div class="hero">\n  <p>This is a much longer line for horizontal scroll testing</p>\n</div>'
        }
        onChange={vi.fn()}
        rows={8}
      />,
    );

    const textarea = screen.getByTestId("html-code-editor-textarea");
    const highlightContent = screen.getByTestId(
      "html-code-editor-highlight-content",
    );
    const scrollbar = screen.getByTestId(
      "html-code-editor-horizontal-scrollbar",
    );

    Object.defineProperty(scrollbar, "scrollLeft", {
      configurable: true,
      value: 24,
    });

    fireEvent.scroll(scrollbar);

    expect(highlightContent).toHaveStyle({
      transform: "translateX(-24px)",
    });
    expect(textarea.scrollLeft).toBe(24);
  });

  it("shrinks to the formatted content height instead of leaving blank space", () => {
    const originalScrollHeightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "scrollHeight",
    );
    let currentScrollHeight = 260;

    Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        return currentScrollHeight;
      },
    });

    try {
      const { rerender } = render(
        <HtmlCodeEditor
          value={"<div>\n  <p>Long block</p>\n  <p>Still long</p>\n</div>"}
          onChange={vi.fn()}
          rows={8}
        />,
      );

      expect(screen.getByTestId("html-code-editor-textarea")).toHaveStyle({
        height: "260px",
      });

      currentScrollHeight = 132;

      rerender(
        <HtmlCodeEditor
          value={"<div>\n  <p>Short</p>\n</div>"}
          onChange={vi.fn()}
          rows={8}
        />,
      );

      expect(screen.getByTestId("html-code-editor-textarea")).toHaveStyle({
        height: "132px",
      });
    } finally {
      if (originalScrollHeightDescriptor) {
        Object.defineProperty(
          HTMLTextAreaElement.prototype,
          "scrollHeight",
          originalScrollHeightDescriptor,
        );
      } else {
        delete (
          HTMLTextAreaElement.prototype as HTMLTextAreaElement & {
            scrollHeight?: number;
          }
        ).scrollHeight;
      }
    }
  });
});
