import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { encodeRelatedLinksItems } from "@/lib/relatedLinks";

import ProductDetailClient from "./ProductDetailClient";

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    alt,
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    priority?: boolean;
    unoptimized?: boolean;
  }) => (
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

  it("falls back to the problem field when description is empty", () => {
    render(
      <ProductDetailClient
        product={{
          ...product,
          description: "",
          problem: "<p>This solves a real problem.</p>",
        }}
      />,
    );

    expect(screen.getByText("This solves a real problem.")).toBeInTheDocument();
  });

  it("uses placeholder image when product has no image", () => {
    const { container } = render(
      <ProductDetailClient product={{ ...product, image: "" }} />,
    );

    const img = container.querySelector(
      ".product-detail-image",
    ) as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain("placeholder-preview.png");
  });

  it("shows 'See our Etsy shop for pricing' when price is absent", () => {
    render(<ProductDetailClient product={{ ...product, price: "" }} />);

    expect(
      screen.getByText("See our Etsy shop for pricing"),
    ).toBeInTheDocument();
  });

  it("renders the 'From' price label when price is provided", () => {
    render(<ProductDetailClient product={{ ...product, price: "$12.99" }} />);

    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("$12.99")).toBeInTheDocument();
  });

  it("renders bullet points from the bullets array", () => {
    render(
      <ProductDetailClient
        product={{ ...product, bullets: ["Feature A", "Feature B"] }}
      />,
    );

    expect(screen.getByText("Feature A")).toBeInTheDocument();
    expect(screen.getByText("Feature B")).toBeInTheDocument();
  });

  it("renders plain text description as paragraphs", () => {
    const { container } = render(
      <ProductDetailClient
        product={{
          ...product,
          description: "First paragraph.\n\nSecond paragraph.",
        }}
      />,
    );

    const descriptionDiv = container.querySelector(
      ".product-description-content",
    );
    expect(descriptionDiv).not.toBeNull();
    expect(descriptionDiv?.querySelectorAll("p")).toHaveLength(2);
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
  });

  it("renders plain text bullet lists as <ul> elements", () => {
    const { container } = render(
      <ProductDetailClient
        product={{
          ...product,
          description: "- Item one\n- Item two\n- Item three",
        }}
      />,
    );

    const list = container.querySelector(
      ".product-description-content ul.product-description-list",
    );
    expect(list).not.toBeNull();
    expect(list?.querySelectorAll("li")).toHaveLength(3);
    expect(screen.getByText("Item one")).toBeInTheDocument();
  });

  it("renders an ALL-CAPS line in plain text as a subheading when not the first paragraph", () => {
    const { container } = render(
      <ProductDetailClient
        product={{
          ...product,
          description: "Introduction paragraph.\n\nFEATURES\n\nMore content.",
        }}
      />,
    );

    const subheading = container.querySelector(
      ".product-description-subheading",
    );
    expect(subheading).not.toBeNull();
    expect(subheading?.textContent).toBe("FEATURES");
  });

  it("renders a colon-ended line in plain text as a subheading after the first paragraph", () => {
    const { container } = render(
      <ProductDetailClient
        product={{
          ...product,
          description: "Intro text.\n\nWhat you get:\n\nList here.",
        }}
      />,
    );

    const subheading = container.querySelector(
      ".product-description-subheading",
    );
    expect(subheading).not.toBeNull();
    expect(subheading?.textContent).toBe("What you get");
  });

  it("renders the first paragraph with the intro class", () => {
    const { container } = render(
      <ProductDetailClient
        product={{
          ...product,
          description: "The opening paragraph.",
        }}
      />,
    );

    expect(
      container.querySelector(".product-description-intro"),
    ).not.toBeNull();
  });

  it("renders no description content when both description and problem are empty", () => {
    const { container } = render(
      <ProductDetailClient
        product={{ ...product, description: "", problem: "" }}
      />,
    );

    expect(container.querySelector(".product-description-content")).toBeNull();
  });
});
