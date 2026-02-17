import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StickyMobileCta from "./StickyMobileCta";

vi.mock("@/components/EtsyCtaButton", () => ({
  default: () => <a href="/etsy">Etsy CTA</a>,
}));

describe("StickyMobileCta", () => {
  it("renders Etsy button and free guide link", () => {
    render(<StickyMobileCta />);

    expect(screen.getByRole("link", { name: "Etsy CTA" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Get your free guide/i }),
    ).toHaveAttribute("href", "/free");
  });
});
