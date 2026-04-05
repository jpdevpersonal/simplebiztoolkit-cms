import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContentCta } from "./ContentCta";

vi.mock("@/components/EtsyCtaButton", () => ({
  default: () => <span>Etsy CTA Button</span>,
}));

describe("ContentCta", () => {
  it("renders default content", () => {
    render(<ContentCta />);
    expect(screen.getByText("Ready to get started?")).toBeInTheDocument();
  });

  it("renders optional links and disclosure", () => {
    render(
      <ContentCta
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
      screen.getByRole("link", { name: "See all templates" }),
    ).toHaveAttribute("href", "/templates");
    expect(screen.getByText("Etsy CTA Button")).toBeInTheDocument();
    expect(screen.getByText("Affiliate disclosure")).toBeInTheDocument();
  });
});
