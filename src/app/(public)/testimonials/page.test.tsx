import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublicVisibleStatsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/publicStats", () => ({
  getPublicVisibleStats: getPublicVisibleStatsMock,
}));

vi.mock("@/components/ProductGrid", () => ({
  __esModule: true,
  default: () => <div data-testid="popular-templates" />,
}));

vi.mock("@/components/EtsyCtaButton", () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => <span>{label}</span>,
}));

describe("Testimonials page", () => {
  beforeEach(() => {
    vi.resetModules();
    getPublicVisibleStatsMock.mockReset().mockResolvedValue({});
  });

  it("renders current rating, shop highlights, and customer reviews", async () => {
    getPublicVisibleStatsMock.mockResolvedValueOnce({
      rating: "4.8",
      reviews: "1,250",
      sales: "2,500+",
      "star-seller": "Yes",
    });

    const { default: TestimonialsPage } = await import("./page");
    const { container } = render(await TestimonialsPage());

    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Rated 4.8 out of 5" })).toHaveTextContent(
      "★★★★★",
    );
    expect(screen.getByLabelText("Shop highlights")).toHaveTextContent(
      "1,250 reviews",
    );
    expect(screen.getByLabelText("Shop highlights")).toHaveTextContent(
      "2,500+ sales",
    );
    expect(screen.getByLabelText("Shop highlights")).toHaveTextContent(
      "Etsy Star Seller",
    );
    expect(
      screen.getByRole("heading", { name: "Customer reviews" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Diane")).toBeInTheDocument();
    expect(
      container.querySelector(
        'a[href="/templates/accounting-ledger/accounting-ledger-general-ledger-sheets-6-colors"]',
      ),
    ).toHaveTextContent(/Accounting ledger/i);
    expect(screen.getByTestId("popular-templates")).toBeInTheDocument();
  });

  it("shows a fallback rating and omits empty shop highlights", async () => {
    getPublicVisibleStatsMock.mockResolvedValueOnce({
      rating: "not a rating",
      "star-seller": "No",
    });

    const { default: TestimonialsPage } = await import("./page");
    render(await TestimonialsPage());

    expect(
      screen.getByRole("img", { name: "Customer reviews" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Loved by small business owners")).toBeInTheDocument();
    expect(screen.queryByLabelText("Shop highlights")).not.toBeInTheDocument();
  });
});
