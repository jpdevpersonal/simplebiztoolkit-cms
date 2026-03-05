import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EditorControlEditor from "./EditorControlEditor";
import { clientApi } from "../../../lib/clientApi";

const routerPush = vi.fn();
const routerRefresh = vi.fn();

vi.mock("next/navigation", async () => {
  const actual =
    await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: routerPush,
      refresh: routerRefresh,
      back: vi.fn(),
    }),
  };
});

vi.mock("@/lib/clientApi", () => ({
  clientApi: {
    createEditorControl: vi.fn(),
    updateEditorControl: vi.fn(),
    deleteEditorControl: vi.fn(),
    getEditorControls: vi.fn(),
  },
}));

describe("EditorControlEditor", () => {
  it("calls createEditorControl with correct payload in create mode", async () => {
    vi.mocked(clientApi.createEditorControl).mockResolvedValueOnce({
      id: "new-1",
      name: "My CTA Preset",
      blockType: "cta",
      status: "draft",
    });

    render(<EditorControlEditor isNew />);

    // Fill in name
    const nameInput = screen.getByPlaceholderText(
      "e.g. Product CTA, Info Callout",
    );
    fireEvent.change(nameInput, { target: { value: "My CTA Preset" } });

    // Change block type to "cta"
    const blockSelect = screen.getByDisplayValue("Paragraph");
    fireEvent.change(blockSelect, { target: { value: "cta" } });

    // Submit
    const submitBtn = screen.getByRole("button", {
      name: /Create Editor Control/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(clientApi.createEditorControl).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "My CTA Preset",
          blockType: "cta",
          status: "draft",
        }),
      );
    });

    expect(routerPush).toHaveBeenCalledWith(
      "/admin/editor-controls/new-1/edit",
    );
  });

  it("calls updateEditorControl in edit mode", async () => {
    vi.mocked(clientApi.updateEditorControl).mockResolvedValueOnce({
      id: "existing-1",
      name: "Updated Control",
      blockType: "callout",
      status: "approved",
    });

    render(
      <EditorControlEditor
        control={{
          id: "existing-1",
          name: "Old Name",
          blockType: "callout",
          status: "draft",
          calloutTone: "info",
        }}
      />,
    );

    // Change name
    const nameInput = screen.getByDisplayValue("Old Name");
    fireEvent.change(nameInput, { target: { value: "Updated Control" } });

    // Change status to approved
    const statusSelect = screen.getByDisplayValue("Draft");
    fireEvent.change(statusSelect, { target: { value: "approved" } });

    // Submit
    const submitBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(clientApi.updateEditorControl).toHaveBeenCalledWith(
        "existing-1",
        expect.objectContaining({
          name: "Updated Control",
          blockType: "callout",
          status: "approved",
          calloutTone: "info",
        }),
      );
    });
  });
});
