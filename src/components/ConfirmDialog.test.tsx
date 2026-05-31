import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConfirmDialog from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Delete item"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByText("Delete item")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the title and message when open", () => {
    render(
      <ConfirmDialog
        isOpen
        title="Delete page"
        message="This permanently removes the page."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete page")).toBeInTheDocument();
    expect(
      screen.getByText("This permanently removes the page."),
    ).toBeInTheDocument();
  });

  it("uses default Confirm/Cancel labels when none are provided", () => {
    render(
      <ConfirmDialog
        isOpen
        title="Confirm action"
        message="Proceed?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("renders custom confirm and cancel labels", () => {
    render(
      <ConfirmDialog
        isOpen
        title="Delete topic"
        message="This cannot be undone."
        confirmLabel="Delete topic"
        cancelLabel="Keep topic"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Delete topic" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Keep topic" }),
    ).toBeInTheDocument();
  });

  it("calls onConfirm when the confirm button is clicked", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Delete item"
        message="Are you sure?"
        confirmLabel="Delete item"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete item" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Delete item"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onCancel when Escape is pressed", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Delete item"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables both actions and shows working text while busy", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        busy
        title="Delete item"
        message="Are you sure?"
        confirmLabel="Delete item"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    const confirmButton = screen.getByRole("button", { name: "Working…" });
    const cancelButton = screen.getByRole("button", { name: "Cancel" });

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();

    fireEvent.click(confirmButton);
    fireEvent.click(cancelButton);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("applies destructive styling to the confirm button when destructive", () => {
    render(
      <ConfirmDialog
        isOpen
        destructive
        title="Delete item"
        message="Are you sure?"
        confirmLabel="Delete item"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Delete item" })).toHaveClass(
      "admin-btn-danger",
    );
  });

  it("uses the save styling on the confirm button when not destructive", () => {
    render(
      <ConfirmDialog
        isOpen
        title="Confirm action"
        message="Proceed?"
        confirmLabel="Proceed"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Proceed" })).toHaveClass(
      "admin-btn-save",
    );
  });
});
