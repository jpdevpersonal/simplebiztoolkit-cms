import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import ProfitCalculatorClient from "./ProfitCalculatorClient";

const trackPublicEventMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/analytics", () => ({
  trackPublicEvent: (...args: unknown[]) => trackPublicEventMock(...args),
}));

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
    writable: true,
  });
});

afterEach(() => {
  trackPublicEventMock.mockClear();
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
    // Fees: 6.5% + 4% + 0.48% of £20, plus £0.20 + £0.16 = £2.56.
    expect(container.querySelector("#r-fees")?.textContent).toBe("£2.56");
    // Profit = £20 - £5 materials - £2.56 modeled fees = £12.44.
    expect(container.querySelector("#r-profit")?.textContent).toBe("£12.44");
    expect(trackPublicEventMock).toHaveBeenCalledWith("tool_complete", {
      placement: "profit_calculator_result",
      destination_type: "tool",
      tool_name: "profit_calculator",
    });
    expect(
      (container.querySelector("#product-next-step") as HTMLElement).hidden,
    ).toBe(false);
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
    expect(trackPublicEventMock).not.toHaveBeenCalled();
  });

  it("changes rates by seller country, not by currency selection", () => {
    const { container } = render(<ProfitCalculatorClient />);

    const country = container.querySelector(
      "#sellerCountry",
    ) as HTMLSelectElement;
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

    fireEvent.change(country, { target: { value: "US" } });
    expect(paymentPct.value).toBe("3");
    expect(paymentFixed.value).toBe("0.25");
    expect(listingFee.value).toBe("0.2");
    expect(
      (container.querySelector("#regulatoryPct") as HTMLInputElement).value,
    ).toBe("0");
    expect(currency.value).toBe("£");

    fireEvent.change(currency, { target: { value: "$" } });
    expect(paymentPct.value).toBe("3");
    expect(paymentFixed.value).toBe("0.25");
    expect(listingFee.value).toBe("0.2");

    fireEvent.change(country, { target: { value: "custom" } });
    fireEvent.change(currency, { target: { value: "€" } });
    expect(paymentPct.value).toBe("");
    expect(paymentFixed.value).toBe("");
  });

  it("separates item revenue, buyer-paid shipping, postage cost, and fee bases", () => {
    const { container } = render(<ProfitCalculatorClient />);
    fireEvent.input(container.querySelector("#sellingPrice") as HTMLElement, {
      target: { value: "20" },
    });
    fireEvent.input(container.querySelector("#shippingCharged") as HTMLElement, {
      target: { value: "5" },
    });
    fireEvent.input(container.querySelector("#materials") as HTMLElement, {
      target: { value: "5" },
    });
    fireEvent.input(container.querySelector("#postage") as HTMLElement, {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

    // The 10.98% modeled percentage fees use £25 item-plus-shipping revenue.
    expect(container.querySelector("#r-revenue")?.textContent).toBe("£25.00");
    expect(container.querySelector("#r-cost")?.textContent).toBe("£8.00");
    expect(container.querySelector("#r-transaction")?.textContent).toBe("£1.63");
    expect(container.querySelector("#r-payment")?.textContent).toBe("£1.20");
    expect(container.querySelector("#r-regulatory")?.textContent).toBe("£0.12");
    expect(container.querySelector("#r-fees")?.textContent).toBe("£3.11");
    expect(container.querySelector("#r-profit")?.textContent).toBe("£13.90");
    expect(container.querySelector("#r-margin")?.textContent).toBe("55.6%");
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

      // transaction = £20 × 6.5% = £1.30
      expect(container.querySelector("#r-transaction")?.textContent).toBe(
        "£1.30",
      );
      // payment processing = £20 × 4% + £0.20 fixed = £1.00
      expect(container.querySelector("#r-payment")?.textContent).toBe("£1.00");
      // listing fee = £0.16 (GBP default)
      expect(container.querySelector("#r-listing")?.textContent).toBe("£0.16");
      expect(container.querySelector("#r-regulatory")?.textContent).toBe(
        "£0.10",
      );
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

      // Margin uses total revenue; markup uses total product costs.
      expect(container.querySelector("#r-margin")?.textContent).toBe("62.2%");
      expect(container.querySelector("#r-markup")?.textContent).toBe("248.9%");
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
      // Fees are £3.25 + £2.20 + £0.16 + £0.24 regulatory = £5.85.
      expect(container.querySelector("#r-fees")?.textContent).toBe("£5.85");
      expect(container.querySelector("#r-profit")?.textContent).toBe("£22.15");
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
      // Fees include 0.48% regulatory fee on £40 revenue.
      expect(container.querySelector("#r-regulatory")?.textContent).toBe(
        "£0.19",
      );
      expect(container.querySelector("#r-fees")?.textContent).toBe("£9.55");
      expect(container.querySelector("#r-profit")?.textContent).toBe("£20.45");
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

      // Fees are £1.46 after including the 0.48% regulatory fee.
      const profitEl = container.querySelector("#r-profit") as HTMLElement;
      expect(profitEl.textContent).toBe("-£21.46");
      expect(profitEl.classList.contains("value-negative")).toBe(true);
      // margin = -£21.46 / £10 × 100 = -214.6%
      const marginEl = container.querySelector("#r-margin") as HTMLElement;
      expect(marginEl.textContent).toBe("-214.6%");
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

      // profit ≈ £12.44; ceil(100 / 12.44) = 9
      expect(container.querySelector("#r-breakeven")?.textContent).toBe(
        "9 sales",
      );
      // ceil((500 + 100) / 12.44) = 49
      expect(container.querySelector("#r-target-sales")?.textContent).toBe(
        "49 sales",
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

      // Inverse pricing includes the 0.48% UK regulatory percentage fee.
      expect(container.querySelector("#r-profit")?.textContent).toBe("£10.00");
    });

    it("finds a target-profit price after adding shipping revenue and postage cost", () => {
      const { container } = render(<ProfitCalculatorClient />);
      fireEvent.click(
        container.querySelector(
          'input[name="mode"][value="target-profit"]',
        ) as HTMLInputElement,
      );
      fireEvent.input(container.querySelector("#desiredProfit") as HTMLElement, {
        target: { value: "10" },
      });
      fireEvent.input(container.querySelector("#shippingCharged") as HTMLElement, {
        target: { value: "5" },
      });
      fireEvent.input(container.querySelector("#materials") as HTMLElement, {
        target: { value: "5" },
      });
      fireEvent.input(container.querySelector("#postage") as HTMLElement, {
        target: { value: "3" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

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

    it("rejects an unattainable target margin without displaying an invalid result", () => {
      const { container } = render(<ProfitCalculatorClient />);
      fireEvent.click(
        container.querySelector(
          'input[name="mode"][value="target-margin"]',
        ) as HTMLInputElement,
      );
      fireEvent.input(container.querySelector("#desiredMargin") as HTMLElement, {
        target: { value: "95" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

      expect(container.querySelector("#form-error")).toHaveTextContent(
        /impossible/i,
      );
      expect(
        (container.querySelector("#results-content") as HTMLElement).hidden,
      ).toBe(true);
      expect(trackPublicEventMock).not.toHaveBeenCalled();
    });
  });
});
