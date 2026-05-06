import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { encodeRelatedLinksItems } from "@/lib/relatedLinks";

import ProductDetailClient from "./ProductDetailClient";

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    alt,
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const product = {
  id: "template-1",
  title: "Budget Planner",
  slug: "budget-planner",
  problem: "<h1>Plan with confidence</h1><p>Track your monthly spend.</p>",
  description: "",
  bullets: ["Monthly tracker", "Spending summary"],
  image: "/images/planner.png",
  etsyUrl: "https://etsy.example.com/listing/1",
  price: "$9.99",
  categoryId: "cat-1",
  status: "published" as const,
};

describe("ProductDetailClient", () => {
  it("renders a single page-level H1", () => {
    const { container } = render(<ProductDetailClient product={product} />);

    const headings = container.querySelectorAll("h1");

    expect(headings).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Budget Planner",
    );
  });

  it("demotes rich-content H1 headings inside the product description", () => {
    const { container } = render(<ProductDetailClient product={product} />);

    const descriptionHeading = screen.getByRole("heading", {
      level: 2,
      name: "Plan with confidence",
    });

    expect(descriptionHeading.tagName).toBe("H2");
    expect(
      container.querySelectorAll(".product-description-content h1"),
    ).toHaveLength(0);
  });

  it("extracts related links from description HTML and renders them beneath the image column", () => {
    const relatedLinksHtml = `<section data-sbt-block="related-links" data-title="Related to this" data-items="${encodeRelatedLinksItems(
      [
        {
          uid: "link-1",
          kind: "page",
          refId: "page-1",
          href: "/tax-guide",
          destinationTitle: "Tax guide",
          label: "Tax planning guide",
          imageId: null,
          imageUrl: null,
          imageAlt: null,
        },
      ],
    )}"></section>`;

    const { container } = render(
      <ProductDetailClient
        product={{
          ...product,
          description: `<p>Track your monthly spend.</p>${relatedLinksHtml}`,
        }}
      />,
    );

    const relatedLink = screen.getByRole("link", {
      name: "Tax planning guide",
    });

    expect(relatedLink).toHaveAttribute("href", "/tax-guide");
    expect(relatedLink).not.toHaveAttribute("target");
    expect(
      container.querySelector(
        ".product-detail-media-column .related-links-block--template",
      ),
    ).not.toBeNull();
    expect(
      container.querySelector(
        ".product-description-content a[href='/tax-guide']",
      ),
    ).toBeNull();
  });
});
