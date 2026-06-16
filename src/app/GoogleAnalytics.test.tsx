import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GoogleAnalytics from "./GoogleAnalytics";

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
      "gtag('config', 'G-3ZQY64S5JJ');",
    );
  });

  it("is mounted only by the public layout, not root or admin layouts", () => {
    const publicLayout = readFileSync(
      join(process.cwd(), "src/app/(public)/layout.tsx"),
      "utf8",
    );
    const rootLayout = readFileSync(
      join(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );
    const adminLayout = readFileSync(
      join(process.cwd(), "src/app/admin/layout.tsx"),
      "utf8",
    );

    expect(publicLayout).toContain("import GoogleAnalytics");
    expect(publicLayout).toContain("<GoogleAnalytics />");
    expect(rootLayout).not.toContain("GoogleAnalytics");
    expect(adminLayout).not.toContain("GoogleAnalytics");
    expect(adminLayout).toContain('robots: "noindex, nofollow"');
  });
});
