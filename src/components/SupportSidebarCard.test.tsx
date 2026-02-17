import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SupportSidebarCard from "./SupportSidebarCard";

describe("SupportSidebarCard", () => {
  it("renders support copy and links", () => {
    render(
      <SupportSidebarCard
        description="Help text"
        linksHeading="Related"
        links={[
          { href: "/faq", label: "FAQ" },
          { href: "https://example.com", label: "External", external: true },
        ]}
      />,
    );

    expect(screen.getByText("Need more help?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact page" })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(screen.getByRole("link", { name: "FAQ" })).toHaveAttribute(
      "href",
      "/faq",
    );
    expect(screen.getByRole("link", { name: "External" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });
});
