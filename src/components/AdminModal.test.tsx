import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AdminModal from "./AdminModal";

describe("AdminModal", () => {
  it("renders children when open", () => {
    render(
      <AdminModal isOpen={true} onCloseAction={vi.fn()} title="Test modal">
        <p>Modal content</p>
      </AdminModal>,
    );
    expect(screen.getByText("Modal content")).toBeInTheDocument();
    expect(screen.getByText("Test modal")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(
      <AdminModal isOpen={false} onCloseAction={vi.fn()} title="Test modal">
        <p>Modal content</p>
      </AdminModal>,
    );
    expect(screen.queryByText("Modal content")).not.toBeInTheDocument();
  });

  it("has correct ARIA attributes", () => {
    render(
      <AdminModal isOpen={true} onCloseAction={vi.fn()} title="Accessible dialog">
        <p>Content</p>
      </AdminModal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby");
    const labelId = dialog.getAttribute("aria-labelledby")!;
    expect(document.getElementById(labelId)?.textContent).toBe(
      "Accessible dialog",
    );
  });

  it("calls onCloseAction when ESC is pressed", async () => {
    const user = userEvent.setup();
    const onCloseAction = vi.fn();

    render(
      <AdminModal isOpen={true} onCloseAction={onCloseAction} title="ESC test">
        <p>Content</p>
      </AdminModal>,
    );

    await user.keyboard("{Escape}");
    expect(onCloseAction).toHaveBeenCalledTimes(1);
  });

  it("calls onCloseAction when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onCloseAction = vi.fn();

    render(
      <AdminModal isOpen={true} onCloseAction={onCloseAction} title="Close button test">
        <p>Content</p>
      </AdminModal>,
    );

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onCloseAction).toHaveBeenCalledTimes(1);
  });

  it("calls onCloseAction when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onCloseAction = vi.fn();

    render(
      <AdminModal isOpen={true} onCloseAction={onCloseAction} title="Backdrop test">
        <p>Content</p>
      </AdminModal>,
    );

    const backdrop = screen
      .getByRole("dialog")
      .closest(".admin-modal-backdrop")!;
    await user.click(backdrop);
    expect(onCloseAction).toHaveBeenCalledTimes(1);
  });

  it("does not call onCloseAction when modal content is clicked", async () => {
    const user = userEvent.setup();
    const onCloseAction = vi.fn();

    render(
      <AdminModal isOpen={true} onCloseAction={onCloseAction} title="Content click test">
        <p>Inner content</p>
      </AdminModal>,
    );

    await user.click(screen.getByText("Inner content"));
    expect(onCloseAction).not.toHaveBeenCalled();
  });

  it("applies the size class", () => {
    render(
      <AdminModal isOpen={true} onCloseAction={vi.fn()} title="Large modal" size="lg">
        <p>Content</p>
      </AdminModal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("admin-modal-lg");
  });
});
