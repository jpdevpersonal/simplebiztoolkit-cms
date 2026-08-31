import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StickyMobileCta from "./StickyMobileCta";

const mocks = vi.hoisted(() => ({
  pathname: "/faq",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("@/components/EtsyCtaButton", () => ({
  default: () => <a href="/etsy">Etsy CTA</a>,
}));

describe("StickyMobileCta", () => {
  beforeEach(() => {
    mocks.pathname = "/faq";
  });

  it("renders the general Etsy and free guide actions on public content pages", () => {
    render(<StickyMobileCta />);

    expect(screen.getByRole("link", { name: "Etsy CTA" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Get your free guide/i }),
    ).toHaveAttribute("href", "/free");
  });

  it.each([
    "/templates/invoices/invoice-template",
    "/templates/invoices/invoice-template/",
    "/preview/templates/template-1",
  ])("does not render a generic shop CTA on %s", (pathname) => {
    mocks.pathname = pathname;

    const { container } = render(<StickyMobileCta />);

    expect(container).toBeEmptyDOMElement();
  });

  it("keeps the general CTA on template category pages", () => {
    mocks.pathname = "/templates/invoices";

    render(<StickyMobileCta />);

    expect(screen.getByRole("link", { name: "Etsy CTA" })).toBeInTheDocument();
  });
});
