import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EditorActions from "./EditorActions";

const noop = vi.fn();

describe("EditorActions", () => {
  describe("create mode", () => {
    it("shows 'Create {entityName}' as the submit label", () => {
      render(
        <EditorActions
          saving={false}
          isCreateMode
          entityName="Product"
          onCancel={noop}
        />,
      );
      expect(
        screen.getByRole("button", { name: "Create Product" }),
      ).toBeTruthy();
    });

    it("shows 'Creating...' while saving", () => {
      render(
        <EditorActions saving isCreateMode entityName="Page" onCancel={noop} />,
      );
      expect(screen.getByRole("button", { name: "Creating..." })).toBeTruthy();
    });

    it("does not render a Delete button in create mode", () => {
      render(
        <EditorActions
          saving={false}
          isCreateMode
          entityName="Product"
          onCancel={noop}
          onDelete={noop}
        />,
      );
      expect(screen.queryByRole("button", { name: /Delete/i })).toBeNull();
    });
  });

  describe("edit mode", () => {
    it("shows 'Save Changes' as the submit label", () => {
      render(
        <EditorActions
          saving={false}
          isCreateMode={false}
          entityName="Product"
          onCancel={noop}
        />,
      );
      expect(screen.getByRole("button", { name: "Save Changes" })).toBeTruthy();
    });

    it("shows 'Saving...' while saving", () => {
      render(
        <EditorActions
          saving
          isCreateMode={false}
          entityName="Page"
          onCancel={noop}
        />,
      );
      expect(screen.getByRole("button", { name: "Saving..." })).toBeTruthy();
    });

    it("renders the Delete button when onDelete is provided", () => {
      render(
        <EditorActions
          saving={false}
          isCreateMode={false}
          entityName="Product"
          onCancel={noop}
          onDelete={noop}
        />,
      );
      expect(
        screen.getByRole("button", { name: "Delete Product" }),
      ).toBeTruthy();
    });

    it("shows 'Deleting...' while deleting", () => {
      render(
        <EditorActions
          saving={false}
          isCreateMode={false}
          entityName="Product"
          onCancel={noop}
          onDelete={noop}
          deleting
        />,
      );
      expect(screen.getByRole("button", { name: "Deleting..." })).toBeTruthy();
    });

    it("does not render a Delete button when onDelete is omitted", () => {
      render(
        <EditorActions
          saving={false}
          isCreateMode={false}
          entityName="Product"
          onCancel={noop}
        />,
      );
      expect(screen.queryByRole("button", { name: /Delete/i })).toBeNull();
    });
  });

  describe("interactions", () => {
    it("calls onCancel when Cancel is clicked", () => {
      const onCancel = vi.fn();
      render(
        <EditorActions
          saving={false}
          isCreateMode
          entityName="Product"
          onCancel={onCancel}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("calls onDelete when Delete button is clicked", () => {
      const onDelete = vi.fn();
      render(
        <EditorActions
          saving={false}
          isCreateMode={false}
          entityName="Page"
          onCancel={noop}
          onDelete={onDelete}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Delete Page" }));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("disables submit and cancel buttons while saving", () => {
      render(
        <EditorActions
          saving
          isCreateMode={false}
          entityName="Product"
          onCancel={noop}
        />,
      );
      expect(
        (screen.getByRole("button", { name: "Saving..." }) as HTMLButtonElement)
          .disabled,
      ).toBe(true);
      expect(
        (screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement)
          .disabled,
      ).toBe(true);
    });

    it("disables the Delete button while deleting", () => {
      render(
        <EditorActions
          saving={false}
          isCreateMode={false}
          entityName="Product"
          onCancel={noop}
          onDelete={noop}
          deleting
        />,
      );
      expect(
        (
          screen.getByRole("button", {
            name: "Deleting...",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });
  });
});
