import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("inserts two spaces when Tab is pressed and prevents focus loss", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <HtmlCodeEditor value="<div></div>" onChange={handleChange} rows={4} />,
    );

    const textarea = screen.getByTestId(
      "html-code-editor-textarea",
    ) as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(0, 0);

    await user.keyboard("{Tab}");

    expect(handleChange).toHaveBeenCalledWith("  <div></div>");
    expect(document.activeElement).toBe(textarea);
  });

  it("auto-indents on Enter to match the current line's leading whitespace", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <HtmlCodeEditor
        value={"<div>\n    <p>Hello</p>"}
        onChange={handleChange}
        rows={4}
      />,
    );

    const textarea = screen.getByTestId(
      "html-code-editor-textarea",
    ) as HTMLTextAreaElement;
    textarea.focus();
    // Position caret at the end of the second line
    const eol = textarea.value.length;
    textarea.setSelectionRange(eol, eol);

    await user.keyboard("{Enter}");

    expect(handleChange).toHaveBeenCalledWith("<div>\n    <p>Hello</p>\n    ");
  });

  it("renders a status bar with line/column information", () => {
    render(
      <HtmlCodeEditor
        value={"<div>\n  <p>Hi</p>\n</div>"}
        onChange={vi.fn()}
        rows={4}
      />,
    );

    const statusbar = screen.getByTestId("html-code-editor-statusbar");
    expect(statusbar).toHaveTextContent(/HTML/);
    expect(statusbar).toHaveTextContent(/Ln 1, Col 1/);
    expect(statusbar).toHaveTextContent(/3 lines/);
  });

  it("toggles word wrap when the Wrap button is pressed", async () => {
    const user = userEvent.setup();
    render(
      <HtmlCodeEditor
        value={"<p>Some long text</p>"}
        onChange={vi.fn()}
        rows={4}
      />,
    );

    const wrapButton = screen.getByRole("button", { name: /wrap/i });
    expect(wrapButton).toHaveAttribute("aria-pressed", "false");
    await user.click(wrapButton);
    expect(wrapButton).toHaveAttribute("aria-pressed", "true");
  });

  it("caps the viewport height so the editor scrolls internally", () => {
    render(
      <HtmlCodeEditor
        value={"<p>x</p>"}
        onChange={vi.fn()}
        rows={4}
        maxHeight={320}
      />,
    );

    expect(screen.getByTestId("html-code-editor-viewport")).toHaveStyle({
      maxHeight: "320px",
      overflowY: "auto",
    });
  });

  it("highlights the gutter line number matching the caret position", () => {
    render(
      <HtmlCodeEditor
        value={"<div>\n  <p>One</p>\n  <p>Two</p>\n</div>"}
        onChange={vi.fn()}
        rows={4}
      />,
    );

    const textarea = screen.getByTestId(
      "html-code-editor-textarea",
    ) as HTMLTextAreaElement;

    // Move caret onto line 3 (after the second "\n")
    const offset = textarea.value.indexOf("Two");
    textarea.focus();
    textarea.setSelectionRange(offset, offset);
    act(() => {
      fireEvent.select(textarea);
    });

    const statusbar = screen.getByTestId("html-code-editor-statusbar");
    expect(statusbar).toHaveTextContent(/Ln 3/);
  });

  it("opens the Find bar with Ctrl+F and cycles through matches", async () => {
    const user = userEvent.setup();
    render(
      <HtmlCodeEditor
        value={"<p>foo</p>\n<p>FOO bar</p>\n<p>foo baz</p>"}
        onChange={vi.fn()}
        rows={4}
      />,
    );

    const textarea = screen.getByTestId(
      "html-code-editor-textarea",
    ) as HTMLTextAreaElement;
    textarea.focus();
    await user.keyboard("{Control>}f{/Control}");

    const findBar = screen.getByTestId("html-code-editor-find");
    expect(findBar).toBeInTheDocument();

    const input = screen.getByLabelText(/Find text in editor/i);
    await user.type(input, "foo");

    // Case-insensitive by default — 3 matches
    expect(findBar).toHaveTextContent(/1 of 3/);

    await user.keyboard("{Enter}");
    expect(findBar).toHaveTextContent(/2 of 3/);

    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(findBar).toHaveTextContent(/1 of 3/);

    // Esc closes the bar
    await user.keyboard("{Escape}");
    expect(
      screen.queryByTestId("html-code-editor-find"),
    ).not.toBeInTheDocument();
  });

  it("respects the match-case toggle in Find", async () => {
    const user = userEvent.setup();
    render(
      <HtmlCodeEditor value={"foo\nFOO\nFoo"} onChange={vi.fn()} rows={4} />,
    );

    const textarea = screen.getByTestId(
      "html-code-editor-textarea",
    ) as HTMLTextAreaElement;
    textarea.focus();
    await user.keyboard("{Control>}f{/Control}");

    const input = screen.getByLabelText(/Find text in editor/i);
    await user.type(input, "foo");

    const findBar = screen.getByTestId("html-code-editor-find");
    expect(findBar).toHaveTextContent(/1 of 3/);

    await user.click(screen.getByRole("button", { name: /match case/i }));
    expect(findBar).toHaveTextContent(/1 of 1/);
  });
});
