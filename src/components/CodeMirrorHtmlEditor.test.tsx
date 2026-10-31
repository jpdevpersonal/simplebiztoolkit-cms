import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CodeMirrorHtmlEditor from "./CodeMirrorHtmlEditor";

vi.mock("codemirror", () => {
  throw new Error("CodeMirror unavailable");
});

vi.mock("@/components/HtmlCodeEditor", () => ({
  __esModule: true,
  default: ({ value, ariaLabel }: any) => (
    <textarea aria-label={ariaLabel} value={value} readOnly />
  ),
}));

describe("CodeMirrorHtmlEditor", () => {
  it("shows the built-in editor while loading and keeps it if CodeMirror fails", async () => {
    render(
      <CodeMirrorHtmlEditor
        value="<p>Hello</p>"
        onChange={vi.fn()}
        ariaLabel="Description"
      />,
    );

    expect(screen.getByLabelText("Description")).toHaveValue("<p>Hello</p>");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });
});
