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

  describe("Math correctness — profit mode", () => {
    it("breaks down the Etsy fee components individually", () => {
      const { container } = render(<ProfitCalculatorClient />);

      fireEvent.input(container.querySelector("#sellingPrice") as HTMLElement, {
        target: { value: "20" },
      });
      fireEvent.input(container.querySelector("#materials") as HTMLElement, {
        target: { value: "5" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

      // transaction = 20 × 6.5% = £1.30
      expect(container.querySelector("#r-transaction")?.textContent).toBe(
        "£1.30",
      );
      // payment processing = 20 × 4% + £0.20 fixed = £1.00
      expect(container.querySelector("#r-payment")?.textContent).toBe("£1.00");
      // listing fee = £0.16 (GBP default)
      expect(container.querySelector("#r-listing")?.textContent).toBe("£0.16");
      // offsite ads = 0% (default off)
      expect(container.querySelector("#r-offsite")?.textContent).toBe("£0.00");
    });

    it("computes profit margin and markup percentages", () => {
      const { container } = render(<ProfitCalculatorClient />);

      fireEvent.input(container.querySelector("#sellingPrice") as HTMLElement, {
        target: { value: "20" },
      });
      fireEvent.input(container.querySelector("#materials") as HTMLElement, {
        target: { value: "5" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

      // profit = £12.54; margin = 12.54 / 20 × 100 = 62.7%
      expect(container.querySelector("#r-margin")?.textContent).toBe("62.7%");
      // markup = 12.54 / 5 × 100 = 250.8%
      expect(container.querySelector("#r-markup")?.textContent).toBe("250.8%");
    });

    it("sums all five cost components into total product cost", () => {
      const { container } = render(<ProfitCalculatorClient />);

      fireEvent.input(container.querySelector("#sellingPrice") as HTMLElement, {
        target: { value: "50" },
      });
      fireEvent.input(container.querySelector("#materials") as HTMLElement, {
        target: { value: "5" },
      });
      fireEvent.input(container.querySelector("#packaging") as HTMLElement, {
        target: { value: "3" },
      });
      fireEvent.input(container.querySelector("#labour") as HTMLElement, {
        target: { value: "8" },
      });
      fireEvent.input(container.querySelector("#postage") as HTMLElement, {
        target: { value: "4" },
      });
      fireEvent.input(container.querySelector("#other") as HTMLElement, {
        target: { value: "2" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

      // 5 + 3 + 8 + 4 + 2 = £22.00
      expect(container.querySelector("#r-cost")?.textContent).toBe("£22.00");
      // profit = 50 – 22 – (3.25 + 2.20 + 0.16) = £22.39
      expect(container.querySelector("#r-profit")?.textContent).toBe("£22.39");
    });

    it("applies the offsite-ads fee at the configured percentage", () => {
      const { container } = render(<ProfitCalculatorClient />);

      fireEvent.input(container.querySelector("#sellingPrice") as HTMLElement, {
        target: { value: "40" },
      });
      fireEvent.input(container.querySelector("#materials") as HTMLElement, {
        target: { value: "10" },
      });
      fireEvent.input(container.querySelector("#offsitePct") as HTMLElement, {
        target: { value: "12" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

      // offsite = 40 × 12% = £4.80
      expect(container.querySelector("#r-offsite")?.textContent).toBe("£4.80");
      // total fees = 2.60 + 1.80 + 0.16 + 4.80 = £9.36
      expect(container.querySelector("#r-fees")?.textContent).toBe("£9.36");
      // profit = 40 – 10 – 9.36 = £20.64
      expect(container.querySelector("#r-profit")?.textContent).toBe("£20.64");
    });

    it("flags negative profit and margin with the value-negative CSS class", () => {
      const { container } = render(<ProfitCalculatorClient />);

      fireEvent.input(container.querySelector("#sellingPrice") as HTMLElement, {
        target: { value: "10" },
      });
      fireEvent.input(container.querySelector("#materials") as HTMLElement, {
        target: { value: "30" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

      // profit = 10 – 30 – 1.41 = -£21.41
      const profitEl = container.querySelector("#r-profit") as HTMLElement;
      expect(profitEl.textContent).toBe("-£21.41");
      expect(profitEl.classList.contains("value-negative")).toBe(true);
      // margin = -21.41 / 10 × 100 = -214.1%
      const marginEl = container.querySelector("#r-margin") as HTMLElement;
      expect(marginEl.textContent).toBe("-214.1%");
      expect(marginEl.classList.contains("value-negative")).toBe(true);
    });

    it("calculates break-even and target monthly sales counts", () => {
      const { container } = render(<ProfitCalculatorClient />);

      fireEvent.input(container.querySelector("#sellingPrice") as HTMLElement, {
        target: { value: "20" },
      });
      fireEvent.input(container.querySelector("#materials") as HTMLElement, {
        target: { value: "5" },
      });
      fireEvent.input(container.querySelector("#monthlyFixed") as HTMLElement, {
        target: { value: "100" },
      });
      fireEvent.input(
        container.querySelector("#targetMonthly") as HTMLElement,
        { target: { value: "500" } },
      );
      fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

      // profit ≈ £12.54; ceil(100 / 12.54) = 8
      expect(container.querySelector("#r-breakeven")?.textContent).toBe(
        "8 sales",
      );
      // ceil((500 + 100) / 12.54) = 48
      expect(container.querySelector("#r-target-sales")?.textContent).toBe(
        "48 sales",
      );
    });
  });

  describe("Math correctness — target-profit mode", () => {
    it("derives a selling price that yields exactly the desired profit", () => {
      const { container } = render(<ProfitCalculatorClient />);

      const radio = container.querySelector(
        'input[name="mode"][value="target-profit"]',
      ) as HTMLInputElement;
      fireEvent.click(radio);

      fireEvent.input(
        container.querySelector("#desiredProfit") as HTMLElement,
        { target: { value: "10" } },
      );
      fireEvent.input(container.querySelector("#materials") as HTMLElement, {
        target: { value: "5" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

      // price = (5 + 10 + 0.36) / (1 – 0.105); profit by construction = £10.00
      expect(container.querySelector("#r-profit")?.textContent).toBe("£10.00");
    });
  });

  describe("Math correctness — target-margin mode", () => {
    it("derives a selling price that achieves the desired profit margin", () => {
      const { container } = render(<ProfitCalculatorClient />);

      const radio = container.querySelector(
        'input[name="mode"][value="target-margin"]',
      ) as HTMLInputElement;
      fireEvent.click(radio);

      fireEvent.input(
        container.querySelector("#desiredMargin") as HTMLElement,
        { target: { value: "50" } },
      );
      fireEvent.input(container.querySelector("#materials") as HTMLElement, {
        target: { value: "5" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

      // price = (5 + 0.36) / (1 – 0.105 – 0.50); margin by construction = 50.0%
      expect(container.querySelector("#r-margin")?.textContent).toBe("50.0%");
    });
  });
});
