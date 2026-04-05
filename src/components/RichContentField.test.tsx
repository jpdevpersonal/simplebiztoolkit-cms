import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RichContentField from "./RichContentField";

vi.mock("@/components/TiptapEditor", () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    placeholder,
    minHeight,
    onSave,
    onPreview,
    policy,
  }: any) => (
    <div
      data-testid="tiptap-editor"
      data-min-height={String(minHeight)}
      data-placeholder={placeholder}
      data-policy={policy ? "present" : "missing"}
    >
      <span>{value}</span>
      <button type="button" onClick={() => onChange("<p>Updated</p>")}>
        Emit change
      </button>
      {onSave && (
        <button type="button" onClick={() => void onSave()}>
          Save from editor
        </button>
      )}
      {onPreview && (
        <button type="button" onClick={onPreview}>
          Preview from editor
        </button>
      )}
    </div>
  ),
}));

vi.mock("@/components/HtmlCodeEditor", () => ({
  __esModule: true,
  default: ({ value, onChange, rows, required, ariaLabel }: any) => (
    <div
      data-testid="html-code-editor"
      data-rows={String(rows)}
      data-required={required ? "yes" : "no"}
      data-aria-label={ariaLabel}
    >
      <span>{value}</span>
      <button type="button" onClick={() => onChange("<p>Code edit</p>")}>
        Emit code change
      </button>
    </div>
  ),
}));

describe("RichContentField", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders in HTML mode by default and forwards textarea changes", () => {
    const onChange = vi.fn();

    render(
      <RichContentField
        label="Body"
        value="<p>Hello</p>"
        onChange={onChange}
        storageKey="body-mode"
        required
        hint="Plain HTML hint"
      />,
    );

    expect(screen.getByText("Body *")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("<p>Hello</p>");
    expect(screen.getByText("Plain HTML hint")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Format HTML" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("tiptap-editor")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "<p>Changed</p>" },
    });

    expect(onChange).toHaveBeenCalledWith("<p>Changed</p>");
  });

  it("restores tiptap mode from localStorage and renders editor-only controls", async () => {
    const onChange = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onPreview = vi.fn();

    localStorage.setItem("body-mode", "tiptap");

    render(
      <RichContentField
        label="Body"
        value="<p>Hello</p>"
        onChange={onChange}
        storageKey="body-mode"
        required
        placeholder="Write here"
        minHeight={320}
        onSave={onSave}
        onPreview={onPreview}
        policy={{ allowedBlocks: ["paragraph"] } as any}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
    });

    expect(screen.getByTestId("tiptap-editor")).toHaveAttribute(
      "data-placeholder",
      "Write here",
    );
    expect(screen.getByTestId("tiptap-editor")).toHaveAttribute(
      "data-min-height",
      "320",
    );
    expect(screen.getByTestId("tiptap-editor")).toHaveAttribute(
      "data-policy",
      "present",
    );
    expect(screen.getByDisplayValue("<p>Hello</p>")).toHaveAttribute(
      "type",
      "hidden",
    );
    expect(
      screen.getByText("Rich-text editor — content is saved as HTML."),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Emit change" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Save from editor" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Preview from editor" }),
    );

    expect(onChange).toHaveBeenCalledWith("<p>Updated</p>");
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it("switches modes and persists the selection", async () => {
    const user = userEvent.setup();
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    render(
      <RichContentField
        label="Body"
        value="<p>Hello</p>"
        onChange={vi.fn()}
        storageKey="body-mode"
      />,
    );

    await user.click(screen.getByRole("button", { name: "✦ Tiptap" }));

    expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
    expect(setItemSpy).toHaveBeenCalledWith("body-mode", "tiptap");

    await user.click(screen.getByRole("button", { name: "HTML" }));

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(setItemSpy).toHaveBeenCalledWith("body-mode", "html");
  });

  it("formats compact HTML on demand when enabled", async () => {
    const user = userEvent.setup();

    function TestHost() {
      const [value, setValue] = useState(
        "<div><p>Hello</p><p><strong>World</strong></p></div>",
      );

      return (
        <RichContentField
          label="Body"
          value={value}
          onChange={setValue}
          storageKey="body-mode"
          enableHtmlFormatting
        />
      );
    }

    render(<TestHost />);

    await user.click(screen.getByRole("button", { name: "Format HTML" }));

    expect(screen.getByRole("textbox")).toHaveValue(
      [
        "<div>",
        "  <p>Hello</p>",
        "  <p><strong>World</strong></p>",
        "</div>",
      ].join("\n"),
    );
  });

  it("renders the code-style HTML editor when requested", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <RichContentField
        label="Body"
        value="<p>Hello</p>"
        onChange={onChange}
        storageKey="body-mode"
        enableHtmlFormatting
        htmlEditorVariant="code"
        required
        htmlRows={14}
      />,
    );

    expect(screen.getByTestId("html-code-editor")).toBeInTheDocument();
    expect(screen.getByTestId("html-code-editor")).toHaveAttribute(
      "data-rows",
      "14",
    );
    expect(screen.getByTestId("html-code-editor")).toHaveAttribute(
      "data-required",
      "yes",
    );
    expect(screen.getByTestId("html-code-editor")).toHaveAttribute(
      "data-aria-label",
      "Body",
    );

    await user.click(screen.getByRole("button", { name: "Emit code change" }));

    expect(onChange).toHaveBeenCalledWith("<p>Code edit</p>");
  });

  it("formats HTML when switching from tiptap mode when enabled", async () => {
    const user = userEvent.setup();
    localStorage.setItem("body-mode", "tiptap");

    function TestHost() {
      const [value, setValue] = useState(
        "<div><p>Hello</p><p><strong>World</strong></p></div>",
      );

      return (
        <RichContentField
          label="Body"
          value={value}
          onChange={setValue}
          storageKey="body-mode"
          enableHtmlFormatting
          formatHtmlOnModeSwitch
        />
      );
    }

    render(<TestHost />);

    await waitFor(() => {
      expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "HTML" }));

    expect(screen.getByRole("textbox")).toHaveValue(
      [
        "<div>",
        "  <p>Hello</p>",
        "  <p><strong>World</strong></p>",
        "</div>",
      ].join("\n"),
    );
  });

  it("keeps HTML mode when storage access fails or contains an invalid value", async () => {
    const user = userEvent.setup();

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("unavailable");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    render(
      <RichContentField
        label="Body"
        value="<p>Hello</p>"
        onChange={vi.fn()}
        storageKey="body-mode"
      />,
    );

    expect(screen.getByRole("textbox")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "✦ Tiptap" }));

    expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
  });

  it("ignores invalid stored modes", async () => {
    localStorage.setItem("body-mode", "markdown");

    render(
      <RichContentField
        label="Body"
        value="<p>Hello</p>"
        onChange={vi.fn()}
        storageKey="body-mode"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("tiptap-editor")).not.toBeInTheDocument();
  });
});
