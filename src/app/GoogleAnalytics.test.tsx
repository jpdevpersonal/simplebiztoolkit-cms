import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GoogleAnalytics from "./GoogleAnalytics";

const mocks = vi.hoisted(() => ({
  pathname: "/",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("next/script", () => ({
  __esModule: true,
  default: ({ children, id, src, strategy }: any) => (
    <script
      data-testid={id ?? "google-analytics-src"}
      data-strategy={strategy}
      src={src}
    >
      {children}
    </script>
  ),
}));

describe("GoogleAnalytics", () => {
  beforeEach(() => {
    mocks.pathname = "/";
  });

  it.each(["/cms", "/cms/", "/cms/faqs", "/CMS/templates"])(
    "does not load analytics scripts for CMS route %s",
    (pathname) => {
      mocks.pathname = pathname;

      const { container } = render(<GoogleAnalytics />);

      expect(container).toBeEmptyDOMElement();
    },
  );

  it("renders Google's recommended gtag scripts after the page is interactive", () => {
    render(<GoogleAnalytics />);

    const externalScript = screen.getByTestId("google-analytics-src");
    expect(externalScript).toHaveAttribute(
      "src",
      "https://www.googletagmanager.com/gtag/js?id=G-3ZQY64S5JJ",
    );
    expect(externalScript).toHaveAttribute("data-strategy", "afterInteractive");

    const inlineScript = screen.getByTestId("google-analytics-init");
    expect(inlineScript).toHaveAttribute("data-strategy", "afterInteractive");
    expect(inlineScript.textContent).toContain(
      "window.dataLayer = window.dataLayer || [];",
    );
    expect(inlineScript.textContent).toContain(
      "function gtag(){dataLayer.push(arguments);}",
    );
    expect(inlineScript.textContent).toContain("gtag('js', new Date());");
    expect(inlineScript.textContent).toContain(
      "gtag('config', 'G-3ZQY64S5JJ', { send_page_view: false });",
    );
  });

  it("is mounted at the root and excludes private layouts", () => {
    const rootLayout = readFileSync(
      join(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );
    const adminLayout = readFileSync(
      join(process.cwd(), "src/app/admin/layout.tsx"),
      "utf8",
    );

    expect(rootLayout).toContain("import GoogleAnalytics");
    expect(rootLayout).toContain("<GoogleAnalytics />");
    expect(adminLayout).not.toContain("GoogleAnalytics");
    expect(adminLayout).toContain('robots: "noindex, nofollow"');
    expect(
      readFileSync(join(process.cwd(), "src/app/(public)/layout.tsx"), "utf8"),
    ).not.toContain("<GoogleAnalytics />");
  });
});
