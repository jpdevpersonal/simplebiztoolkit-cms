import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArticleCTA } from "./ArticleCTA";

vi.mock("@/components/EtsyCtaButton", () => ({
  default: () => <span>Etsy CTA Button</span>,
}));

describe("ArticleCTA", () => {
  it("renders default content", () => {
    render(<ArticleCTA />);
    expect(screen.getByText("Ready to get started?")).toBeInTheDocument();
  });

  it("renders optional links and disclosure", () => {
    render(
      <ArticleCTA
        primaryLabel="Shop now"
        primaryHref="/shop"
        showHomeLink
        showEtsyLink
        disclosure="Affiliate disclosure"
      />,
    );

    expect(screen.getByRole("link", { name: "Shop now" })).toHaveAttribute(
      "href",
      "/shop",
    );
    expect(
      screen.getByRole("link", { name: "See all products" }),
    ).toHaveAttribute("href", "/products");
    expect(screen.getByText("Etsy CTA Button")).toBeInTheDocument();
    expect(screen.getByText("Affiliate disclosure")).toBeInTheDocument();
  });
});
