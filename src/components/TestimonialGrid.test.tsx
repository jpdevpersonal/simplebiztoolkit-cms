import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TestimonialGrid from "./TestimonialGrid";

describe("TestimonialGrid", () => {
  it("renders all testimonials by default", () => {
    const { container } = render(<TestimonialGrid />);
    expect(container.querySelectorAll("blockquote").length).toBeGreaterThan(1);
  });

  it("limits testimonials by count", () => {
    const { container } = render(<TestimonialGrid count={2} />);
    expect(container.querySelectorAll("blockquote")).toHaveLength(2);
    expect(screen.getByText(/Angie/i)).toBeInTheDocument();
  });
});
