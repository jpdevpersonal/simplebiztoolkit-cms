import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import JsonLd from "./JsonLd";

describe("JsonLd", () => {
  it("renders application/ld+json script", () => {
    const { container } = render(
      <JsonLd
        json={{ "@context": "https://schema.org", "@type": "FAQPage" }}
      />,
    );

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).toBeInTheDocument();
    expect(script?.textContent).toContain("FAQPage");
  });
});
