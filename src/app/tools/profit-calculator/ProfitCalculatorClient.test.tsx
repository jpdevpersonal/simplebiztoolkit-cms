import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import ProfitCalculatorClient from "./ProfitCalculatorClient";

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
    writable: true,
  });
});

describe("ProfitCalculatorClient", () => {
  it("links the Tools breadcrumb back to the pages-level Tools listing", () => {
    render(<ProfitCalculatorClient />);

    expect(screen.getByRole("link", { name: "Tools" })).toHaveAttribute(
      "href",
      "/pages/tools",
    );
  });

  it("renders the primary Calculate call to action", () => {
    render(<ProfitCalculatorClient />);

    expect(
      screen.getByRole("button", { name: "Calculate" }),
    ).toBeInTheDocument();
  });

  it("starts with the results placeholder visible and results hidden", () => {
    const { container } = render(<ProfitCalculatorClient />);

    expect(
      (container.querySelector("#results-placeholder") as HTMLElement).hidden,
    ).toBe(false);
    expect(
      (container.querySelector("#results-content") as HTMLElement).hidden,
    ).toBe(true);
  });

  it("calculates profit and fees from a selling price", () => {
    const { container } = render(<ProfitCalculatorClient />);

    fireEvent.input(container.querySelector("#sellingPrice") as HTMLElement, {
      target: { value: "20" },
    });
    fireEvent.input(container.querySelector("#materials") as HTMLElement, {
      target: { value: "5" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

    expect(
      (container.querySelector("#results-content") as HTMLElement).hidden,
    ).toBe(false);
    // Defaults: 6.5% + 4% of 20 + 0.20 fixed + 0.16 listing = 2.46 total fees.
    expect(container.querySelector("#r-fees")?.textContent).toBe("£2.46");
    // Profit = 20 - 5 (materials) - 2.46 fees = 12.54.
    expect(container.querySelector("#r-profit")?.textContent).toBe("£12.54");
    expect(
      (container.querySelector("#scenario-section") as HTMLElement).hidden,
    ).toBe(false);
  });

  it("surfaces a validation error when calculating with no selling price", () => {
    const { container } = render(<ProfitCalculatorClient />);

    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

    const errEl = container.querySelector("#form-error") as HTMLElement;
    expect(errEl.hidden).toBe(false);
    expect(errEl.textContent).toMatch(/selling price greater than 0/i);
    expect(
      (container.querySelector("#results-content") as HTMLElement).hidden,
    ).toBe(true);
  });

  it("switches the payment and listing fees to the region rates on currency change", () => {
    const { container } = render(<ProfitCalculatorClient />);

    const currency = container.querySelector("#currency") as HTMLSelectElement;
    const paymentPct = container.querySelector(
      "#paymentPct",
    ) as HTMLInputElement;
    const paymentFixed = container.querySelector(
      "#paymentFixed",
    ) as HTMLInputElement;
    const listingFee = container.querySelector(
      "#listingFee",
    ) as HTMLInputElement;

    // Defaults are the UK / GBP rates.
    expect(paymentPct.value).toBe("4");
    expect(paymentFixed.value).toBe("0.20");
    expect(listingFee.value).toBe("0.16");

    // Switching to USD applies the US Etsy rates.
    fireEvent.change(currency, { target: { value: "$" } });
    expect(paymentPct.value).toBe("3");
    expect(paymentFixed.value).toBe("0.25");
    expect(listingFee.value).toBe("0.20");

    // Switching to EUR applies the Eurozone Etsy rates.
    fireEvent.change(currency, { target: { value: "€" } });
    expect(paymentPct.value).toBe("4");
    expect(paymentFixed.value).toBe("0.30");
    expect(listingFee.value).toBe("0.18");
  });
});
