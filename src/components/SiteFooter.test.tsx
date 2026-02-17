import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SiteFooter from "./SiteFooter";

describe("SiteFooter", () => {
  it("renders key links and current year", () => {
    const year = String(new Date().getFullYear());
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute(
      "href",
      "/products",
    );
    expect(screen.getByRole("link", { name: "Etsy Shop" })).toHaveAttribute(
      "href",
      "https://www.etsy.com/shop/simplebiztoolkit",
    );
    expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument();
  });
});
