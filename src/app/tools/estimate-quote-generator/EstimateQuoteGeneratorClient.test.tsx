import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import EstimateQuoteGeneratorClient from "./EstimateQuoteGeneratorClient";

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
    writable: true,
  });
});

describe("EstimateQuoteGeneratorClient", () => {
  it("links the Tools breadcrumb back to the pages-level Tools listing", () => {
    render(<EstimateQuoteGeneratorClient />);

    expect(screen.getByRole("link", { name: "Tools" })).toHaveAttribute(
      "href",
      "/pages/tools",
    );
  });

  it("renders the Estimate / Quote document type toggle", () => {
    render(<EstimateQuoteGeneratorClient />);

    expect(screen.getByText("Estimate")).toBeInTheDocument();
    expect(screen.getByText("Quote")).toBeInTheDocument();
  });

  it("shows a privacy reminder below the page intro", () => {
    render(<EstimateQuoteGeneratorClient />);

    expect(screen.getByLabelText(/Privacy reminder/i)).toBeInTheDocument();
    expect(
      screen.getByText(/cleared when this page session closes/i),
    ).toBeInTheDocument();
  });

  it("seeds an initial line item row and updates totals on input", async () => {
    const { container } = render(<EstimateQuoteGeneratorClient />);

    const descInput = container.querySelector(
      "#itemsBody .li-desc",
    ) as HTMLInputElement | null;
    const qtyInput = container.querySelector(
      "#itemsBody .li-qty",
    ) as HTMLInputElement | null;
    const priceInput = container.querySelector(
      "#itemsBody .li-price",
    ) as HTMLInputElement | null;

    expect(descInput).not.toBeNull();
    expect(qtyInput).not.toBeNull();
    expect(priceInput).not.toBeNull();

    fireEvent.input(descInput!, { target: { value: "Logo design" } });
    fireEvent.input(qtyInput!, { target: { value: "2" } });
    fireEvent.input(priceInput!, { target: { value: "150" } });

    const grand = container.querySelector("#sumGrand");
    expect(grand?.textContent).toBe("$300.00");
  });

  it("shows validation errors when downloading without required fields", () => {
    const { container } = render(<EstimateQuoteGeneratorClient />);

    fireEvent.click(screen.getByRole("button", { name: /Download PDF/i }));

    const errEl = container.querySelector("#validationError") as HTMLElement;
    expect(errEl).not.toBeNull();
    expect(errEl.style.display).not.toBe("none");
    expect(errEl.textContent).toMatch(/Enter a company name/i);
    expect(errEl.textContent).toMatch(/client name or client business name/i);
  });

  it("adds and removes line item rows", () => {
    const { container } = render(<EstimateQuoteGeneratorClient />);

    fireEvent.click(screen.getByRole("button", { name: /Add line item/i }));
    expect(container.querySelectorAll("#itemsBody tr")).toHaveLength(2);

    const removeBtn = container.querySelector(
      "#itemsBody tr:last-child .remove-row",
    ) as HTMLButtonElement;
    fireEvent.click(removeBtn);
    expect(container.querySelectorAll("#itemsBody tr")).toHaveLength(1);
  });

  it("clears only tool-prefixed storage keys and form values when the page session closes", () => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("tool-estimate-draft", "private quote");
    localStorage.setItem("unrelated-site-setting", "keep me");
    sessionStorage.setItem("tool-estimate-draft", "private quote");
    sessionStorage.setItem("unrelated-session-flag", "keep me");

    const { container } = render(<EstimateQuoteGeneratorClient />);

    const bizNameInput = container.querySelector(
      "#bizName",
    ) as HTMLInputElement;
    fireEvent.input(bizNameInput, { target: { value: "Private Company" } });

    fireEvent(window, new Event("pagehide"));

    // Tool-prefixed keys must be removed.
    expect(localStorage.getItem("tool-estimate-draft")).toBeNull();
    expect(sessionStorage.getItem("tool-estimate-draft")).toBeNull();
    // Unrelated keys belonging to the rest of the site must be preserved.
    expect(localStorage.getItem("unrelated-site-setting")).toBe("keep me");
    expect(sessionStorage.getItem("unrelated-session-flag")).toBe("keep me");
    expect(bizNameInput.value).toBe("");
    expect(container.querySelectorAll("#itemsBody tr")).toHaveLength(0);
  });

  it("logs a warning when tool-prefixed storage cannot be cleared", () => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("tool-estimate-draft", "private quote");
    sessionStorage.setItem("tool-estimate-draft", "private quote");

    const storageError = new Error("storage blocked");
    const removeSpy = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw storageError;
      });
    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    try {
      render(<EstimateQuoteGeneratorClient />);

      fireEvent(window, new Event("pagehide"));

      expect(warnSpy).toHaveBeenCalledWith(
        "Estimate quote generator could not clear local browser storage.",
        storageError,
      );
      expect(warnSpy).toHaveBeenCalledWith(
        "Estimate quote generator could not clear session browser storage.",
        storageError,
      );
    } finally {
      removeSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });
});
