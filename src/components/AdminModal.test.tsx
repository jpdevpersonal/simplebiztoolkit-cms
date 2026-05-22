import React from "react";
import { render, screen } from "@testing-library/react";
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
      <AdminModal
        isOpen={true}
        onCloseAction={vi.fn()}
        title="Accessible dialog"
      >
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
      <AdminModal
        isOpen={true}
        onCloseAction={onCloseAction}
        title="Close button test"
      >
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
      <AdminModal
        isOpen={true}
        onCloseAction={onCloseAction}
        title="Backdrop test"
      >
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
      <AdminModal
        isOpen={true}
        onCloseAction={onCloseAction}
        title="Content click test"
      >
        <p>Inner content</p>
      </AdminModal>,
    );

    await user.click(screen.getByText("Inner content"));
    expect(onCloseAction).not.toHaveBeenCalled();
  });

  it("applies the size class", () => {
    render(
      <AdminModal
        isOpen={true}
        onCloseAction={vi.fn()}
        title="Large modal"
        size="lg"
      >
        <p>Content</p>
      </AdminModal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("admin-modal-lg");
  });

  it("applies the xl size class", () => {
    render(
      <AdminModal
        isOpen={true}
        onCloseAction={vi.fn()}
        title="XL modal"
        size="xl"
      >
        <p>Content</p>
      </AdminModal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("admin-modal-xl");
  });

  it("moves focus into the dialog and traps tab navigation", async () => {
    const user = userEvent.setup();

    render(
      <AdminModal isOpen={true} onCloseAction={vi.fn()} title="Focus test">
        <button type="button">First action</button>
        <button type="button">Second action</button>
      </AdminModal>,
    );

    const closeButton = screen.getByRole("button", { name: "Close" });
    const firstAction = screen.getByRole("button", { name: "First action" });
    const secondAction = screen.getByRole("button", {
      name: "Second action",
    });

    expect(closeButton).toHaveFocus();

    await user.tab();
    expect(firstAction).toHaveFocus();

    await user.tab();
    expect(secondAction).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it("shift+tab wraps focus backward within the dialog", async () => {
    const user = userEvent.setup();

    render(
      <AdminModal isOpen={true} onCloseAction={vi.fn()} title="Shift tab test">
        <button type="button">Action A</button>
        <button type="button">Action B</button>
      </AdminModal>,
    );

    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton).toHaveFocus();

    // Shift+Tab from the first focusable (closeButton) should wrap to last
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    const actionB = screen.getByRole("button", { name: "Action B" });
    expect(actionB).toHaveFocus();
  });

  it("restores focus to the previously focused element when closed", async () => {
    const user = userEvent.setup();

    function ModalHarness() {
      const [isOpen, setIsOpen] = React.useState(false);

      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>
            Open modal
          </button>
          <AdminModal
            isOpen={isOpen}
            onCloseAction={() => setIsOpen(false)}
            title="Restore focus test"
          >
            <p>Modal content</p>
          </AdminModal>
        </>
      );
    }

    render(<ModalHarness />);

    const openButton = screen.getByRole("button", { name: "Open modal" });
    await user.click(openButton);
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(openButton).toHaveFocus();
  });
});
