import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LockedBlocksDemoPage from "./page";

const blockEditorMock = vi.fn();

vi.mock("@/editor/BlockEditor", () => ({
  __esModule: true,
  default: (props: any) => {
    blockEditorMock(props);

    return (
      <div>
        <div data-testid="block-editor">Mock block editor</div>
        <button
          type="button"
          onClick={() =>
            props.onChange({
              json: { type: "doc", content: [{ type: "paragraph" }] },
              html: '<section data-locked="true">locked</section>',
            })
          }
        >
          Emit output
        </button>
      </div>
    );
  },
}));

describe("LockedBlocksDemoPage", () => {
  beforeEach(() => {
    blockEditorMock.mockClear();
  });

  it("renders the demo instructions and passes the locked-blocks seed content to BlockEditor", () => {
    render(<LockedBlocksDemoPage />);

    expect(
      screen.getByRole("heading", { name: "Locked Blocks Demo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Things to try:")).toBeInTheDocument();
    expect(screen.getByTestId("block-editor")).toBeInTheDocument();
    expect(blockEditorMock).toHaveBeenCalled();
    expect(blockEditorMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        minHeight: 500,
        onChange: expect.any(Function),
        initialJson: expect.objectContaining({ type: "doc" }),
      }),
    );
  });

  it("toggles the exported JSON and HTML inspector when editor output exists", async () => {
    const user = userEvent.setup();

    render(<LockedBlocksDemoPage />);

    await user.click(
      screen.getByRole("button", { name: /Show exported JSON \/ HTML/i }),
    );
    expect(screen.queryByText("TipTap JSON")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Emit output" }));

    expect(screen.getByText("TipTap JSON")).toBeInTheDocument();
    expect(screen.getByText(/"type": "doc"/)).toBeInTheDocument();
    expect(
      screen.getByText(/<section data-locked="true">locked<\/section>/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Hide exported JSON \/ HTML/i }),
    ).toBeInTheDocument();
  });
});
