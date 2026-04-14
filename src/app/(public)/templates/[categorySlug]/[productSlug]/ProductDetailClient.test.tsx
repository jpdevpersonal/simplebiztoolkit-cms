import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
});
