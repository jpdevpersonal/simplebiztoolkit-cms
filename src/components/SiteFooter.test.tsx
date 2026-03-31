import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SiteFooter from "./SiteFooter";

describe("SiteFooter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-03T12:00:00.000Z"));
  });

  it("renders key links and current year", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: "All Templates" })).toHaveAttribute(
      "href",
      "/products",
    );
    expect(screen.getByRole("link", { name: "Etsy Shop" })).toHaveAttribute(
      "href",
      "https://www.etsy.com/shop/simplebiztoolkit",
    );
    expect(screen.getByText(/© 2026/)).toBeInTheDocument();
  });
});
